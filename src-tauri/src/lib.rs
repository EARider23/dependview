use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;
use base64::{engine::general_purpose, Engine as _};

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

// Calculate directory size recursively
fn calculate_dir_size(path: &Path) -> u64 {
  let mut total = 0u64;
  if let Ok(entries) = fs::read_dir(path) {
    for entry in entries.flatten() {
      if let Ok(metadata) = entry.metadata() {
        if metadata.is_file() {
          total += metadata.len();
        } else if metadata.is_dir() {
          total += calculate_dir_size(&entry.path());
        }
      }
    }
  }
  total
}

// Scan node_modules folder for installed npm packages
fn scan_node_modules(base_path: &Path) -> Vec<InstalledPackage> {
  let mut packages = Vec::new();
  let node_modules = base_path.join("node_modules");
  
  if !node_modules.exists() {
    return packages;
  }

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
          if let Ok(scoped_entries) = fs::read_dir(&path) {
            for scoped_entry in scoped_entries.flatten() {
              let scoped_path = scoped_entry.path();
              if scoped_path.is_dir() {
                let scoped_name = format!("{}/{}", name, scoped_entry.file_name().to_string_lossy());
                let pkg_json = scoped_path.join("package.json");
                let version = read_package_version(&pkg_json);
                let size = calculate_dir_size(&scoped_path);
                
                packages.push(InstalledPackage {
                  name: scoped_name,
                  version,
                  manager: "npm".to_string(),
                  path: scoped_path.to_string_lossy().to_string(),
                  size,
                  used: None,
                  is_global: false,
                  icon: read_icon_data(&scoped_path),
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
  
  // Check .dart_tool/package_config.json for used packages
  let package_config = base_path.join(".dart_tool/package_config.json");
  if package_config.exists() {
    if let Ok(content) = fs::read_to_string(&package_config) {
      if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(pkgs) = json.get("packages").and_then(|p| p.as_array()) {
          for pkg in pkgs {
            if let (Some(name), Some(root_uri)) = (
              pkg.get("name").and_then(|n| n.as_str()),
              pkg.get("rootUri").and_then(|u| u.as_str())
            ) {
              // Parse the path from rootUri
              let pkg_path = if root_uri.starts_with("file://") {
                PathBuf::from(root_uri.replace("file://", ""))
              } else {
                base_path.join(root_uri)
              };
              
              if pkg_path.exists() {
                let size = calculate_dir_size(&pkg_path);
                let version = pkg.get("version").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                
                packages.push(InstalledPackage {
                  name: name.to_string(),
                  version,
                  manager: "flutter".to_string(),
                  path: pkg_path.to_string_lossy().to_string(),
                  size,
                  used: None,
                  is_global: false,
                  icon: read_icon_data(&pkg_path),
                });
              }
            }
          }
        }
      }
    }
  }
  
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
  println!("Scanning global npm");
  use std::process::Command;
  let mut out = Vec::new();
  if let Ok(root_out) = Command::new("npm").arg("root").arg("-g").output() {
    if root_out.status.success() {
      if let Ok(root) = String::from_utf8(root_out.stdout) {
        let root = root.trim();
        if let Ok(list_out) = Command::new("npm").args(["ls", "-g", "--json", "--depth=0"]).output() {
          if list_out.status.success() {
            if let Ok(json_str) = String::from_utf8(list_out.stdout) {
              if let Ok(val) = serde_json::from_str::<serde_json::Value>(&json_str) {
                if let Some(deps) = val.get("dependencies").and_then(|d| d.as_object()) {
                  for (name, v) in deps.iter() {
                    let version = v.get("version").and_then(|s| s.as_str()).unwrap_or("unknown").to_string();
                    let path = Path::new(root).join(name);
                    let size = if path.exists() { calculate_dir_size(&path) } else { 0 };
                    out.push(InstalledPackage {
                      name: name.clone(),
                      version,
                      manager: "npm".to_string(),
                      path: path.to_string_lossy().to_string(),
                      size,
                      used: None,
                      is_global: true,
                      icon: read_icon_data(&path),
                    });
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

// Detect globally installed pip packages
#[tauri::command]
fn scan_global_pip() -> Vec<InstalledPackage> {
  println!("Scanning global pip");
  use std::process::Command;
  let mut out = Vec::new();
  // get site-packages path
  if let Ok(sp_out) = Command::new("python").args(["-c", "import site, json; print(json.dumps(site.getsitepackages()))"]).output() {
    if sp_out.status.success() {
      if let Ok(json_str) = String::from_utf8(sp_out.stdout) {
        if let Ok(arr) = serde_json::from_str::<Vec<String>>(&json_str) {
          if !arr.is_empty() {
            let site_pkg = PathBuf::from(&arr[0]);
            if let Ok(list_out) = Command::new("python").args(["-m", "pip", "list", "--format=json"]).output() {
              if list_out.status.success() {
                if let Ok(pkgs_str) = String::from_utf8(list_out.stdout) {
                  if let Ok(pkgs) = serde_json::from_str::<serde_json::Value>(&pkgs_str) {
                    if let Some(arr) = pkgs.as_array() {
                      for p in arr {
                        if let (Some(name), Some(version)) = (p.get("name").and_then(|n| n.as_str()), p.get("version").and_then(|v| v.as_str())) {
                          let path = site_pkg.join(name);
                          let size = if path.exists() { calculate_dir_size(&path) } else { 0 };
                          out.push(InstalledPackage {
                            name: name.to_string(),
                            version: version.to_string(),
                            manager: "pip".to_string(),
                                path: path.to_string_lossy().to_string(),
                                size,
                                used: None,
                                is_global: true,
                                icon: read_icon_data(&path),
                          });
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
fn scan_system_packages() -> Result<serde_json::Value, String> {
  println!("Scanning system packages");
  
  let npm_packages = scan_global_npm();
  let pip_packages = scan_global_pip();
  
  let mut all_packages = Vec::new();
  all_packages.extend(npm_packages);
  all_packages.extend(pip_packages);
  
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
      let _ = app.emit("scan-complete", v);
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
  let mut frameworks = Vec::new();

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

  // Flutter
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
  
  let mut cmd = match package_manager.as_str() {
    "npm" => {
      let mut c = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", "npm"]);
        cmd
      } else {
        Command::new("npm")
      };
      c.arg("install");
      if is_global {
        c.arg("-g");
      }
      c.arg(&package_name);
      c
    }
    "pip" => {
      // For pip, detect venv and use appropriate python executable
      let python_cmd = if !is_global && project_path.is_some() {
        let proj_path = Path::new(project_path.as_ref().unwrap());
        if let Some(venv_path) = detect_venv(proj_path) {
          // Use venv python
          if cfg!(target_os = "windows") {
            venv_path.join("Scripts").join("python.exe")
          } else {
            venv_path.join("bin").join("python")
          }
        } else {
          // No venv found, use system python
          PathBuf::from("python")
        }
      } else {
        PathBuf::from("python")
      };
      
      let mut c = Command::new(python_cmd);
      c.args(["-m", "pip", "install", &package_name]);
      c
    }
    "pub" => {
      let mut c = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", "flutter"]);
        cmd
      } else {
        Command::new("flutter")
      };
      c.args(["pub", "add", &package_name]);
      c
    }
    "go" => {
      let mut c = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", "go"]);
        cmd
      } else {
        Command::new("go")
      };
      c.args(["get", &package_name]);
      c
    }
    "cargo" => {
      let mut c = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", "cargo"]);
        cmd
      } else {
        Command::new("cargo")
      };
      c.args(["add", &package_name]);
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

  // wait for exit
  let ah = app_handle.clone();
  std::thread::spawn(move || {
    if let Ok(exit) = child.wait() {
      let code = exit.code();
      let _ = ah.emit("install-log", serde_json::json!({ "stream": "exit", "code": code }));
    }
  });

  Ok("Installation started".to_string())
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
  
  let mut cmd = match package_manager.as_str() {
    "npm" => {
      let mut c = Command::new("npm");
      c.arg("update");
      if is_global {
        c.arg("-g");
      }
      c.arg(&package_name);
      c
    }
    "pip" => {
      let mut c = Command::new("python");
      c.args(["-m", "pip", "install", "--upgrade", &package_name]);
      c
    }
    "pub" => {
      let mut c = Command::new("flutter");
      c.args(["pub", "upgrade", &package_name]);
      c
    }
    "go" => {
      let mut c = Command::new("go");
      c.args(["get", "-u", &package_name]);
      c
    }
    "cargo" => {
      let mut c = Command::new("cargo");
      c.args(["update", "-p", &package_name]);
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

  // wait for exit
  let ah = app_handle.clone();
  std::thread::spawn(move || {
    if let Ok(exit) = child.wait() {
      let code = exit.code();
      let _ = ah.emit("update-log", serde_json::json!({ "stream": "exit", "code": code }));
    }
  });

  Ok("Update started".to_string())
}

// Search packages from registry using APIs
// Check if project has venv
#[tauri::command]
fn check_venv(project_path: String) -> bool {
  let path = Path::new(&project_path);
  detect_venv(path).is_some()
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
fn search_packages(package_manager: String, query: String) -> Result<Vec<serde_json::Value>, String> {
  match package_manager.as_str() {
    "npm" => search_npm_packages(&query),
    "pip" => search_pypi_packages(&query),
    "pub" => search_pub_packages(&query),
    _ => Err("Search not supported for this package manager".to_string()),
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      scan_project, 
      scan_project_stream,
      run_manager_cmd, 
      delete_package, 
      scan_global_npm, 
      scan_global_pip,
      scan_system_packages,
      pick_folder, 
      get_npm_global_path, 
      get_pip_global_path,
      detect_frameworks,
      install_package,
      update_package,
      search_packages,
      check_venv,
      create_venv
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
