use std::path::{Path, PathBuf};
use serde::{Serialize, Deserialize};
use walkdir::WalkDir;
use std::fs;
use std::collections::HashSet;

#[derive(Serialize, Deserialize, Debug)]
pub struct MaintenanceStats {
    pub unused_packages: Vec<UnusedPackage>,
    pub caches: Vec<SystemCache>,
    pub total_savings: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UnusedPackage {
    pub name: String,
    pub manager: String,
    pub project_name: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SystemCache {
    pub name: String,
    pub path: String,
    pub size: u64,
}

pub fn scan_unused_npm(project_path: &Path, project_name: &str) -> Vec<UnusedPackage> {
    let mut unused = Vec::new();
    let pkg_json_path = project_path.join("package.json");
    if !pkg_json_path.exists() { return unused; }

    if let Ok(content) = fs::read_to_string(&pkg_json_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            let mut deps = HashSet::new();
            if let Some(d) = json.get("dependencies").and_then(|d| d.as_object()) {
                for name in d.keys() { deps.insert(name.clone()); }
            }
            if deps.is_empty() { return unused; }

            // Scan files for imports
            let mut found_deps = HashSet::new();
            for entry in WalkDir::new(project_path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| {
                    let p = e.path();
                    p.is_file() && (p.extension() == Some("js".as_ref()) || 
                                   p.extension() == Some("jsx".as_ref()) ||
                                   p.extension() == Some("ts".as_ref()) ||
                                   p.extension() == Some("tsx".as_ref())) &&
                    !p.to_string_lossy().contains("node_modules")
                }) {
                if let Ok(file_content) = fs::read_to_string(entry.path()) {
                    for dep in &deps {

                        if file_content.contains(dep) { // Simple check first for speed
                            if file_content.contains(&format!("'{}'", dep)) || 
                               file_content.contains(&format!("\"{}\"", dep)) {
                                found_deps.insert(dep.clone());
                            }
                        }
                    }
                }
            }

            for dep in deps {
                if !found_deps.contains(&dep) {
                    unused.push(UnusedPackage {
                        name: dep,
                        manager: "npm".to_string(),
                        project_name: project_name.to_string(),
                        path: project_path.to_string_lossy().to_string(),
                    });
                }
            }
        }
    }
    unused
}

pub fn get_system_caches() -> Vec<SystemCache> {
    let mut caches = Vec::new();
    let home = dirs::home_dir().unwrap_or(PathBuf::from(""));

    // NPM Cache
    let npm_cache = if cfg!(windows) {
        home.join("AppData/Roaming/npm-cache")
    } else {
        home.join(".npm")
    };
    if npm_cache.exists() {
        caches.push(SystemCache {
            name: "NPM Cache".to_string(),
            path: npm_cache.to_string_lossy().to_string(),
            size: calculate_dir_size(&npm_cache),
        });
    }

    // PIP Cache
    let pip_cache = if cfg!(windows) {
        home.join("AppData/Local/pip/cache")
    } else {
        home.join(".cache/pip")
    };
    if pip_cache.exists() {
        caches.push(SystemCache {
            name: "PIP Cache".to_string(),
            path: pip_cache.to_string_lossy().to_string(),
            size: calculate_dir_size(&pip_cache),
        });
    }

    // Cargo Cache
    let cargo_cache = home.join(".cargo/registry");
    if cargo_cache.exists() {
        caches.push(SystemCache {
            name: "Cargo Registry".to_string(),
            path: cargo_cache.to_string_lossy().to_string(),
            size: calculate_dir_size(&cargo_cache),
        });
    }

    caches
}

fn calculate_dir_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.metadata().ok())
        .filter(|metadata| metadata.is_file())
        .map(|metadata| metadata.len())
        .sum()
}
