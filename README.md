# Peeak - Modern Package Manager

A visual package manager for developers built with Tauri + React + Rust.

## ✨ Features

- 📊 **Size Analysis** - Sort packages by size, see which ones are bloating your projects
- 💡 **Smart Search** - Popular package suggestions by category (dates, HTTP, testing, etc.)
- 🎯 **Multi-Framework** - Supports npm, pip, pub (Flutter), cargo (Rust), and go modules
- 🔍 **Project Scanner** - Scan any project and see all dependencies
- 🌐 **System Packages** - View all globally installed packages across package managers
- 🎨 **Modern UI** - Beautiful gradient design with Tailwind CSS + shadcn/ui components
- 🐍 **Python venv Support** - Auto-detect and create virtual environments for Python projects

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Python 3.8+ (optional, for Python package management)

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npx tauri dev
```

### Build

```bash
# Build for production
npx tauri build
```

The executable will be in `src-tauri/target/release/`.

## 🎯 How to Use

1. **Browse Project** - Click "Browse & Import Project" to scan a project folder
2. **System Packages** - View all globally installed npm and pip packages
3. **Frameworks** - Detect installed frameworks and browse packages
4. **Size Analysis** - Click "📊 Size" to sort packages by size
5. **Smart Search** - Click popular package suggestions to search instantly

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Rust, Tauri v2
- **Package Managers**: npm, pip, pub, cargo, go

## 📝 Project Structure

```
peeak/
├── src/                # React frontend
│   ├── components/     # UI components (shadcn/ui)
│   ├── lib/           # Utilities
│   └── App.jsx        # Main app
├── src-tauri/         # Rust backend
│   ├── src/
│   │   └── lib.rs     # Tauri commands
│   └── Cargo.toml
└── package.json
```

## 🔧 Configuration

- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.js` - Vite bundler configuration
- `src-tauri/tauri.conf.json` - Tauri app configuration

## 📦 Available Commands

All backend commands are in `src-tauri/src/lib.rs`:

- `scan_project` - Scan a project folder for dependencies
- `scan_system_packages` - Scan global npm and pip packages
- `detect_frameworks` - Detect installed frameworks
- `search_packages` - Search package registries
- `install_package` - Install a package
- `update_package` - Update a package

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 📄 License

MIT
