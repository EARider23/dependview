#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::Path;
// `tauri::api` requires the `api-all` feature enabled in Cargo.toml
// remove unused imports

#[derive(Serialize)]
struct ManifestInfo {
  manager: String,
  file: String,
  data: Option<serde_json::Value>,
}

// folder picking is handled in the renderer using `@tauri-apps/api/dialog`

#[tauri::command]
fn scan_project(folder: String) -> Result<serde_json::Value, String> {
  let path = Path::new(&folder);
  if !path.exists() {
    return Err("Folder does not exist".into());
  }
  let mut manifests: Vec<ManifestInfo> = Vec::new();

  // npm
  let pkg = path.join("package.json");
  if pkg.exists() {
    let s = fs::read_to_string(&pkg).map_err(|e| e.to_string())?;
    let parsed = serde_json::from_str(&s).ok();
    manifests.push(ManifestInfo { manager: "npm".into(), file: "package.json".into(), data: parsed });
  }

  for f in ["yarn.lock", "package-lock.json", "pnpm-lock.yaml"] {
    let p = path.join(f);
    if p.exists() {
      manifests.push(ManifestInfo { manager: "npm-lock".into(), file: f.into(), data: None });
    }
  }

  // python
  for f in ["requirements.txt", "Pipfile", "pyproject.toml", "poetry.lock"] {
    let p = path.join(f);
    if p.exists() {
      let mut data = None;
      if f == "requirements.txt" {
        if let Ok(s) = fs::read_to_string(&p) {
          let deps: Vec<String> = s.lines().filter(|l| !l.trim().is_empty() && !l.starts_with('#')).map(|l| l.to_string()).collect();
          data = Some(serde_json::json!({ "dependencies": deps }));
        }
      } else if f.ends_with("toml") {
        if let Ok(s) = fs::read_to_string(&p) {
          if let Ok(t) = toml::from_str::<toml::Value>(&s) {
            data = serde_json::to_value(t).ok();
          }
        }
      }
      manifests.push(ManifestInfo { manager: "python".into(), file: f.into(), data });
    }
  }

  // rust
  for f in ["Cargo.toml", "Cargo.lock"] {
    let p = path.join(f);
    if p.exists() {
      let mut data = None;
      if f.ends_with("toml") {
        if let Ok(s) = fs::read_to_string(&p) {
          if let Ok(t) = toml::from_str::<toml::Value>(&s) {
            data = serde_json::to_value(t).ok();
          }
        }
      }
      manifests.push(ManifestInfo { manager: "cargo".into(), file: f.into(), data });
    }
  }

  // go
  let gom = path.join("go.mod");
  if gom.exists() {
    manifests.push(ManifestInfo { manager: "go".into(), file: "go.mod".into(), data: None });
  }

  // dart / flutter
  let pubspec = path.join("pubspec.yaml");
  if pubspec.exists() {
    manifests.push(ManifestInfo { manager: "flutter".into(), file: "pubspec.yaml".into(), data: None });
  }

  // AI packages detection: scan existing manifests for known AI libs
  let ai_libs = vec!["torch", "tensorflow", "transformers", "openai", "sentence-transformers", "keras", "pytorch", "huggingface", "scikit-learn", "numpy", "pandas"];
  for m in &manifests {
    if let Some(data) = &m.data {
      if let Some(deps) = data.get("dependencies") {
        if let Some(obj) = deps.as_object() {
          for (k, _) in obj {
            if ai_libs.contains(&k.as_str()) {
              // mark as AI
            }
          }
        }
      }
    }
  }

  Ok(serde_json::json!({ "path": folder, "manifests": manifests }))
}

#[tauri::command]
fn run_manager_cmd(manager: String, action: String, pkg: Option<String>, folder: Option<String>) -> Result<String, String> {
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

  let out = cmd.output().map_err(|e| e.to_string())?;
  let stdout = String::from_utf8_lossy(&out.stdout).to_string();
  let stderr = String::from_utf8_lossy(&out.stderr).to_string();
  Ok(format!("STDOUT:\n{}\nSTDERR:\n{}", stdout, stderr))
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![scan_project, run_manager_cmd])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
