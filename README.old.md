PkgGUI — Native Package Manager GUI (Tauri Prototype)

This repository contains a Tauri + React prototype that scans a selected project folder for common package manager manifests and allows running basic install/list commands locally.

Supported detections in this prototype:
- npm (package.json, lockfiles)
- python (requirements.txt, Pipfile, pyproject.toml)
- cargo (Cargo.toml)
- go (go.mod)
- dart/flutter (pubspec.yaml)

MVP choices:
- Platforms: Linux, macOS, Windows (native desktop via Tauri)
- Local-only (no cloud)

Prerequisites:
- Node.js + npm
- Rust toolchain (stable)
- Tauri prerequisites (see https://tauri.app/v1/guides/getting-started/prerequisites)

Run in dev:

```bash
npm install
npx tauri dev
```

Build distributables:

```bash
npx tauri build
```

Notes & next steps:
- Add more robust parsing for lockfiles and version resolution.
- Add streaming logs for long-running installs and better error handling.
- Implement virtualenv/venv detection and safe sandboxing for Python installs.
- Add UI improvements and bulk actions.
# PkgGUI Prototype

This is a minimal Electron prototype that scans a selected folder for common package manager manifest files (npm, pip, poetry, cargo) and displays them.

Run:

```bash
# install electron locally
npm install
npx electron .
```

This prototype is intentionally small — next steps: add dependency parsing, run safe installs in project-local context, and build a nicer UI (Tauri + React recommended for production).
