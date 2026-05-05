use serde::Serialize;
mod maintenance;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;
use base64::{engine::general_purpose, Engine as _};
use walkdir::WalkDir;

#[derive(Serialize, Clone)]
struct InstalledPackage {
  name: String,
  version: String,
  manager: String,
  path: String,
  size: u64,
  used: Option<bool>,
  is_global: bool,
  icon: Option<String>,
  is_declared: bool, // true if in package.json dependencies
}

#[derive(Serialize)]
struct ScanResult {
  packages: Vec<InstalledPackage>,
  total_size: u64,
  total_count: usize,
  duplicates: Vec<DuplicateGroup>,
}

#[derive(Serialize)]
struct DuplicateGroup {
  package_name: String,
  locations: Vec<String>,
  total_wasted: u64,
}

// Calculate directory size using walkdir for better performance
fn calculate_dir_size(path: &Path) -> u64 {
  walkdir::WalkDir::new(path)
    .min_depth(0)
    .into_iter()
    .filter_map(|e| e.ok())
    .filter_map(|e| e.metadata().ok())
    .filter(|m| m.is_file())
    .map(|m| m.len())
    .sum()
}

// Read declared dependencies from package.json
fn read_declared_dependencies(base_path: &Path) -> std::collections::HashSet<String> {
  use std::collections::HashSet;
  let mut declared = HashSet::new();
  let pkg_json = base_path.join("package.json");
  
  if let Ok(content) = fs::read_to_string(&pkg_json) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
      // Collect dependencies and devDependencies
      if let Some(deps) = json.get("dependencies").and_then(|d| d.as_object()) {
        for key in deps.keys() {
          declared.insert(key.clone());
        }
      }
      if let Some(dev_deps) = json.get("devDependencies").and_then(|d| d.as_object()) {
        for key in dev_deps.keys() {
          declared.insert(key.clone());
        }
      }
    }
  }
  declared
}

// Scan node_modules folder for installed npm packages
fn scan_node_modules(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  let node_modules = base_path.join("node_modules");
  
  if !node_modules.exists() {
    return packages;
  }
  
  // Read declared dependencies from package.json
  let declared = read_declared_dependencies(base_path);

  if let Ok(entries) = fs::read_dir(&node_modules) {
    for entry in entries.flatten() {
      let path = entry.path();
      if path.is_dir() {
        let name = entry.file_name().to_string_lossy().to_string();
        
        // Skip hidden folders
        if name.starts_with('.') {
          continue;
        }
        
        // Handle scoped packages (@org/pkg)
        if name.starts_with('@') {
          println!("[scan] Found scope folder: {}", name);
          if let Ok(scoped_entries) = fs::read_dir(&path) {
            for scoped_entry in scoped_entries.flatten() {
              let scoped_path = scoped_entry.path();
              if scoped_path.is_dir() {
                let sub_name = scoped_entry.file_name().to_string_lossy().to_string();
                let scoped_name = format!("{}/{}", name, sub_name);
                println!("[scan] Found scoped package: {}", scoped_name);
                
                let pkg_json = scoped_path.join("package.json");
                if !pkg_json.exists() {
                  println!("[scan] WARNING: package.json not found for {}", scoped_name);
                }
                let version = read_package_version(&pkg_json);
                let size = calculate_dir_size(&scoped_path);
                
                packages.push(InstalledPackage {
                  name: scoped_name.clone(),
                  version,
                  manager: "npm".to_string(),
                  path: scoped_path.to_string_lossy().to_string(),
                  size,
                  used: None,
                  is_global: false,
                  icon: read_icon_data(&scoped_path),
                  is_declared: declared.contains(&scoped_name),
                });
              }
            }
          }
        } else {
          // Regular package
          let pkg_json = path.join("package.json");
          let version = read_package_version(&pkg_json);
          let size = calculate_dir_size(&path);
          
          packages.push(InstalledPackage {
            name: name.clone(),
            version,
            manager: "npm".to_string(),
            path: path.to_string_lossy().to_string(),
            size,
            used: None,
            is_global: false,
            icon: read_icon_data(&path),
            is_declared: declared.contains(&name),
          });
        }
      }
    }
  }
  
  packages
}

// Read version from package.json
fn read_package_version(pkg_json: &Path) -> String {
  if let Ok(content) = fs::read_to_string(pkg_json) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
      if let Some(version) = json.get("version").and_then(|v| v.as_str()) {
        return version.to_string();
      }
    }
  }
  "unknown".to_string()
}

// Try to find an icon file inside a package folder and return a data URL (svg or base64 png/jpg)
fn read_icon_data(pkg_path: &Path) -> Option<String> {
  let candidates = [
    "logo.svg",
    "logo.png",
    "icon.svg",
    "icon.png",
    "assets/logo.svg",
    "assets/logo.png",
  ];

  for c in candidates.iter() {
    let p = pkg_path.join(c);
    if p.exists() {
      if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
        if ext.eq_ignore_ascii_case("svg") {
          if let Ok(s) = fs::read_to_string(&p) {
            // remove newlines to keep data URL compact
            let svg = s.replace('\n', "").replace('\r', "");
            return Some(format!("data:image/svg+xml;utf8,{}", svg));
          }
        } else if ext.eq_ignore_ascii_case("png") || ext.eq_ignore_ascii_case("jpg") || ext.eq_ignore_ascii_case("jpeg") {
          if let Ok(bytes) = fs::read(&p) {
            let b64 = general_purpose::STANDARD.encode(&bytes);
            let mime = if ext.eq_ignore_ascii_case("png") { "image/png" } else { "image/jpeg" };
            return Some(format!("data:{};base64,{}", mime, b64));
          }
        }
      }
    }
  }

  None
}

// Scan Python site-packages for installed pip packages
fn scan_python_packages(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  
  // Common Python package locations
  let search_paths = vec![
    base_path.join("venv/lib"),
    base_path.join(".venv/lib"),
    base_path.join("env/lib"),
  ];
  
  for search_path in search_paths {
    if !search_path.exists() {
      continue;
    }
    
    // Find site-packages folder
    if let Ok(entries) = fs::read_dir(&search_path) {
      for entry in entries.flatten() {
        let python_ver = entry.path();
        let site_packages = python_ver.join("site-packages");
        
        if site_packages.exists() {
          packages.extend(scan_site_packages(&site_packages));
        }
      }
    }
  }
  
  packages
}

fn scan_site_packages(site_packages: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  
  if let Ok(entries) = fs::read_dir(site_packages) {
    for entry in entries.flatten() {
      let path = entry.path();
      let name = entry.file_name().to_string_lossy().to_string();
      
      // Look for .dist-info directories
      if name.ends_with(".dist-info") {
        let pkg_name = name.replace(".dist-info", "").split('-').next().unwrap_or("unknown").to_string();
        let version = name.replace(".dist-info", "").split('-').nth(1).unwrap_or("unknown").to_string();
        
        // Find the actual package folder
        let pkg_folder = site_packages.join(&pkg_name);
        let size = if pkg_folder.exists() {
          calculate_dir_size(&pkg_folder) + calculate_dir_size(&path)
        } else {
          calculate_dir_size(&path)
        };
        
        packages.push(InstalledPackage {
          name: pkg_name,
          version,
          manager: "pip".to_string(),
          path: path.to_string_lossy().to_string(),
          size,
          used: None,
          is_global: false,
          icon: if pkg_folder.exists() { read_icon_data(&pkg_folder) } else { read_icon_data(&path) },
          is_declared: false,
        });
      }
    }
  }
  
  packages
}

// Scan Composer vendor folder for PHP packages
fn scan_composer_packages(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  let vendor = base_path.join("vendor");
  
  if !vendor.exists() {
    return packages;
  }
  
  if let Ok(entries) = fs::read_dir(&vendor) {
    for entry in entries.flatten() {
      let org_path = entry.path();
      if org_path.is_dir() {
        let org_name = entry.file_name().to_string_lossy().to_string();
        
        if let Ok(pkg_entries) = fs::read_dir(&org_path) {
          for pkg_entry in pkg_entries.flatten() {
            let pkg_path = pkg_entry.path();
            if pkg_path.is_dir() {
              let pkg_name = format!("{}/{}", org_name, pkg_entry.file_name().to_string_lossy());
              let composer_json = pkg_path.join("composer.json");
              let version = read_composer_version(&composer_json);
              let size = calculate_dir_size(&pkg_path);
              
              packages.push(InstalledPackage {
                name: pkg_name,
                version,
                manager: "composer".to_string(),
                path: pkg_path.to_string_lossy().to_string(),
                size,
                used: None,
                is_global: false,
                icon: read_icon_data(&pkg_path),
                is_declared: false,
              });
            }
          }
        }
      }
    }
  }
  
  packages
}

fn read_composer_version(composer_json: &Path) -> String {
  if let Ok(content) = fs::read_to_string(composer_json) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
      if let Some(version) = json.get("version").and_then(|v| v.as_str()) {
        return version.to_string();
      }
    }
  }
  "unknown".to_string()
}

// Scan Flutter .pub-cache for packages
fn scan_flutter_packages(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  
  // Read declared dependencies from pubspec.yaml
  let mut declared = std::collections::HashSet::new();
  let pubspec = base_path.join("pubspec.yaml");
  if let Ok(content) = fs::read_to_string(&pubspec) {
    if let Ok(yaml) = serde_yaml::from_str::<serde_json::Value>(&content) {
      if let Some(deps) = yaml.get("dependencies").and_then(|d| d.as_object()) {
        for key in deps.keys() {
          declared.insert(key.clone());
        }
      }
      if let Some(dev_deps) = yaml.get("dev_dependencies").and_then(|d| d.as_object()) {
        for key in dev_deps.keys() {
          declared.insert(key.clone());
        }
      }
    }
  }
  
  // Check .dart_tool/package_config.json for used packages
  let package_config = base_path.join(".dart_tool/package_config.json");
  if !package_config.exists() {
    println!("Flutter: No .dart_tool/package_config.json found at {:?}", package_config);
    return packages;
  }
  
  println!("Flutter: Scanning packages from {:?}", package_config);
  
  if let Ok(content) = fs::read_to_string(&package_config) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
      if let Some(pkgs) = json.get("packages").and_then(|p| p.as_array()) {
        println!("Flutter: Found {} packages in config", pkgs.len());
        
        for pkg in pkgs {
          if let (Some(name), Some(root_uri)) = (
            pkg.get("name").and_then(|n| n.as_str()),
            pkg.get("rootUri").and_then(|u| u.as_str())
          ) {
            // Skip relative paths pointing to project itself
            if root_uri.starts_with("../") {
              println!("Flutter: Skipping project package: {}", name);
              continue;
            }
            
            // Parse the path from rootUri
            let pkg_path = if root_uri.starts_with("file://") {
              let path_str = root_uri.replace("file://", "").replace("file:///", "");
              // Handle Windows paths
              let cleaned = if cfg!(target_os = "windows") && path_str.starts_with('/') {
                path_str.trim_start_matches('/').to_string()
              } else {
                path_str
              };
              PathBuf::from(cleaned)
            } else {
              base_path.join(root_uri)
            };
            
            // Skip if path doesn't exist
            if !pkg_path.exists() {
              println!("Flutter: Package path doesn't exist: {:?}", pkg_path);
              continue;
            }
            
            // Check if it's a local project package by checking if it's inside base_path
            let canonical_base = base_path.canonicalize().ok();
            let canonical_pkg = pkg_path.canonicalize().ok();
            
            if let (Some(base), Some(pkg)) = (canonical_base, canonical_pkg) {
              // Skip if package is inside the project folder (except .dart_tool)
              if pkg.starts_with(&base) && !pkg.to_string_lossy().contains(".dart_tool") {
                println!("Flutter: Skipping local project package: {}", name);
                continue;
              }
            }
            
            let size = calculate_dir_size(&pkg_path);
            let version = pkg.get("version").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
            
            println!("Flutter: Adding package {} v{} from {:?}", name, version, pkg_path);
            
            packages.push(InstalledPackage {
              name: name.to_string(),
              version,
              manager: "flutter".to_string(),
              path: pkg_path.to_string_lossy().to_string(),
              size,
              used: None,
              is_global: false,
              icon: read_icon_data(&pkg_path),
              is_declared: declared.contains(name),
            });
          }
        }
      }
    }
  }
  
  println!("Flutter: Total packages found: {}", packages.len());
  packages
}

// Scan Rust target folder for dependencies
fn scan_cargo_packages(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  
  // Read Cargo.lock to find dependencies
  let cargo_lock = base_path.join("Cargo.lock");
  if cargo_lock.exists() {
    if let Ok(content) = fs::read_to_string(&cargo_lock) {
      if let Ok(lock_data) = toml::from_str::<toml::Value>(&content) {
        if let Some(pkgs) = lock_data.get("package").and_then(|p| p.as_array()) {
          for pkg in pkgs {
            if let (Some(name), Some(version)) = (
              pkg.get("name").and_then(|n| n.as_str()),
              pkg.get("version").and_then(|v| v.as_str())
            ) {
              // Cargo packages are in CARGO_HOME or target/
              let size = 0; // Would need to scan CARGO_HOME/registry
              
              packages.push(InstalledPackage {
                name: name.to_string(),
                version: version.to_string(),
                manager: "cargo".to_string(),
                path: "~/.cargo/registry".to_string(),
                size,
                used: None,
                is_global: true,
                icon: None,
                is_declared: false,
              });
            }
          }
        }
      }
    }
  }
  
  packages
}

// Find duplicate packages
fn find_duplicates(packages: &[InstalledPackage]) -> Vec<DuplicateGroup> {
  use std::collections::HashMap;
  
  let mut by_name: HashMap<String, Vec<&InstalledPackage>> = HashMap::new();
  
  for pkg in packages {
    by_name.entry(pkg.name.clone()).or_default().push(pkg);
  }
  
  by_name.into_iter()
    .filter(|(_, pkgs)| pkgs.len() > 1)
    .map(|(name, pkgs)| {
      let total_wasted = pkgs.iter().skip(1).map(|p| p.size).sum();
      let locations = pkgs.iter().map(|p| p.path.clone()).collect();
      
      DuplicateGroup {
        package_name: name,
        locations,
        total_wasted,
      }
    })
    .collect()
}

// Mark packages as used by scanning project source files for import/require patterns
fn mark_usage_for_packages(base_path: &Path, packages: &mut [InstalledPackage]) {
  use regex::Regex;

  // file extensions to scan
  let exts = ["js", "jsx", "ts", "tsx", "py", "php", "dart", "rs", "go"];
  let mut files = Vec::new();

  // simple recursive walk
  let mut stack = vec![base_path.to_path_buf()];
  while let Some(p) = stack.pop() {
    if let Ok(entries) = fs::read_dir(&p) {
      for e in entries.flatten() {
        let path = e.path();
        if path.is_dir() {
          // skip node_modules and .git to speed up
          if let Some(n) = path.file_name().and_then(|s| s.to_str()) {
            if n == "node_modules" || n == ".git" || n == "venv" || n == ".venv" {
              continue;
            }
          }
          stack.push(path);
        } else if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
          if exts.contains(&ext) {
            files.push(path);
          }
        }
      }
    }
  }

  // Read files and build a big string per file (could be optimized)
  let mut file_contents = Vec::new();
  for f in files.iter() {
    if let Ok(s) = fs::read_to_string(f) {
      file_contents.push(s);
    }
  }

  for pkg in packages.iter_mut() {
    // default to false
    pkg.used = Some(false);
    let name = pkg.name.clone();

    // Create some heuristics to detect usage
    let patterns = vec![
      format!("require\\(['\"]{}['\"]\\)", regex::escape(&name)),
      format!("import .* from ['\"]{}['\"]", regex::escape(&name)),
      format!("from {} import", regex::escape(&name)),
      format!("use {}::", regex::escape(&name)),
      format!("extern crate {}", regex::escape(&name)),
    ];

    let regexes: Vec<Regex> = patterns.into_iter().filter_map(|p| Regex::new(&p).ok()).collect();

    for content in file_contents.iter() {
      for r in regexes.iter() {
        if r.is_match(content) {
          pkg.used = Some(true);
          break;
        }
      }
      if pkg.used == Some(true) { break; }
      // also simple substring fallback
      if content.contains(&name) {
        pkg.used = Some(true);
        break;
      }
    }
  }
}

// Detect globally installed npm packages
#[tauri::command]
fn scan_global_npm() -> Vec<InstalledPackage> {
  println!("Scanning global npm (Fast Direct Scan)");
  use std::process::Command;
  let mut out = Vec::new();
  
  let npm_cmd = if cfg!(windows) { "npm.cmd" } else { "npm" };
  
  if let Ok(root_out) = Command::new(npm_cmd).arg("root").arg("-g").output() {
    if root_out.status.success() {
      if let Ok(root_str) = String::from_utf8(root_out.stdout) {
        let root_path = Path::new(root_str.trim());
        if root_path.exists() {
          if let Ok(entries) = fs::read_dir(root_path) {
            for entry in entries.flatten() {
              let path = entry.path();
              if path.is_dir() {
                let name = entry.file_name().to_string_lossy().to_string();
                
                // Handle scoped packages
                if name.starts_with('@') {
                   if let Ok(sub_entries) = fs::read_dir(&path) {
                     for sub_entry in sub_entries.flatten() {
                       let sub_path = sub_entry.path();
                       if sub_path.is_dir() {
                         let sub_name = sub_entry.file_name().to_string_lossy().to_string();
                         let full_name = format!("{}/{}", name, sub_name);
                         if let Some(pkg) = read_npm_package_info(&sub_path, &full_name) {
                           out.push(pkg);
                         }
                       }
                     }
                   }
                } else {
                  if let Some(pkg) = read_npm_package_info(&path, &name) {
                    out.push(pkg);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  println!("Found {} global npm packages", out.len());
  out
}

fn read_npm_package_info(path: &Path, name: &str) -> Option<InstalledPackage> {
  let pkg_json_path = path.join("package.json");
  if pkg_json_path.exists() {
    if let Ok(content) = fs::read_to_string(&pkg_json_path) {
      if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        let version = json.get("version").and_then(|v| v.as_str()).unwrap_or("0.0.0").to_string();
        return Some(InstalledPackage {
          name: name.to_string(),
          version,
          manager: "npm".to_string(),
          path: path.to_string_lossy().to_string(),
          size: calculate_dir_size(path),
          used: None,
          is_global: true,
          icon: read_icon_data(path),
          is_declared: false,
        });
      }
    }
  }
  None
}

// Detect globally installed yarn packages
#[tauri::command]
fn scan_global_yarn() -> Vec<InstalledPackage> {
    println!("Scanning global yarn");
    use std::process::Command;
    let mut out = Vec::new();
    let yarn_cmd = if cfg!(windows) { "yarn.cmd" } else { "yarn" };

    if let Ok(list_out) = Command::new(yarn_cmd).args(["global", "list", "--json"]).output() {
        if list_out.status.success() {
            if let Ok(json_str) = String::from_utf8(list_out.stdout) {
                // Yarn JSON output is a bit complex, let's try to parse the lines
                for line in json_str.lines() {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(line) {
                        if let Some(data) = val.get("data").and_then(|d| d.as_str()) {
                            if data.contains('@') {
                                let parts: Vec<&str> = data.split('@').collect();
                                if parts.len() >= 2 {
                                    let name = parts[0].to_string();
                                    let version = parts[1].to_string();
                                    out.push(InstalledPackage {
                                        name,
                                        version,
                                        manager: "yarn".to_string(),
                                        path: String::new(),
                                        size: 0,
                                        used: None,
                                        is_global: true,
                                        icon: None,
                                        is_declared: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    println!("Found {} global yarn packages", out.len());
    out
}

// Detect globally installed pnpm packages
#[tauri::command]
fn scan_global_pnpm() -> Vec<InstalledPackage> {
    println!("Scanning global pnpm");
    use std::process::Command;
    let mut out = Vec::new();
    let pnpm_cmd = if cfg!(windows) { "pnpm.cmd" } else { "pnpm" };

    if let Ok(list_out) = Command::new(pnpm_cmd).args(["list", "-g", "--json"]).output() {
        if list_out.status.success() {
            if let Ok(json_str) = String::from_utf8(list_out.stdout) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&json_str) {
                    if let Some(arr) = val.as_array() {
                        for item in arr {
                            if let Some(deps) = item.get("dependencies").and_then(|d| d.as_object()) {
                                for (name, v) in deps.iter() {
                                    let version = v.get("version").and_then(|s| s.as_str()).unwrap_or("unknown").to_string();
                                    let path = v.get("path").and_then(|s| s.as_str()).unwrap_or("").to_string();
                                    
                                    out.push(InstalledPackage {
                                        name: name.clone(),
                                        version,
                                        manager: "pnpm".to_string(),
                                        path: path.clone(),
                                        size: if !path.is_empty() { calculate_dir_size(Path::new(&path)) } else { 0 },
                                        used: None,
                                        is_global: true,
                                        icon: if !path.is_empty() { read_icon_data(Path::new(&path)) } else { None },
                                        is_declared: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    println!("Found {} global pnpm packages", out.len());
    out
}

// Detect globally installed pip packages
#[tauri::command]
fn scan_global_pip() -> Vec<InstalledPackage> {
  println!("Scanning global pip");
  use std::process::Command;
  let mut out = Vec::new();
  
  let python_cmds = vec!["python", "python3", "py"];
  
  for cmd in python_cmds {
    // get site-packages path
    if let Ok(sp_out) = Command::new(cmd).args(["-c", "import site, json; print(json.dumps(site.getsitepackages()))"]).output() {
        if sp_out.status.success() {
            if let Ok(json_str) = String::from_utf8(sp_out.stdout) {
                if let Ok(arr) = serde_json::from_str::<Vec<String>>(&json_str) {
                    if !arr.is_empty() {
                        let site_pkg = PathBuf::from(&arr[0]);
                        if let Ok(list_out) = Command::new(cmd).args(["-m", "pip", "list", "--format=json"]).output() {
                            if list_out.status.success() {
                                if let Ok(pkgs_str) = String::from_utf8(list_out.stdout) {
                                    if let Ok(pkgs) = serde_json::from_str::<serde_json::Value>(&pkgs_str) {
                                        if let Some(pkg_arr) = pkgs.as_array() {
                                            for p in pkg_arr {
                                                if let (Some(name), Some(version)) = (p.get("name").and_then(|n| n.as_str()), p.get("version").and_then(|v| v.as_str())) {
                                                    let variations = vec![
                                                        name.to_string(),
                                                        name.to_lowercase(),
                                                        name.replace('-', "_"),
                                                        name.to_lowercase().replace('-', "_"),
                                                    ];
                                                    
                                                    let mut path = site_pkg.join(name);
                                                    let mut size = 0;
                                                    
                                                    for var in variations {
                                                        let p = site_pkg.join(&var);
                                                        if p.exists() {
                                                            path = p;
                                                            size = calculate_dir_size(&path);
                                                            break;
                                                        }
                                                    }
                                                    
                                                    out.push(InstalledPackage {
                                                        name: name.to_string(),
                                                        version: version.to_string(),
                                                        manager: "pip".to_string(),
                                                        path: path.to_string_lossy().to_string(),
                                                        size,
                                                        used: None,
                                                        is_global: true,
                                                        icon: read_icon_data(&path),
                                                        is_declared: false,
                                                    });
                                                }
                                            }
                                            // If we found packages, we can stop searching other python commands
                                            if !out.is_empty() {
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
  }
  println!("Found {} global pip packages", out.len());
  out
}

// Detect globally installed cargo packages
#[tauri::command]
fn scan_global_cargo() -> Vec<InstalledPackage> {
    println!("Scanning global cargo");
    use std::process::Command;
    let mut out = Vec::new();
    
    // get cargo home or default
    let cargo_home = std::env::var("CARGO_HOME").unwrap_or_else(|_| {
        if cfg!(windows) {
            format!("{}\\.cargo", std::env::var("USERPROFILE").unwrap_or_default())
        } else {
            format!("{}/.cargo", std::env::var("HOME").unwrap_or_default())
        }
    });
    let bin_path = Path::new(&cargo_home).join("bin");

    if let Ok(list_out) = Command::new("cargo").arg("install").arg("--list").output() {
        if list_out.status.success() {
            if let Ok(s) = String::from_utf8(list_out.stdout) {
                // Cargo output is text-based: "package-name v0.1.0:"
                for line in s.lines() {
                    if line.contains(" v") && line.ends_with(':') {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            let name = parts[0].to_string();
                            let version = parts[1].trim_start_matches('v').trim_end_matches(':').to_string();
                            let mut path = bin_path.join(&name);
                            if cfg!(windows) {
                                path.set_extension("exe");
                            }
                            
                            let size = if path.exists() {
                                fs::metadata(&path).map(|m| m.len()).unwrap_or(0)
                            } else { 0 };

                            out.push(InstalledPackage {
                                name: name.clone(),
                                version,
                                manager: "cargo".to_string(),
                                path: path.to_string_lossy().to_string(),
                                size,
                                used: None,
                                is_global: true,
                                icon: None,
                                is_declared: false,
                            });
                        }
                    }
                }
            }
        }
    }
    println!("Found {} global cargo packages", out.len());
    out
}

// Detect globally installed composer packages
#[tauri::command]
fn scan_global_composer() -> Vec<InstalledPackage> {
    println!("Scanning global composer");
    use std::process::Command;
    let mut out = Vec::new();
    
    if let Ok(list_out) = Command::new("composer").args(["global", "show", "--format=json"]).output() {
        if list_out.status.success() {
            if let Ok(s) = String::from_utf8(list_out.stdout) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(installed) = val.get("installed").and_then(|i| i.as_array()) {
                        for p in installed {
                            if let (Some(name), Some(version)) = (p.get("name").and_then(|n| n.as_str()), p.get("version").and_then(|v| v.as_str())) {
                                out.push(InstalledPackage {
                                    name: name.to_string(),
                                    version: version.to_string(),
                                    manager: "composer".to_string(),
                                    path: String::new(), // composer doesn't easily give paths for global packages
                                    size: 0,
                                    used: None,
                                    is_global: true,
                                    icon: None,
                                    is_declared: false,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    println!("Found {} global composer packages", out.len());
    out
}

// Detect globally installed gem packages
#[tauri::command]
fn scan_global_gem() -> Vec<InstalledPackage> {
    println!("Scanning global gem");
    use std::process::Command;
    let mut out = Vec::new();
    
    if let Ok(list_out) = Command::new("gem").args(["list", "--local"]).output() {
        if list_out.status.success() {
            if let Ok(s) = String::from_utf8(list_out.stdout) {
                for line in s.lines() {
                    if line.contains('(') && line.contains(')') {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if !parts.is_empty() {
                            let name = parts[0].to_string();
                            let version = parts[1].trim_matches(|c| c == '(' || c == ')').split(',').next().unwrap_or("unknown").to_string();
                            
                            out.push(InstalledPackage {
                                name,
                                version,
                                manager: "gem".to_string(),
                                path: String::new(),
                                size: 0,
                                used: None,
                                is_global: true,
                                icon: None,
                                is_declared: false,
                            });
                        }
                    }
                }
            }
        }
    }
    println!("Found {} global gem packages", out.len());
    out
}

#[tauri::command]
fn get_npm_global_path() -> Option<String> {
  use std::process::Command;
  if let Ok(root_out) = Command::new("npm").arg("root").arg("-g").output() {
    if root_out.status.success() {
      if let Ok(root) = String::from_utf8(root_out.stdout) {
        Some(root.trim().to_string())
      } else {
        None
      }
    } else {
      None
    }
  } else {
    None
  }
}

#[tauri::command]
fn get_pip_global_path() -> Option<String> {
  use std::process::Command;
  if let Ok(sp_out) = Command::new("python").args(["-c", "import site, json; print(json.dumps(site.getsitepackages()))"]).output() {
    if sp_out.status.success() {
      if let Ok(json_str) = String::from_utf8(sp_out.stdout) {
        if let Ok(arr) = serde_json::from_str::<Vec<String>>(&json_str) {
          if !arr.is_empty() {
            Some(arr[0].clone())
          } else {
            None
          }
        } else {
          None
        }
      } else {
        None
      }
    } else {
      None
    }
  } else {
    None
  }
}

#[tauri::command]
async fn get_toolchain_info() -> Result<serde_json::Value, String> {
  use std::process::Command;
  let mut tools = serde_json::Map::new();

  let check_tool = |cmd: &str, args: &[&str]| -> String {
    if let Ok(out) = Command::new(cmd).args(args).output() {
      if out.status.success() {
        if let Ok(s) = String::from_utf8(out.stdout) {
          return s.trim().to_string();
        }
      }
    }
    "Not found".to_string()
  };

  tools.insert("node".to_string(), serde_json::Value::String(check_tool("node", &["--version"])));
  tools.insert("npm".to_string(), serde_json::Value::String(check_tool("npm", &["--version"])));
  tools.insert("python".to_string(), serde_json::Value::String(check_tool("python", &["--version"])));
  tools.insert("pip".to_string(), serde_json::Value::String(check_tool("pip", &["--version"])));
  tools.insert("git".to_string(), serde_json::Value::String(check_tool("git", &["--version"])));
  tools.insert("cargo".to_string(), serde_json::Value::String(check_tool("cargo", &["--version"])));
  tools.insert("rustc".to_string(), serde_json::Value::String(check_tool("rustc", &["--version"])));

  Ok(serde_json::Value::Object(tools))
}

#[tauri::command]
async fn run_maintenance_scan(projects: Vec<serde_json::Value>) -> Result<maintenance::MaintenanceStats, String> {
  let mut unused_packages = Vec::new();
  
  for p in projects {
    if let (Some(path_str), Some(name), Some(tech)) = (p.get("path").and_then(|v| v.as_str()), p.get("name").and_then(|v| v.as_str()), p.get("technologies").and_then(|v| v.as_array())) {
      let path = Path::new(path_str);
      // Check if it's an NPM project based on technologies or file existence
      let is_npm = tech.iter().any(|t| t.as_str() == Some("npm") || t.as_str() == Some("nodejs") || t.as_str() == Some("react") || t.as_str() == Some("nextjs"));
      
      if is_npm {
        unused_packages.extend(maintenance::scan_unused_npm(path, name));
      }
    }
  }

  let caches = maintenance::get_system_caches();
  let total_savings = caches.iter().map(|c| c.size).sum();

  Ok(maintenance::MaintenanceStats {
    unused_packages,
    caches,
    total_savings,
  })
}

#[tauri::command]
async fn clean_selected_caches(paths: Vec<String>) -> Result<(), String> {
  for path in paths {
    let p = Path::new(&path);
    if p.exists() {
      if p.is_dir() {
        let _ = fs::remove_dir_all(p);
      } else {
        let _ = fs::remove_file(p);
      }
    }
  }
  Ok(())
}

#[tauri::command]
fn scan_system_packages() -> Result<serde_json::Value, String> {
  println!("Scanning system packages (Parallel Mode)");
  
  use std::thread;
  
  let t_npm = thread::spawn(|| scan_global_npm());
  let t_yarn = thread::spawn(|| scan_global_yarn());
  let t_pnpm = thread::spawn(|| scan_global_pnpm());
  let t_pip = thread::spawn(|| scan_global_pip());
  let t_cargo = thread::spawn(|| scan_global_cargo());
  let t_composer = thread::spawn(|| scan_global_composer());
  let t_gem = thread::spawn(|| scan_global_gem());
  
  let npm_packages = t_npm.join().unwrap_or_default();
  let yarn_packages = t_yarn.join().unwrap_or_default();
  let pnpm_packages = t_pnpm.join().unwrap_or_default();
  let pip_packages = t_pip.join().unwrap_or_default();
  let cargo_packages = t_cargo.join().unwrap_or_default();
  let composer_packages = t_composer.join().unwrap_or_default();
  let gem_packages = t_gem.join().unwrap_or_default();
  
  let mut all_packages = Vec::new();
  all_packages.extend(npm_packages);
  all_packages.extend(yarn_packages);
  all_packages.extend(pnpm_packages);
  all_packages.extend(pip_packages);
  all_packages.extend(cargo_packages);
  all_packages.extend(composer_packages);
  all_packages.extend(gem_packages);
  
  let total_size: u64 = all_packages.iter().map(|p| p.size).sum();
  let total_count = all_packages.len();
  
  let npm_path = get_npm_global_path();
  let pip_path = get_pip_global_path();
  
  let mut paths = serde_json::Map::new();
  if let Some(npm) = npm_path {
    paths.insert("npm".to_string(), serde_json::Value::String(npm));
  }
  if let Some(pip) = pip_path {
    paths.insert("pip".to_string(), serde_json::Value::String(pip));
  }
  
  Ok(serde_json::json!({
    "packages": all_packages,
    "total_size": total_size,
    "total_count": total_count,
    "paths": paths,
    "duplicates": []
  }))
}

#[tauri::command]
fn scan_project(folder: String) -> Result<serde_json::Value, String> {
  println!("Scanning folder: {}", folder);
  let path = Path::new(&folder);
  if !path.exists() {
    return Err("Folder does not exist".into());
  }
  
  let mut all_packages = Vec::new();

  // Scan all package types (local/project)
  all_packages.extend(scan_node_modules(path));
  all_packages.extend(scan_python_packages(path));
  all_packages.extend(scan_composer_packages(path));
  all_packages.extend(scan_flutter_packages(path));
  all_packages.extend(scan_cargo_packages(path));

  // Mark usage by scanning project source files
  mark_usage_for_packages(path, &mut all_packages);
  
  // Calculate totals
  let total_size: u64 = all_packages.iter().map(|p| p.size).sum();
  let total_count = all_packages.len();
  
  // Find duplicates
  let duplicates = find_duplicates(&all_packages);
  
  let result = ScanResult {
    packages: all_packages,
    total_size,
    total_count,
    duplicates,
  };
  
  println!("Found {} packages", result.packages.len());
  serde_json::to_value(&result).map_err(|e| e.to_string())
}

// Stream scan: emit packages as they are discovered to the frontend
#[tauri::command]
fn scan_project_stream(app: tauri::AppHandle, folder: String) -> Result<String, String> {
  println!("Streaming scan for folder: {}", folder);

  let folder_path = folder.clone();

  // spawn a background thread to avoid blocking the caller
  std::thread::spawn(move || {
    let base = Path::new(&folder_path);
    if !base.exists() {
      let _ = app.emit("scan-error", serde_json::json!({ "error": "Folder does not exist" }));
      return;
    }

    let mut all_packages: Vec<InstalledPackage> = Vec::new();

    // helper to emit a package event
    let emit_pkg = |ah: &tauri::AppHandle, pkg: &InstalledPackage| {
      if let Ok(v) = serde_json::to_value(pkg) {
        let _ = ah.emit("scan-progress", serde_json::json!({ "package": v }));
      }
    };

    // Scan node modules
    let node_pkgs = scan_node_modules(base);
    for pkg in node_pkgs.into_iter() {
      emit_pkg(&app, &pkg);
      all_packages.push(pkg);
    }

    // Scan python packages
    let py_pkgs = scan_python_packages(base);
    for pkg in py_pkgs.into_iter() {
      emit_pkg(&app, &pkg);
      all_packages.push(pkg);
    }

    // Composer
    let comp_pkgs = scan_composer_packages(base);
    for pkg in comp_pkgs.into_iter() {
      emit_pkg(&app, &pkg);
      all_packages.push(pkg);
    }

    // Flutter
    let fl_pkgs = scan_flutter_packages(base);
    for pkg in fl_pkgs.into_iter() {
      emit_pkg(&app, &pkg);
      all_packages.push(pkg);
    }

    // Cargo
    let cargo_pkgs = scan_cargo_packages(base);
    for pkg in cargo_pkgs.into_iter() {
      emit_pkg(&app, &pkg);
      all_packages.push(pkg);
    }

    // After collecting packages, mark usage (this may be expensive)
    mark_usage_for_packages(base, &mut all_packages);

    // Emit updated package info after usage marking
    for pkg in all_packages.iter() {
      if let Ok(v) = serde_json::to_value(pkg) {
        let _ = app.emit("scan-progress", serde_json::json!({ "package": v }));
      }
    }

    // totals and duplicates
    let total_size: u64 = all_packages.iter().map(|p| p.size).sum();
    let total_count = all_packages.len();
    let duplicates = find_duplicates(&all_packages);

    let result = ScanResult {
      packages: all_packages.clone(),
      total_size,
      total_count,
      duplicates,
    };

    if let Ok(v) = serde_json::to_value(&result) {
      // Include the folder path so frontend can associate the scan with the project
      let _ = app.emit("scan-complete", serde_json::json!({ "result": v, "project_path": folder_path }));
    }
  });

  Ok("started".into())
}

#[tauri::command]
fn delete_package(path: &str) -> Result<String, String> {
  use std::fs;
  
  let pkg_path = Path::new(path);
  
  if !pkg_path.exists() {
    return Err(format!("Path does not exist: {}", path));
  }
  
  if pkg_path.is_dir() {
    fs::remove_dir_all(pkg_path)
      .map_err(|e| format!("Failed to delete directory: {}", e))?;
  } else {
    fs::remove_file(pkg_path)
      .map_err(|e| format!("Failed to delete file: {}", e))?;
  }
  
  Ok(format!("Deleted: {}", path))
}

#[tauri::command]
fn run_manager_cmd(app: tauri::AppHandle, manager: String, action: String, pkg: Option<String>, folder: Option<String>) -> Result<String, String> {
  use std::process::Command;
  let mut cmd;
  match manager.as_str() {
    "npm" | "npm-lock" => {
      if action == "install" {
        cmd = Command::new("npm");
        cmd.arg("install");
        if let Some(p) = pkg { cmd.arg(p); }
      } else if action == "list" {
        cmd = Command::new("npm");
        cmd.args(["ls", "--depth=0"]);
      } else {
        return Err("Unsupported action for npm".into());
      }
    }
    "python" => {
      if action == "install" {
        cmd = Command::new("python3");
        cmd.args(["-m", "pip", "install"]);
        if let Some(p) = pkg { cmd.arg(p); }
      } else if action == "list" {
        cmd = Command::new("python3");
        cmd.args(["-m", "pip", "list"]);
      } else {
        return Err("Unsupported action for python".into());
      }
    }
    "cargo" => {
      if action == "install" {
        cmd = Command::new("cargo");
        if let Some(p) = pkg { cmd.args(["add", &p]); } else { return Err("cargo add requires package".into()); }
      } else if action == "list" {
        cmd = Command::new("cargo");
        cmd.arg("tree");
      } else { return Err("Unsupported action for cargo".into()); }
    }
    "go" => {
      if action == "install" {
        cmd = Command::new("go");
        cmd.args(["mod", "tidy"]);
      } else if action == "add" && pkg.is_some() {
        cmd = Command::new("go");
        cmd.args(["get", &pkg.unwrap()]);
      } else {
        return Err("Unsupported action for go".into());
      }
    }
    "flutter" => {
      if action == "install" {
        cmd = Command::new("flutter");
        cmd.args(["pub", "get"]);
      } else if action == "add" && pkg.is_some() {
        cmd = Command::new("flutter");
        cmd.args(["pub", "add", &pkg.unwrap()]);
      } else {
        return Err("Unsupported action for flutter".into());
      }
    }
    "poetry" => {
      if action == "install" {
        cmd = Command::new("poetry");
        cmd.arg("install");
      } else if action == "add" && pkg.is_some() {
        cmd = Command::new("poetry");
        cmd.args(["add", &pkg.unwrap()]);
      } else {
        return Err("Unsupported action for poetry".into());
      }
    }
    &_ => {
      return Err("Unsupported manager".into());
    }
  }

  if let Some(dir) = folder {
    cmd.current_dir(dir);
  }

  // Spawn the command and stream stdout/stderr lines as events back to the frontend
  let mut child = cmd.stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped()).spawn().map_err(|e| e.to_string())?;

  let app_handle = app.clone();

  // stdout thread
  if let Some(stdout) = child.stdout.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stdout);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("pkggui-log", serde_json::json!({ "stream": "stdout", "line": l }));
        }
      }
    });
  }

  // stderr thread
  if let Some(stderr) = child.stderr.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stderr);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("pkggui-log", serde_json::json!({ "stream": "stderr", "line": l }));
        }
      }
    });
  }

  // wait for exit in a background thread so we can emit final status when done
  let ah = app_handle.clone();
  std::thread::spawn(move || {
    if let Ok(exit) = child.wait() {
      let code = exit.code();
      let _ = ah.emit("pkggui-log", serde_json::json!({ "stream": "exit", "code": code }));
    } else {
      let _ = ah.emit("pkggui-log", serde_json::json!({ "stream": "exit", "code": null }));
    }
  });

  Ok("started".into())
}

#[tauri::command]
fn execute_scaffold_command(app: tauri::AppHandle, command: String, args: Vec<String>, folder: String) -> Result<String, String> {
  use std::process::Command;
  let mut cmd;
  
  if cfg!(target_os = "windows") {
    // For Windows, use cmd /c if the command is not a direct executable or to handle batch files/npx
    cmd = Command::new("cmd");
    cmd.arg("/c");
    cmd.arg(&command);
  } else {
    cmd = Command::new(&command);
  }
  
  cmd.args(args);
  cmd.current_dir(folder);

  // Spawn the command and stream stdout/stderr lines as events back to the frontend
  // Set stdin to null to force non-interactive mode and prevent hanging
  let mut child = cmd
    .stdin(std::process::Stdio::null())
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped())
    .spawn()
    .map_err(|e| format!("Failed to spawn process: {}", e))?;

  let app_handle = app.clone();

  // stdout thread
  if let Some(stdout) = child.stdout.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stdout);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("scaffold-log", serde_json::json!({ "stream": "stdout", "line": l }));
        }
      }
    });
  }

  // stderr thread
  if let Some(stderr) = child.stderr.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stderr);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("scaffold-log", serde_json::json!({ "stream": "stderr", "line": l }));
        }
      }
    });
  }

  // wait for exit in a background thread
  let ah = app_handle.clone();
  std::thread::spawn(move || {
    if let Ok(exit) = child.wait() {
      let code = exit.code();
      let _ = ah.emit("scaffold-log", serde_json::json!({ "stream": "exit", "code": code }));
    }
  });

  Ok("started".into())
}

#[tauri::command]
fn write_boilerplate_file(file_path: String, content: String) -> Result<String, String> {
  let path = Path::new(&file_path);
  
  // Create parent directories if they don't exist
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)
      .map_err(|e| format!("Failed to create directories for {}: {}", file_path, e))?;
  }
  
  // Write the file
  fs::write(path, &content)
    .map_err(|e| format!("Failed to write file {}: {}", file_path, e))?;
  
  Ok(format!("Created: {}", file_path))
}

// Open a folder picker from the Rust side (avoids needing the dialog plugin allowlist)
#[tauri::command]
fn pick_folder(app: tauri::AppHandle) -> Option<String> {
  app.dialog().file().blocking_pick_folder().map(|p| p.to_string())
}

// Framework detection and info
#[derive(Serialize)]
struct Framework {
  name: String,
  version: String,
  path: Option<String>,
  package_manager: String,
  installed: bool,
}

#[tauri::command]
fn detect_frameworks() -> Vec<Framework> {
  use std::process::Command;
  use std::env;
  use std::path::Path;
  let mut frameworks = Vec::new();

  // Helper function to expand environment variables
  fn expand_env_var(path: &str) -> String {
    let mut result = path.to_string();
    if path.contains('%') {
      // Extract variable name between %
      if let Some(start) = path.find('%') {
        if let Some(end) = path[start+1..].find('%') {
          let var_name = &path[start+1..start+1+end];
          if let Ok(var_value) = env::var(var_name) {
            result = path.replace(&format!("%{}%", var_name), &var_value);
          }
        }
      }
    }
    result
  }

  // Get all PATH entries from environment
  let mut search_paths = Vec::new();
  
  // Get system PATH
  if let Ok(path_var) = env::var("PATH") {
    for entry in path_var.split(';') {
      let expanded = expand_env_var(entry.trim());
      if !expanded.is_empty() {
        search_paths.push(expanded);
      }
    }
  }

  // Also check common installation locations
  let common_paths = vec![
    "C:\\Program Files\\nodejs",
    "C:\\Python39",
    "C:\\Python310",
    "C:\\Python311",
    "C:\\Python312",
    "D:\\MicroSaas\\flutter\\bin",
    "D:\\flutter\\bin",
    "E:\\flutter\\bin",
  ];
  search_paths.extend(common_paths.iter().map(|s| s.to_string()));

  // Node.js
  if let Ok(output) = Command::new("node").arg("--version").output() {
    if output.status.success() {
      let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let path = Command::new("where").arg("node").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Node.js".to_string(),
        version,
        path,
        package_manager: "npm".to_string(),
        installed: true,
      });
    }
  }

  // React (check if react is globally installed)
  if let Ok(output) = Command::new("npm").args(["list", "-g", "react"]).output() {
    if output.status.success() {
      let output_str = String::from_utf8_lossy(&output.stdout);
      if output_str.contains("react@") {
        let version = output_str.lines()
          .find(|l| l.contains("react@"))
          .and_then(|l| l.split('@').nth(1))
          .and_then(|v| v.split_whitespace().next())
          .unwrap_or("unknown")
          .to_string();
        
        frameworks.push(Framework {
          name: "React".to_string(),
          version,
          path: Some("Global npm".to_string()),
          package_manager: "npm".to_string(),
          installed: true,
        });
      }
    }
  }

  // Expo CLI
  if let Ok(output) = Command::new("expo").arg("--version").output() {
    if output.status.success() {
      let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let path = Command::new("where").arg("expo").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Expo".to_string(),
        version,
        path,
        package_manager: "npm".to_string(),
        installed: true,
      });
    }
  }

  // Python
  if let Ok(output) = Command::new("python").arg("--version").output() {
    if output.status.success() {
      let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let path = Command::new("where").arg("python").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Python".to_string(),
        version,
        path,
        package_manager: "pip".to_string(),
        installed: true,
      });
    }
  }

  // Flutter - search in PATH and common locations
  let mut flutter_found = false;
  
  // Try standard command first
  if let Ok(output) = Command::new("flutter").arg("--version").output() {
    if output.status.success() {
      let full = String::from_utf8_lossy(&output.stdout);
      let version = full.lines().next().unwrap_or("").replace("Flutter ", "").trim().to_string();
      let path = Command::new("where").arg("flutter").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Flutter".to_string(),
        version,
        path,
        package_manager: "pub".to_string(),
        installed: true,
      });
      flutter_found = true;
    }
  }

  // If not found via command, search in paths
  if !flutter_found {
    for search_path in &search_paths {
      let flutter_path = Path::new(search_path).join("flutter.bat");
      if flutter_path.exists() {
        if let Ok(output) = Command::new(&flutter_path).arg("--version").output() {
          if output.status.success() {
            let full = String::from_utf8_lossy(&output.stdout);
            let version = full.lines().next().unwrap_or("").replace("Flutter ", "").trim().to_string();
            
            frameworks.push(Framework {
              name: "Flutter".to_string(),
              version,
              path: Some(flutter_path.to_string_lossy().to_string()),
              package_manager: "pub".to_string(),
              installed: true,
            });
            break;
          }
        }
      }
    }
  }

  // Java - check JAVA_HOME and PATH
  let mut java_found = false;
  
  // Try standard command first
  if let Ok(output) = Command::new("java").arg("-version").output() {
    if output.status.success() || !output.stderr.is_empty() {
      let version_str = String::from_utf8_lossy(&output.stderr);
      let version = version_str.lines()
        .next()
        .unwrap_or("")
        .to_string();
      let path = Command::new("where").arg("java").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Java".to_string(),
        version,
        path,
        package_manager: "maven".to_string(),
        installed: true,
      });
      java_found = true;
    }
  }

  // If not found, check JAVA_HOME
  if !java_found {
    if let Ok(java_home) = env::var("JAVA_HOME") {
      let java_path = Path::new(&java_home).join("bin").join("java.exe");
      if java_path.exists() {
        if let Ok(output) = Command::new(&java_path).arg("-version").output() {
          if output.status.success() || !output.stderr.is_empty() {
            let version_str = String::from_utf8_lossy(&output.stderr);
            let version = version_str.lines().next().unwrap_or("").to_string();
            
            frameworks.push(Framework {
              name: "Java".to_string(),
              version,
              path: Some(java_path.to_string_lossy().to_string()),
              package_manager: "maven".to_string(),
              installed: true,
            });
          }
        }
      }
    }
  }

  // Go
  if let Ok(output) = Command::new("go").arg("version").output() {
    if output.status.success() {
      let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let path = Command::new("where").arg("go").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Go".to_string(),
        version,
        path,
        package_manager: "go".to_string(),
        installed: true,
      });
    }
  }

  // Rust (Cargo)
  if let Ok(output) = Command::new("cargo").arg("--version").output() {
    if output.status.success() {
      let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let path = Command::new("where").arg("cargo").output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").to_string());
      
      frameworks.push(Framework {
        name: "Rust".to_string(),
        version,
        path,
        package_manager: "cargo".to_string(),
        installed: true,
      });
    }
  }

  frameworks
}

// Detect technologies used in a project
#[tauri::command]
fn detect_project_technologies(project_path: String) -> Vec<String> {
  use std::fs;
  use std::path::Path;
  
  let mut technologies = Vec::new();
  let root_path = Path::new(&project_path);
  
  // Folders to scan for deeper tech detection (monorepo support)
  let subfolders = vec!["", "frontend", "backend", "client", "server", "web", "api", "studio"];
  
  for folder in subfolders {
    let current_path = if folder.is_empty() {
      root_path.to_path_buf()
    } else {
      root_path.join(folder)
    };
    
    if !current_path.exists() || !current_path.is_dir() {
      continue;
    }

    // 1. Node.js / Javascript detection
    let package_json_path = current_path.join("package.json");
    if package_json_path.exists() {
      if let Ok(content) = fs::read_to_string(&package_json_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
          let mut deps = Vec::new();
          if let Some(dependencies) = json.get("dependencies").and_then(|d| d.as_object()) {
            deps.extend(dependencies.keys().map(|k| k.as_str()));
          }
          if let Some(dev_dependencies) = json.get("devDependencies").and_then(|d| d.as_object()) {
            deps.extend(dev_dependencies.keys().map(|k| k.as_str()));
          }
          
          // --- Main Frameworks ---
          if deps.iter().any(|d| d.contains("react-native")) { technologies.push("react-native".to_string()); }
          if deps.iter().any(|d| d == &"react" || d == &"react-dom") { technologies.push("react".to_string()); }
          if deps.iter().any(|d| d.contains("next")) { technologies.push("nextjs".to_string()); }
          if deps.iter().any(|d| d.contains("vue")) { technologies.push("vue".to_string()); }
          if deps.iter().any(|d| d.contains("angular")) { technologies.push("angular".to_string()); }
          if deps.iter().any(|d| d.contains("svelte")) { technologies.push("svelte".to_string()); }
          if deps.iter().any(|d| d.contains("astro")) { technologies.push("astro".to_string()); }
          if deps.iter().any(|d| d.contains("expo")) { technologies.push("expo".to_string()); }
          
          // --- Core Technologies ---
          if deps.iter().any(|d| d.contains("tailwind")) { technologies.push("tailwind".to_string()); }
          if deps.iter().any(|d| d.contains("typescript") || d == &"@types/react") { technologies.push("typescript".to_string()); }
          if deps.iter().any(|d| d.contains("three") || d.contains("@react-three")) { technologies.push("three".to_string()); }
          if deps.iter().any(|d| d.contains("supabase")) { technologies.push("supabase".to_string()); }
          if deps.iter().any(|d| d.contains("firebase")) { technologies.push("firebase".to_string()); }
          if deps.iter().any(|d| d.contains("express")) { technologies.push("express".to_string()); }
          if deps.iter().any(|d| d.contains("nestjs")) { technologies.push("nestjs".to_string()); }
          if deps.iter().any(|d| d.contains("tauri")) { technologies.push("tauri".to_string()); }
          if deps.iter().any(|d| d.contains("vite")) { technologies.push("vite".to_string()); }

          // --- State Management ---
          if deps.iter().any(|d| d.contains("zustand")) { technologies.push("zustand".to_string()); }
          if deps.iter().any(|d| d.contains("redux") || d.contains("@reduxjs/toolkit")) { technologies.push("redux".to_string()); }
          if deps.iter().any(|d| d.contains("recoil") || d.contains("jotai")) { technologies.push("zustand".to_string()); } // Group simple state
        }
      }
    }
    
    // 2. Python detection (Improved)
    let has_py_files = if let Ok(entries) = fs::read_dir(&current_path) {
        entries.flatten().any(|e| e.file_name().to_string_lossy().ends_with(".py"))
    } else { false };

    if current_path.join("requirements.txt").exists() || current_path.join("pyproject.toml").exists() || has_py_files {
      if current_path.join("manage.py").exists() { 
        technologies.push("django".to_string()); 
      } else {
        technologies.push("python".to_string());
      }
    }
    
    // 3. PHP detection
    if current_path.join("composer.json").exists() || current_path.join("artisan").exists() {
      if current_path.join("artisan").exists() { 
        technologies.push("laravel".to_string()); 
      } else {
        technologies.push("php".to_string());
      }
    }
    
    // 4. Other Ecosystems
    if current_path.join("Cargo.toml").exists() { technologies.push("rust".to_string()); }
    if current_path.join("go.mod").exists() { technologies.push("go".to_string()); }
    if current_path.join("pubspec.yaml").exists() { technologies.push("flutter".to_string()); }
    if current_path.join("Dockerfile").exists() || current_path.join("docker-compose.yml").exists() { technologies.push("docker".to_string()); }
  }
  
  // --- Post-Processing & De-bloat ---
  technologies.sort();
  technologies.dedup();
  
  let mut final_techs = Vec::new();
  
  // Prioritize and Filter Redundant
  if technologies.contains(&"nextjs".to_string()) { 
    final_techs.push("nextjs".to_string()); 
  } else if technologies.contains(&"react-native".to_string()) {
    final_techs.push("react-native".to_string());
  } else if technologies.contains(&"react".to_string()) {
    final_techs.push("react".to_string());
  }
  
  if technologies.contains(&"django".to_string()) { final_techs.push("django".to_string()); }
  else if technologies.contains(&"python".to_string()) { final_techs.push("python".to_string()); }
  
  if technologies.contains(&"laravel".to_string()) { final_techs.push("laravel".to_string()); }
  else if technologies.contains(&"php".to_string()) { final_techs.push("php".to_string()); }

  // Add others that are not frameworks but "main tech"
  let main_tech_keys = vec![
    "three", "supabase", "firebase", "tailwind", "typescript", 
    "rust", "go", "flutter", "docker", "tauri", "vite", "zustand", "redux",
    "vue", "angular", "svelte", "astro", "express", "nestjs"
  ];
  
  for key in main_tech_keys {
    if technologies.contains(&key.to_string()) && !final_techs.contains(&key.to_string()) {
      final_techs.push(key.to_string());
    }
  }

  // Final count limit to keep it "fastly" understandable
  final_techs.truncate(8);
  
  final_techs
}


// Delete project folder from disk
#[tauri::command]
fn delete_project_folder(project_path: String) -> Result<String, String> {
  use std::fs;
  use std::path::Path;
  
  let path = Path::new(&project_path);
  
  if !path.exists() {
    return Err(format!("Project path does not exist: {}", project_path));
  }
  
  if !path.is_dir() {
    return Err(format!("Path is not a directory: {}", project_path));
  }
  
  match fs::remove_dir_all(path) {
    Ok(_) => Ok(format!("Successfully deleted project: {}", project_path)),
    Err(e) => Err(format!("Failed to delete project: {}", e)),
  }
}

// Test custom framework path
#[tauri::command]
fn test_custom_framework_path(path: String) -> Result<Framework, String> {
  use std::process::Command;
  use std::path::Path;
  
  let path_buf = Path::new(&path);
  
  // Check if file exists
  if !path_buf.exists() {
    return Err(format!("Path does not exist: {}", path));
  }
  
  // Try to execute with --version
  let output = Command::new(&path)
    .arg("--version")
    .output();
    
  match output {
    Ok(out) if out.status.success() => {
      let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
      let file_name = path_buf.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string();
      
      // Determine package manager based on executable name
      let package_manager = match file_name.to_lowercase().as_str() {
        "flutter" => "pub",
        "node" => "npm",
        "python" | "python3" => "pip",
        "java" => "maven",
        "go" => "go",
        "cargo" => "cargo",
        _ => "unknown"
      };
      
      Ok(Framework {
        name: file_name.clone(),
        version,
        path: Some(path.clone()),
        package_manager: package_manager.to_string(),
        installed: true,
      })
    }
    Ok(_) => Err(format!("Failed to execute: {}", path)),
    Err(e) => Err(format!("Error executing {}: {}", path, e)),
  }
}

// Detect venv in project
fn detect_venv(project_path: &Path) -> Option<PathBuf> {
  // Check for common venv locations
  let venv_names = vec!["venv", ".venv", "env", ".env", "virtualenv"];
  
  for venv_name in venv_names {
    let venv_path = project_path.join(venv_name);
    
    // Check for Windows venv
    if venv_path.join("Scripts").join("python.exe").exists() {
      return Some(venv_path);
    }
    
    // Check for Unix venv
    if venv_path.join("bin").join("python").exists() {
      return Some(venv_path);
    }
  }
  
  None
}

// Detect which package manager to use for a project
#[tauri::command]
fn detect_package_manager(project_path: String) -> String {
  let path = Path::new(&project_path);
  
  if path.join("pnpm-lock.yaml").exists() { return "pnpm".to_string(); }
  if path.join("bun.lockb").exists() || path.join("bun.lock").exists() { return "bun".to_string(); }
  if path.join("yarn.lock").exists() { return "yarn".to_string(); }
  if path.join("package-lock.json").exists() { return "npm".to_string(); }
  
  if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() || detect_venv(path).is_some() {
    return "pip".to_string();
  }
  
  if path.join("pubspec.yaml").exists() { return "pub".to_string(); }
  if path.join("go.mod").exists() { return "go".to_string(); }
  if path.join("Cargo.toml").exists() { return "cargo".to_string(); }
  
  // Default to npm if it's a web project (has package.json)
  if path.join("package.json").exists() { return "npm".to_string(); }
  
  "npm".to_string()
}

// Install package command
#[tauri::command]
fn install_package(
  app: tauri::AppHandle,
  package_manager: String,
  package_name: String,
  project_path: Option<String>,
  is_global: bool,
) -> Result<String, String> {
  use std::process::Command;
  
  // Sanitize: ensure package_name is a single, valid identifier (no spaces that would cause multi-install)
  let sanitized_name = package_name.trim().to_string();
  if sanitized_name.contains(' ') {
    return Err(format!("Invalid package name: '{}'. Package names cannot contain spaces.", sanitized_name));
  }
  
  eprintln!("[install_package] Manager: {}, Package: '{}', Path: {:?}, Global: {}", 
    package_manager, sanitized_name, project_path, is_global);

  let mut cmd = match package_manager.as_str() {
    "npm" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "npm.cmd" } else { "npm" });
      c.arg("install");
      if is_global { c.arg("-g"); } else { c.arg("--save"); }
      c.arg(&sanitized_name);
      c
    }
    "pnpm" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "pnpm.cmd" } else { "pnpm" });
      c.arg("add");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "yarn" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "yarn.cmd" } else { "yarn" });
      c.arg("add");
      if is_global { c.arg("global"); }
      c.arg(&sanitized_name);
      c
    }
    "bun" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "bun.exe" } else { "bun" });
      c.arg("add");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "pip" => {
      let python_cmd = if !is_global && project_path.is_some() {
        let proj_path = Path::new(project_path.as_ref().unwrap());
        if let Some(venv_path) = detect_venv(proj_path) {
          if cfg!(target_os = "windows") {
            venv_path.join("Scripts").join("python.exe")
          } else {
            venv_path.join("bin").join("python")
          }
        } else {
          PathBuf::from(if cfg!(target_os = "windows") { "python.exe" } else { "python" })
        }
      } else {
        PathBuf::from(if cfg!(target_os = "windows") { "python.exe" } else { "python" })
      };
      
      let mut c = Command::new(python_cmd);
      c.args(["-m", "pip", "install", &sanitized_name]);
      c
    }
    "pub" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "flutter.bat" } else { "flutter" });
      c.args(["pub", "add", &sanitized_name]);
      c
    }
    "go" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "go.exe" } else { "go" });
      c.args(["get", &sanitized_name]);
      c
    }
    "cargo" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "cargo.exe" } else { "cargo" });
      c.args(["add", &sanitized_name]);
      c
    }
    _ => return Err("Unsupported package manager".to_string()),
  };

  if let Some(path) = project_path {
    cmd.current_dir(path);
  }

  // Spawn and stream output
  let mut child = cmd
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped())
    .spawn()
    .map_err(|e| e.to_string())?;

  let app_handle = app.clone();

  // stdout thread
  if let Some(stdout) = child.stdout.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stdout);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("install-log", serde_json::json!({ "stream": "stdout", "line": l }));
        }
      }
    });
  }

  // stderr thread
  if let Some(stderr) = child.stderr.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stderr);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("install-log", serde_json::json!({ "stream": "stderr", "line": l }));
        }
      }
    });
  }

  // Wait for exit
  let ah = app_handle.clone();
  let pkg_name = sanitized_name.clone();
  std::thread::spawn(move || {
    if let Ok(exit) = child.wait() {
      let code = exit.code();
      println!("[install_package] Finished with exit code: {:?}", code);
      let _ = ah.emit("install-log", serde_json::json!({ "stream": "exit", "code": code, "package": pkg_name }));
    }
  });

  Ok("Installation started".to_string())
}

// Remove package command
#[tauri::command]
fn remove_package(
  _app: tauri::AppHandle,
  package_manager: String,
  package_name: String,
  project_path: Option<String>,
  is_global: bool,
) -> Result<String, String> {
  use std::process::Command;
  
  let sanitized_name = package_name.trim().to_string();
  
  eprintln!("[remove_package] Manager: {}, Package: '{}', Path: {:?}", 
    package_manager, sanitized_name, project_path);

  let mut cmd = match package_manager.as_str() {
    "npm" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "npm.cmd" } else { "npm" });
      c.arg("uninstall");
      if is_global { c.arg("-g"); } else { c.arg("--save"); }
      c.arg(&sanitized_name);
      c
    }
    "pnpm" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "pnpm.cmd" } else { "pnpm" });
      c.arg("remove");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "yarn" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "yarn.cmd" } else { "yarn" });
      c.arg("remove");
      if is_global { c.arg("global"); }
      c.arg(&sanitized_name);
      c
    }
    "bun" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "bun.exe" } else { "bun" });
      c.arg("remove");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "pip" => {
      let python_cmd = if !is_global && project_path.is_some() {
        let proj_path = Path::new(project_path.as_ref().unwrap());
        if let Some(venv_path) = detect_venv(proj_path) {
          if cfg!(target_os = "windows") {
            venv_path.join("Scripts").join("python.exe")
          } else {
            venv_path.join("bin").join("python")
          }
        } else {
          PathBuf::from(if cfg!(target_os = "windows") { "python.exe" } else { "python" })
        }
      } else {
        PathBuf::from(if cfg!(target_os = "windows") { "python.exe" } else { "python" })
      };
      
      let mut c = Command::new(python_cmd);
      c.args(["-m", "pip", "uninstall", "-y", &sanitized_name]);
      c
    }
    "pub" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "flutter.bat" } else { "flutter" });
      c.args(["pub", "remove", &sanitized_name]);
      c
    }
    "go" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "go.exe" } else { "go" });
      c.args(["get", &format!("{}@none", sanitized_name)]);
      c
    }
    "cargo" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "cargo.exe" } else { "cargo" });
      if is_global {
        c.arg("uninstall");
      } else {
        c.arg("remove");
      }
      c.arg(&sanitized_name);
      c
    }
    "composer" => {
      let cmd = if cfg!(target_os = "windows") { "composer" } else { "composer" };
      let mut c = Command::new(cmd);
      if is_global {
        c.args(["global", "remove", &sanitized_name]);
      } else {
        c.args(["remove", &sanitized_name]);
      }
      c
    }
    "gem" => {
      let cmd = if cfg!(target_os = "windows") { "gem" } else { "gem" };
      let mut c = Command::new(cmd);
      c.args(["uninstall", &sanitized_name]);
      c
    }
    _ => return Err(format!("Unsupported package manager: {}", package_manager)),
  };

  if let Some(path) = project_path {
    cmd.current_dir(path);
  }

  // Spawn and wait
  let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn process: {}", e))?;
  
  if let Ok(exit) = child.wait() {
    let code = exit.code().unwrap_or(1);
    if code != 0 {
      return Err(format!("Command failed with exit code {}", code));
    }
  } else {
    return Err("Failed to wait on child process".into());
  }

  Ok("Package removed successfully".to_string())
}

// Update package command
#[tauri::command]
fn update_package(
  app: tauri::AppHandle,
  package_manager: String,
  package_name: String,
  project_path: Option<String>,
  is_global: bool,
) -> Result<String, String> {
  use std::process::Command;
  
  let sanitized_name = package_name.trim().to_string();
  
  eprintln!("[update_package] Manager: {}, Package: '{}', Path: {:?}", 
    package_manager, sanitized_name, project_path);

  let mut cmd = match package_manager.as_str() {
    "npm" => {
      // Determine the final install target
      let install_target = if sanitized_name.contains('@') && sanitized_name.matches('@').count() >= 2 {
        sanitized_name.clone()
      } else if sanitized_name.contains('@') && !sanitized_name.starts_with('@') {
        sanitized_name.clone()
      } else {
        format!("{}@latest", sanitized_name)
      };

      let mut c = Command::new(if cfg!(target_os = "windows") { "npm.cmd" } else { "npm" });
      c.arg("install");
      if is_global { c.arg("-g"); }
      c.arg(&install_target);
      c
    }
    "pnpm" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "pnpm.cmd" } else { "pnpm" });
      c.arg("add");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "yarn" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "yarn.cmd" } else { "yarn" });
      c.arg("add");
      if is_global { c.arg("global"); }
      c.arg(&sanitized_name);
      c
    }
    "bun" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "bun.exe" } else { "bun" });
      c.arg("add");
      if is_global { c.arg("-g"); }
      c.arg(&sanitized_name);
      c
    }
    "pip" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "python.exe" } else { "python" });
      c.args(["-m", "pip", "install", "--upgrade", &sanitized_name]);
      c
    }
    "pub" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "flutter.bat" } else { "flutter" });
      c.args(["pub", "upgrade", &sanitized_name]);
      c
    }
    "go" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "go.exe" } else { "go" });
      c.args(["get", "-u", &sanitized_name]);
      c
    }
    "cargo" => {
      let mut c = Command::new(if cfg!(target_os = "windows") { "cargo.exe" } else { "cargo" });
      c.args(["update", "-p", &sanitized_name]);
      c
    }
    _ => return Err("Unsupported package manager".to_string()),
  };

  if let Some(path) = project_path {
    cmd.current_dir(path);
  }

  // Spawn and stream output
  let mut child = cmd
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped())
    .spawn()
    .map_err(|e| format!("Failed to spawn process: {}", e))?;

  let app_handle = app.clone();

  // stdout thread
  if let Some(stdout) = child.stdout.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stdout);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("update-log", serde_json::json!({ "stream": "stdout", "line": l }));
        }
      }
    });
  }

  // stderr thread
  if let Some(stderr) = child.stderr.take() {
    let ah = app_handle.clone();
    std::thread::spawn(move || {
      use std::io::{BufRead, BufReader};
      let reader = BufReader::new(stderr);
      for line in reader.lines() {
        if let Ok(l) = line {
          let _ = ah.emit("update-log", serde_json::json!({ "stream": "stderr", "line": l }));
        }
      }
    });
  }

  // Wait for process to complete
  let status = child.wait().map_err(|e| format!("Failed to wait for process: {}", e))?;
  
  // Emit exit event
  let _ = app_handle.emit("update-log", serde_json::json!({ 
    "stream": "exit", 
    "code": status.code(),
    "package": package_name 
  }));

  // Check exit status
  if status.success() {
    Ok(format!("Successfully updated {}", package_name))
  } else {
    Err(format!("Update failed for {} (exit code: {:?})", package_name, status.code()))
  }
}

// Search packages from registry using APIs
// Check if project has venv
#[tauri::command]
fn check_venv(project_path: String) -> bool {
  let path = Path::new(&project_path);
  detect_venv(path).is_some()
}

#[tauri::command]
fn get_venv(project_path: String) -> Option<String> {
  let path = Path::new(&project_path);
  if let Some(venv_path) = detect_venv(path) {
    return Some(venv_path.to_string_lossy().to_string());
  }
  None
}

// Create venv in project
#[tauri::command]
fn create_venv(project_path: String) -> Result<String, String> {
  use std::process::Command;
  
  let path = Path::new(&project_path);
  let venv_path = path.join("venv");
  
  let output = if cfg!(target_os = "windows") {
    Command::new("cmd")
      .args(["/c", "python", "-m", "venv", "venv"])
      .current_dir(path)
      .output()
      .map_err(|e| format!("Failed to create venv: {}", e))?
  } else {
    Command::new("python3")
      .args(["-m", "venv", "venv"])
      .current_dir(path)
      .output()
      .map_err(|e| format!("Failed to create venv: {}", e))?
  };
  
  if output.status.success() {
    Ok(venv_path.to_string_lossy().to_string())
  } else {
    Err(format!("venv creation failed: {}", String::from_utf8_lossy(&output.stderr)))
  }
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
  let path_buf = Path::new(&path);
  if !path_buf.exists() {
    return Err("Path does not exist".to_string());
  }

  #[cfg(target_os = "windows")]
  {
    std::process::Command::new("explorer")
      .arg(path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(target_os = "macos")]
  {
    std::process::Command::new("open")
      .arg(path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(target_os = "linux")]
  {
    std::process::Command::new("xdg-open")
      .arg(path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  Ok(())
}

#[tauri::command]
fn open_in_editor(path: String, editor: String) -> Result<(), String> {
  let path_buf = Path::new(&path);
  if !path_buf.exists() {
    return Err("Path does not exist".to_string());
  }

  let cmd = match editor.as_str() {
    "vscode" => "code",
    "cursor" => "cursor",
    "zed" => "zed",
    "webstorm" => "webstorm",
    "intellij" => "idea",
    "explorer" => {
      // fallback to default OS explorer
      #[cfg(target_os = "windows")] return { std::process::Command::new("explorer").arg(&path).spawn().map_err(|e| e.to_string())?; Ok(()) };
      #[cfg(target_os = "macos")] return { std::process::Command::new("open").arg(&path).spawn().map_err(|e| e.to_string())?; Ok(()) };
      #[cfg(target_os = "linux")] return { std::process::Command::new("xdg-open").arg(&path).spawn().map_err(|e| e.to_string())?; Ok(()) };
    },
    _ => "code",
  };

  // For IDEs, we run the IDE command usually with cmd /c on Windows so PATH resolves it properly
  #[cfg(target_os = "windows")]
  {
    std::process::Command::new("cmd")
      .args(["/c", cmd, &path])
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(not(target_os = "windows"))]
  {
    std::process::Command::new(cmd)
      .arg(&path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  Ok(())
}

#[tauri::command]
fn search_packages(package_manager: String, query: String) -> Result<Vec<serde_json::Value>, String> {
  match package_manager.as_str() {
    "npm" | "pnpm" | "yarn" | "bun" => search_npm_packages(&query),
    "pip" | "uv" => search_pypi_packages(&query),
    "pub" => search_pub_packages(&query),
    "cargo" => search_cargo_packages(&query),
    "go" => {
      // Go doesn't have a simple JSON API for search, so we return a dummy result 
      // allowing the user to install the exact package they typed.
      let result = serde_json::json!({
        "name": query,
        "version": "latest",
        "description": "Go module (exact match)",
        "author": "",
      });
      Ok(vec![result])
    },
    _ => Err(format!("Search not supported for package manager: {}", package_manager)),
  }
}

// Search npm registry using API
fn search_npm_packages(query: &str) -> Result<Vec<serde_json::Value>, String> {
  let url = format!("https://registry.npmjs.org/-/v1/search?text={}&size=20", query);
  
  let response = reqwest::blocking::get(&url)
    .map_err(|e| format!("NPM API request failed: {}", e))?;
  
  if !response.status().is_success() {
    return Err(format!("NPM API returned status: {}", response.status()));
  }
  
  let data: serde_json::Value = response.json()
    .map_err(|e| format!("Failed to parse NPM response: {}", e))?;
  
  let objects = data["objects"].as_array()
    .ok_or("Invalid NPM API response format")?;
  
  let results: Vec<serde_json::Value> = objects.iter()
    .filter_map(|obj| {
      let package = &obj["package"];
      Some(serde_json::json!({
        "name": package["name"].as_str()?,
        "version": package["version"].as_str().unwrap_or("latest"),
        "description": package["description"].as_str().unwrap_or(""),
        "author": package["author"]["name"].as_str().unwrap_or(""),
        "links": package["links"],
      }))
    })
    .collect();
  
  Ok(results)
}

// Search PyPI using API
fn search_pypi_packages(query: &str) -> Result<Vec<serde_json::Value>, String> {
  // Use PyPI's package info endpoint for exact match search
  // Since PyPI deprecated their search API, we try exact match with variations
  let exact_url = format!("https://pypi.org/pypi/{}/json", query);
  
  let response = reqwest::blocking::get(&exact_url)
    .map_err(|e| format!("PyPI API request failed: {}", e))?;
  
  if !response.status().is_success() {
    // Try a few common variations or return helpful message
    let variations = vec![
      query.to_lowercase(),
      query.replace("-", "_"),
      query.replace("_", "-"),
    ];
    
    for variant in variations {
      let variant_url = format!("https://pypi.org/pypi/{}/json", variant);
      if let Ok(resp) = reqwest::blocking::get(&variant_url) {
        if resp.status().is_success() {
          if let Ok(data) = resp.json::<serde_json::Value>() {
            let info = &data["info"];
            let result = serde_json::json!({
              "name": info["name"].as_str().unwrap_or(&variant),
              "version": info["version"].as_str().unwrap_or("unknown"),
              "description": info["summary"].as_str().unwrap_or(""),
              "author": info["author"].as_str().unwrap_or(""),
              "home_page": info["home_page"].as_str().unwrap_or(""),
            });
            return Ok(vec![result]);
          }
        }
      }
    }
    
    // If no variations found, return empty with helpful message
    return Ok(vec![]);
  }
  
  let data: serde_json::Value = response.json()
    .map_err(|e| format!("Failed to parse PyPI response: {}", e))?;
  
  let info = &data["info"];
  let result = serde_json::json!({
    "name": info["name"].as_str().unwrap_or(query),
    "version": info["version"].as_str().unwrap_or("unknown"),
    "description": info["summary"].as_str().unwrap_or(""),
    "author": info["author"].as_str().unwrap_or(""),
    "home_page": info["home_page"].as_str().unwrap_or(""),
  });
  
  Ok(vec![result])
}

// Search pub.dev using API
fn search_pub_packages(query: &str) -> Result<Vec<serde_json::Value>, String> {
  let url = format!("https://pub.dev/api/search?q={}", query);
  
  let response = reqwest::blocking::get(&url)
    .map_err(|e| format!("pub.dev API request failed: {}", e))?;
  
  if !response.status().is_success() {
    return Err(format!("pub.dev API returned status: {}", response.status()));
  }
  
  let data: serde_json::Value = response.json()
    .map_err(|e| format!("Failed to parse pub.dev response: {}", e))?;
  
  let packages = data["packages"].as_array()
    .ok_or("Invalid pub.dev API response format")?;
  
  let results: Vec<serde_json::Value> = packages.iter()
    .filter_map(|pkg| {
      Some(serde_json::json!({
        "name": pkg["package"].as_str()?,
        "version": pkg["latest"]["version"].as_str().unwrap_or("latest"),
        "description": pkg["latest"]["pubspec"]["description"].as_str().unwrap_or(""),
      }))
    })
    .collect();
  
  Ok(results)
}

// Search crates.io using API
fn search_cargo_packages(query: &str) -> Result<Vec<serde_json::Value>, String> {
  let url = format!("https://crates.io/api/v1/crates?q={}&per_page=20", query);
  
  let client = reqwest::blocking::Client::builder()
    .user_agent("deped-desktop-app (https://github.com/your-repo/deped)")
    .build()
    .map_err(|e| format!("Failed to build reqwest client: {}", e))?;

  let response = client.get(&url).send()
    .map_err(|e| format!("crates.io API request failed: {}", e))?;
  
  if !response.status().is_success() {
    return Err(format!("crates.io API returned status: {}", response.status()));
  }
  
  let data: serde_json::Value = response.json()
    .map_err(|e| format!("Failed to parse crates.io response: {}", e))?;
  
  let crates = data["crates"].as_array()
    .ok_or("Invalid crates.io API response format")?;
  
  let results: Vec<serde_json::Value> = crates.iter()
    .filter_map(|pkg| {
      Some(serde_json::json!({
        "name": pkg["name"].as_str()?,
        "version": pkg["max_version"].as_str().unwrap_or("latest"),
        "description": pkg["description"].as_str().unwrap_or(""),
        "author": "",
      }))
    })
    .collect();
  
  Ok(results)
}

#[derive(Serialize)]
struct FastManagers {
  bun: bool,
  uv: bool,
  pnpm: bool,
}

#[tauri::command]
fn run_npm_outdated(project_path: String) -> Result<serde_json::Value, String> {
  use std::process::Command;
  
  // Use cmd /c to properly resolve npm from PATH on Windows
  let output = if cfg!(target_os = "windows") {
    Command::new("cmd")
      .args(["/C", "npm", "outdated", "--json"])
      .current_dir(&project_path)
      .output()
  } else {
    Command::new("npm")
      .arg("outdated")
      .arg("--json")
      .current_dir(&project_path)
      .output()
  }
  .map_err(|e| format!("Failed to run npm outdated: {}", e))?;
  
  // npm outdated exits with code 1 when updates are available, which is normal
  let stdout_str = String::from_utf8_lossy(&output.stdout);
  
  if stdout_str.trim().is_empty() {
    // No updates available
    return Ok(serde_json::json!({}));
  }
  
  // Parse JSON output
  let result: serde_json::Value = serde_json::from_str(&stdout_str)
    .map_err(|e| format!("Failed to parse npm outdated output: {}", e))?;
  
  Ok(result)
}

#[tauri::command]
fn check_fast_managers() -> FastManagers {
  use std::process::Command;
  
  let bun = Command::new("bun").arg("--version").output().is_ok();
  let uv = Command::new("uv").arg("--version").output().is_ok();
  let pnpm = Command::new("pnpm").arg("--version").output().is_ok();
  
  FastManagers { bun, uv, pnpm }
}

// Get updated info for a single package (optimized for quick rescan after update)
#[tauri::command]
fn get_package_info(
  project_path: String,
  package_name: String,
  manager: String
) -> Result<serde_json::Value, String> {
  use std::path::Path;
  use std::fs;
  
  let base_path = Path::new(&project_path);
  
  match manager.as_str() {
    "npm" => {
      // Read package.json to get the version
      let node_modules = base_path.join("node_modules");
      let pkg_path = if package_name.starts_with('@') {
        // Scoped package
        node_modules.join(&package_name)
      } else {
        node_modules.join(&package_name)
      };
      
      let pkg_json_path = pkg_path.join("package.json");
      if !pkg_json_path.exists() {
        return Err(format!("Package not found: {}", package_name));
      }
      
      let content = fs::read_to_string(&pkg_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
      
      let parsed: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse package.json: {}", e))?;
      
      let version = parsed["version"].as_str().unwrap_or("unknown").to_string();
      
      Ok(serde_json::json!({
        "name": package_name,
        "version": version,
        "manager": "npm"
      }))
    }
    "pip" => {
      // For pip, run pip show command
      use std::process::Command;
      let output = Command::new("python")
        .args(["-m", "pip", "show", &package_name])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to run pip show: {}", e))?;
      
      if !output.status.success() {
        return Err(format!("Package not found: {}", package_name));
      }
      
      let stdout = String::from_utf8_lossy(&output.stdout);
      let version = stdout.lines()
        .find(|line| line.starts_with("Version:"))
        .and_then(|line| line.split(':').nth(1))
        .map(|v| v.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());
      
      Ok(serde_json::json!({
        "name": package_name,
        "version": version,
        "manager": "pip"
      }))
    }
    _ => {
      // For other managers, return error to trigger full rescan
      Err(format!("Quick package info not supported for {}", manager))
    }
  }
}

#[tauri::command]
fn scan_workspace(path: String) -> Vec<String> {
  let mut projects = Vec::new();
  let root = Path::new(&path);
  
  if !root.exists() {
    return projects;
  }

  for entry in WalkDir::new(root)
    .max_depth(3)
    .into_iter()
    .filter_map(|e| e.ok()) 
  {
    let path = entry.path();
    if path.file_name() == Some("package.json".as_ref()) {
       // Skip if in node_modules
       if path.to_string_lossy().contains("node_modules") { continue; }
       
       if let Some(parent) = path.parent() {
         projects.push(parent.to_string_lossy().to_string());
       }
    }
  }
  projects
}

// Developer Essentials
#[tauri::command]
fn get_active_ports() -> Result<serde_json::Value, String> {
    use std::process::Command;
    let mut ports = Vec::new();

    if cfg!(target_os = "windows") {
        if let Ok(out) = Command::new("netstat").arg("-ano").output() {
            if let Ok(s) = String::from_utf8(out.stdout) {
                for line in s.lines() {
                    if line.contains("LISTENING") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 5 {
                            let addr = parts[1];
                            let pid = parts[4];
                            if let Some(port_str) = addr.split(':').last() {
                                if let Ok(port) = port_str.parse::<u16>() {
                                    if port >= 3000 && port <= 9000 || port == 5173 {
                                        let exists = ports.iter().any(|p: &serde_json::Value| {
                                            p.get("port").and_then(|v| v.as_u64()) == Some(port as u64)
                                        });

                                        if !exists {
                                            ports.push(serde_json::json!({
                                                "port": port,
                                                "pid": pid,
                                                "name": "Dev Server",
                                                "protocol": parts[0]
                                            }));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(serde_json::Value::Array(ports))
}

#[tauri::command]
fn kill_port_process(pid: String) -> Result<String, String> {
    use std::process::Command;
    if cfg!(target_os = "windows") {
        match Command::new("taskkill").args(["/F", "/PID", &pid]).output() {
            Ok(out) => {
                if out.status.success() {
                    Ok(format!("Successfully killed PID {}", pid))
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            },
            Err(e) => Err(e.to_string())
        }
    } else {
        Err("Only Windows supported".into())
    }
}

#[tauri::command]
fn read_package_scripts(project_path: String) -> Result<serde_json::Value, String> {
    let pkg_json = Path::new(&project_path).join("package.json");
    if let Ok(content) = fs::read_to_string(&pkg_json) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(scripts) = json.get("scripts") {
                return Ok(scripts.clone());
            }
        }
    }
    Ok(serde_json::json!({}))
}

#[tauri::command]
fn run_package_script(project_path: String, script_name: String) -> Result<String, String> {
    use std::process::Command;
    if cfg!(target_os = "windows") {
        match Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &format!("cd /d \"{}\" && npm run {}", project_path, script_name)])
            .spawn() {
            Ok(_) => Ok(format!("Started npm run {}", script_name)),
            Err(e) => Err(e.to_string())
        }
    } else {
        Err("Only Windows supported".into())
    }
}

#[tauri::command]
fn start_localhost_tunnel(port: u16) -> Result<String, String> {
    use std::process::Command;
    if cfg!(target_os = "windows") {
        match Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &format!("npx localtunnel --port {}", port)])
            .spawn() {
            Ok(_) => Ok(format!("Starting tunnel for port {}", port)),
            Err(e) => Err(e.to_string())
        }
    } else {
        Err("Only Windows supported".into())
    }
}

#[tauri::command]
fn run_npm_audit(project_path: String) -> Result<serde_json::Value, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    let mut cmd = Command::new("cmd");
    cmd.args(["/c", "npm", "audit", "--json"]);
    cmd.current_dir(&project_path);
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    
    match cmd.output() {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                Ok(json)
            } else {
                Err("Failed to parse npm audit JSON output".into())
            }
        },
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
fn fix_npm_audit(project_path: String) -> Result<String, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    let mut cmd = Command::new("cmd");
    cmd.args(["/c", "npm", "audit", "fix"]);
    cmd.current_dir(&project_path);
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    
    match cmd.output() {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                Ok(stdout)
            } else {
                Err(format!("Fix failed: {}", stderr))
            }
        },
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
fn read_env_file(project_path: String) -> Result<serde_json::Value, String> {
    let env_path = Path::new(&project_path).join(".env");
    let mut envs = Vec::new();
    
    if let Ok(content) = fs::read_to_string(&env_path) {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = trimmed.split_once('=') {
                envs.push(serde_json::json!({
                    "key": key.trim(),
                    "value": value.trim()
                }));
            }
        }
    }
    
    Ok(serde_json::Value::Array(envs))
}

#[tauri::command]
fn write_env_file(project_path: String, env_data: Vec<serde_json::Value>) -> Result<String, String> {
    let env_path = Path::new(&project_path).join(".env");
    let mut content = String::new();
    
    for env in env_data {
        if let (Some(key), Some(value)) = (env.get("key").and_then(|k| k.as_str()), env.get("value").and_then(|v| v.as_str())) {
            content.push_str(&format!("{}={}\n", key, value));
        }
    }
    
    match fs::write(&env_path, content) {
        Ok(_) => Ok("Successfully updated .env".to_string()),
        Err(e) => Err(e.to_string())
    }
}

use std::io::{Read, Write};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
        let handle = app.handle().clone();
        
        // The Bridge: Listen for IDE & AI Commands
        std::thread::spawn(move || {
            if let Ok(listener) = std::net::TcpListener::bind("127.0.0.1:48321") {
                for stream in listener.incoming() {
                    if let Ok(mut s) = stream {
                        let mut buffer = [0; 512];
                        if let Ok(_) = s.read(&mut buffer) {
                            let request = String::from_utf8_lossy(&buffer);
                            
                            // If Copilot or Extension sends a "Wake up / Open" signal (GET or POST)
                            if request.starts_with("GET /open") || request.starts_with("POST /open") {
                                
                                // Extract the JSON body if it's a POST request from the MCP tool
                                let payload = if let Some(body_idx) = request.find("\r\n\r\n") {
                                    let body = &request[body_idx + 4..].trim_matches(char::from(0));
                                    body.to_string()
                                } else {
                                    String::new()
                                };

                                // Tell the React frontend to open the Studio popup and pass the config!
                                handle.emit("ai-open-studio", payload).unwrap_or(());
                                
                                // Send success back to the IDE/Extension
                                let response = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nContent-Type: text/plain\r\n\r\nDepEd Studio Launched.";
                                let _ = s.write_all(response.as_bytes());
                            }
                        }
                    }
                }
            }
        });
        Ok(())
    })
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      scan_project, 
      scan_project_stream,
      run_manager_cmd, 
      delete_package, 
      scan_global_npm, 
      scan_global_pip,
      scan_global_cargo,
      scan_global_composer,
      scan_global_gem,
      scan_system_packages,
      pick_folder, 
      get_npm_global_path, 
      get_pip_global_path,
      detect_frameworks,
      test_custom_framework_path,
      detect_project_technologies,
      delete_project_folder,
      install_package,
      update_package,
      remove_package,
      search_packages,
      detect_package_manager,
      check_venv,
      get_venv,
      create_venv,
      run_npm_outdated,
      check_fast_managers,
      get_package_info,
      open_folder,
      get_toolchain_info,
      run_maintenance_scan,
      clean_selected_caches,
      scan_workspace,
      execute_scaffold_command,
      open_in_editor,
      write_boilerplate_file,
      get_active_ports,
      kill_port_process,
      read_package_scripts,
      run_package_script,
      start_localhost_tunnel,
      run_npm_audit,
      fix_npm_audit,
      read_env_file,
      write_env_file
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
