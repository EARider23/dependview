# 📦 Package Space Analyzer - Build Instructions

## ✅ What's Implemented

### Core Features
- ✅ **Scan Installed Packages** - Detects actual installed packages in:
  - `node_modules/` (npm packages with scoped support)
  - `venv/site-packages/` (Python pip packages)
  - `vendor/` (PHP Composer packages)
  - `.dart_tool/` (Flutter packages)
  - `Cargo.lock` (Rust cargo dependencies)

- ✅ **Disk Space Calculation** - Recursively calculates size for each package

- ✅ **Global Package Detection** - Scans:
  - Global npm packages (`npm list -g --json --depth=0`)
  - Global pip packages (`python3 -m pip list --format=json`)

- ✅ **Usage Detection** - Scans project source files for:
  - JavaScript/TypeScript: `require('pkg')`, `import ... from 'pkg'`
  - Python: `from pkg import`, `import pkg`
  - Rust: `use pkg::`, `extern crate pkg`
  - Marks packages as "used" or "unused"

- ✅ **Duplicate Detection** - Finds same package in multiple locations and calculates wasted space

- ✅ **Uninstall Functionality** - Delete packages with checkbox selection

- ✅ **Desktop UI** - React-based interface with:
  - Package table with name, version, manager, size, used status
  - Checkboxes for selection
  - Filter/search
  - Uninstall button
  - Activity log

---

## 🚀 How to Build

### Prerequisites
- Node.js 16+ and npm
- Rust 1.77.2+ and cargo
- On Windows: Microsoft Visual C++ Build Tools
- On Linux: webkit2gtk dependencies (for dev only)
- On macOS: Xcode Command Line Tools

### Development Mode (Browser)

```bash
# Install dependencies
npm ci

# Start development server (opens in browser at localhost:5173)
npm run dev

# In another terminal, run Tauri backend
npx tauri dev
```

**Note:** In dev mode, you can test the UI at http://localhost:5173 even without the Tauri window (useful in headless environments).

---

## 🪟 Build Windows .exe

### Option 1: Build on Windows (Recommended)

```powershell
# On Windows machine
cd path\to\project

# Install dependencies
npm ci

# Build frontend
npm run build

# Build Tauri app (creates .exe and installer)
npx tauri build
```

**Output files:**
- `src-tauri/target/release/Package Space Analyzer.exe` - Standalone executable
- `src-tauri/target/release/bundle/msi/Package Space Analyzer_0.1.0_x64_en-US.msi` - Windows installer
- `src-tauri/target/release/bundle/nsis/Package Space Analyzer_0.1.0_x64-setup.exe` - NSIS installer

### Option 2: Build via GitHub Actions (Cross-platform)

Create `.github/workflows/build.yml`:

```yaml
name: Build Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
      
      - name: Build Tauri
        run: npx tauri build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: |
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/*.exe
```

Push code and trigger workflow to get Windows .exe artifacts.

---

## 🐧 Build Linux AppImage

```bash
# On Linux
npm ci
npm run build
npx tauri build

# Output: src-tauri/target/release/bundle/appimage/*.AppImage
```

---

## 🍎 Build macOS .app

```bash
# On macOS
npm ci
npm run build
npx tauri build

# Output: src-tauri/target/release/bundle/macos/*.app
```

---

## 🧪 Testing in Codespaces/Containers

Since Tauri requires a GUI, you can't run the native window in a headless environment. However, you can:

1. **Test the backend compilation:**
```bash
cd src-tauri
cargo check
cargo build --release
```

2. **Test the frontend in browser:**
```bash
npm run dev
# Open http://localhost:5173 in Simple Browser
```

3. **Test Tauri commands directly:**
```bash
cd src-tauri
cargo test
```

---

## 📝 Configuration

Edit `src-tauri/tauri.conf.json`:

```json
{
  "identifier": "com.pkganalyzer.app",  // Changed from default
  "productName": "Package Space Analyzer",
  "version": "0.1.0",
  "app": {
    "windows": [{
      "title": "Package Space Analyzer",
      "width": 1400,
      "height": 900
    }]
  }
}
```

---

## 🎯 How to Use the Built App

1. **Launch** - Double-click the .exe on Windows
2. **Pick Folder** - Click "Pick Folder" or use demo buttons
3. **Scan** - Click "Scan Installed Packages"
4. **Review** - See all packages with sizes, usage status
5. **Select** - Check boxes for packages to remove
6. **Uninstall** - Click "Uninstall Selected" (confirms before deleting)

---

## 🔧 Troubleshooting

### Build fails with "Failed to initialize GTK"
- This is normal in headless environments (containers, SSH)
- Use a Windows/macOS/Linux desktop for dev mode
- Or build without running: `npm run build && npx tauri build --no-bundle` (creates .exe only)

### Bundle identifier error
- Already fixed in `tauri.conf.json` (changed from `com.tauri.dev` to `com.pkganalyzer.app`)

### Missing dependencies on Linux
```bash
sudo apt-get update
sudo apt-get install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### Rust version too old
```bash
rustup update stable
```

---

## 📊 Features Implemented vs Required

| Feature | Status | Implementation |
|---------|--------|----------------|
| Scan installed packages | ✅ | `scan_node_modules`, `scan_python_packages`, `scan_composer_packages`, `scan_flutter_packages`, `scan_cargo_packages` |
| Calculate disk space | ✅ | `calculate_dir_size` recursively sums all files |
| Global package detection | ✅ | `scan_global_npm`, `scan_global_pip` |
| Usage detection | ✅ | `mark_usage_for_packages` scans source files for imports |
| Duplicate detection | ✅ | `find_duplicates` groups by name |
| Checkbox selection | ✅ | React state with `selectedPackages` Set |
| Uninstall packages | ✅ | `delete_package` command removes folders |
| Desktop .exe | ✅ | Tauri builds native executable |
| Filter/search | ✅ | UI includes filter input |
| Activity log | ✅ | UI shows scan progress and results |

---

## 🚀 Quick Start (Windows)

**If you're on Windows right now:**

```powershell
# Clone/download the code
cd C:\path\to\project

# Install and build
npm ci
npm run build
npx tauri build

# Run the .exe
.\src-tauri\target\release\Package Space Analyzer.exe
```

**If you're in Codespaces/Linux:**

1. Push code to GitHub
2. Create GitHub Actions workflow (see Option 2 above)
3. Trigger workflow via web interface
4. Download Windows .exe artifacts

---

## 📦 Distribution

The built .exe is **portable** - you can:
- Copy to any Windows PC (no installation needed)
- Run directly from USB drive
- Share as single file

For **installer** (recommended for end users):
- Use the generated `.msi` file (Windows Installer)
- Or the `.exe` from bundle/nsis (NSIS installer)

---

## 🔄 Update Workflow

1. Make code changes
2. Update version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
3. Build: `npm run build && npx tauri build`
4. Test the new .exe
5. Distribute updated version

---

## 💡 Next Enhancements (Optional)

- AST-based usage detection (more accurate than regex)
- Auto-update functionality (Tauri updater plugin)
- System tray icon with quick actions
- Export scan results to JSON/CSV
- Merge duplicate suggestions (symlinks)
- Scheduled scans
- Multi-project workspace support
- Package restore from backup
