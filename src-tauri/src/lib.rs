use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Emitter;

#[derive(Serialize, Clone)]
struct InstalledPackage {
  name: String,
  version: String,
  manager: String,
  path: String,
  size: u64,
  used: Option<bool>,
  is_global: bool,
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
  out
}

// Detect globally installed pip packages
#[tauri::command]
fn scan_global_pip() -> Vec<InstalledPackage> {
  use std::process::Command;
  let mut out = Vec::new();
  // get site-packages path
  if let Ok(sp_out) = Command::new("python3").args(["-c", "import site, json; print(json.dumps(site.getsitepackages()))"]).output() {
    if sp_out.status.success() {
      if let Ok(json_str) = String::from_utf8(sp_out.stdout) {
        if let Ok(arr) = serde_json::from_str::<Vec<String>>(&json_str) {
          if !arr.is_empty() {
            let site_pkg = PathBuf::from(&arr[0]);
            if let Ok(list_out) = Command::new("python3").args(["-m", "pip", "list", "--format=json"]).output() {
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
  out
}

#[tauri::command]
fn scan_project(folder: String) -> Result<serde_json::Value, String> {
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

  // Detect global packages and merge (mark as global)
  let mut global_pkgs = scan_global_npm();
  all_packages.extend(global_pkgs.drain(..));
  let mut global_pip = scan_global_pip();
  all_packages.extend(global_pip.drain(..));

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
  
  serde_json::to_value(&result).map_err(|e| e.to_string())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![scan_project, run_manager_cmd, delete_package, scan_global_npm, scan_global_pip])
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
