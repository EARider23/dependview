<div align="center">
  <img src="src-tauri/icons/icon.png" width="128" alt="Deped Logo">
  <h1>Deped</h1>
  <p><strong>A Modern, Visual Package Manager & Project Analyzer</strong></p>
</div>

---

**Deped** is a powerful desktop application built with Tauri, React, and Rust. It provides developers with a sleek, unified interface to manage dependencies across multiple programming languages and frameworks.

## ✨ Key Features

- 📊 **Size Analysis** - Instantly see the size of your packages and identify what's bloating your projects.
- 💡 **Smart Search** - Get popular package suggestions organized by category (dates, HTTP, testing, UI, etc.).
- 🎯 **Multi-Framework Support** - Seamlessly manage dependencies for `npm`, `pip`, `pub` (Flutter), `cargo` (Rust), and `go modules`.
- 🔍 **Project Scanner** - Scan any project directory and view a comprehensive tree of all dependencies.
- 🌐 **System Packages** - View and manage all globally installed packages across your entire system.
- 🎨 **Modern UI** - A beautiful, responsive interface featuring gradient designs, Tailwind CSS, and shadcn/ui components.
- 🐍 **Python venv Support** - Automatically detect and manage virtual environments for Python projects.

## 🚀 Quick Start (For Users)

1. Download the latest release from the [Releases page](../../releases).
2. Install and run **Deped**. No prerequisites or complex setup required!
3. Click "Browse & Import Project" to scan your first project folder.

## 💻 For Developers

Want to build **Deped** from source or contribute to the project? Here's how to get started:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable)
- Python 3.8+ (optional, required for Python package management features)

### Setup & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EARider23/dependview.git
   cd dependview
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

### Building for Production

To create a compiled executable for your operating system:

```bash
npm run tauri build
```
The final executable will be located in the `src-tauri/target/release/` directory.

## 🏗️ Architecture & Tech Stack

Deped is structured as a modern desktop application, utilizing the best web and systems programming technologies:

- **Frontend Interface**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Core Backend Engine**: Rust, Tauri v2
- **Supported Package Managers**: npm, pip, pub, cargo, go

## 📝 Project Structure

```text
dependview/
├── src/                # React frontend source code
│   ├── components/     # UI components
│   ├── lib/            # Utilities and helper functions
│   └── App.jsx         # Main application entry point
├── src-tauri/          # Rust backend source code
│   ├── src/
│   │   └── lib.rs      # Tauri commands and core logic
│   └── Cargo.toml      # Rust dependencies
└── package.json        # Frontend dependencies & scripts
```

## 🤝 Contributing

This project is actively maintained. Feel free to fork the repository, customize it to your needs, and submit pull requests!

## 📄 License

This project is licensed under the MIT License.
