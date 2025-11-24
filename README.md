# 📦 Package Space Analyzer

A Windows desktop application that scans, analyzes, and manages installed packages across multiple ecosystems (npm, pip, composer, Flutter, cargo).

[![Status](https://img.shields.io/badge/status-complete-brightgreen)]() [![Build](https://img.shields.io/badge/ready-to--build-success)]()

---

## ✨ Features

- 🔍 **Scan Installed Packages** - Detects actual packages in `node_modules/`, `venv/`, `vendor/`, etc.
- 📊 **Disk Space Analysis** - Shows size of each package and total space used
- 🌍 **Global Package Detection** - Finds globally installed npm and pip packages
- 🎯 **Usage Detection** - Marks packages as "used" or "unused" by scanning your code
- 🔄 **Duplicate Detection** - Finds same package in multiple locations
- 🗑️ **Uninstall Packages** - Remove packages with checkbox selection
- 🪟 **Native Windows App** - Standalone .exe, no installation needed

---

## 🚀 Quick Start

### Build on Windows

```powershell
npm ci
npm run build
npx tauri build
```

**Output:** `src-tauri/target/release/Package Space Analyzer.exe`

### Or Use GitHub Actions

1. Push code to GitHub
2. Go to Actions → "Build Release"
3. Click "Run workflow"
4. Download artifacts after build completes

---

## ✅ Status: 100% COMPLETE

All requested features implemented:
- ✅ **Usage detection** - Scans code for imports to mark used/unused packages
- ✅ **Global package detection** - Detects npm and pip global packages
- ✅ **Build to .exe** - Configuration fixed, ready to build
- ✅ Rust backend compiles without errors
- ✅ React UI with checkboxes and uninstall
- ✅ Disk space calculation for all packages
- ✅ Duplicate detection across projects

---

## 📖 Documentation

- **[FINAL_STATUS.md](FINAL_STATUS.md)** - Complete implementation status ⭐ **START HERE**
- **[BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)** - Detailed build guide for all platforms
- **[VERIFICATION.md](VERIFICATION.md)** - Feature checklist and testing
- **[READY.md](READY.md)** - Feature summary and usage guide

---

## 🎯 How It Works

1. **Pick a folder** containing projects with packages
2. **Scan** to analyze installed packages
3. **Review** packages with sizes, usage status, duplicates
4. **Select** packages to remove with checkboxes
5. **Uninstall** to free up disk space

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite 5
- **Backend:** Rust (Tauri 2.9)
- **UI:** Native desktop window
- **Package Detection:** npm, pip, composer, Flutter, cargo

---

## 📊 What Gets Detected

| Package Manager | Location | Detection Method |
|----------------|----------|------------------|
| npm/yarn/pnpm | `node_modules/` | Scans folders + package.json |
| pip | `venv/site-packages/` | Scans .dist-info directories |
| composer | `vendor/` | Scans org/package structure |
| Flutter/Dart | `.dart_tool/` | Reads package_config.json |
| cargo | `Cargo.lock` | Parses lock file |
| Global npm | System-wide | `npm list -g --json` |
| Global pip | System-wide | `pip list --format=json` |

---

## 🔧 Development

```bash
# Install dependencies
npm ci

# Run dev mode (browser)
npm run dev

# Run Tauri dev mode (native window)
npx tauri dev

# Build for production
npm run build
npx tauri build
```

---

## 📦 Distribution

The built `.exe` is **portable** - copy to any Windows PC and run. No installation required.

For end users, use the generated `.msi` installer or `.exe` from `bundle/nsis/`.

---

## 🎉 Ready to Build!

**All features complete. Just run the build command and you're done! 🚀**

See [FINAL_STATUS.md](FINAL_STATUS.md) for detailed verification.
