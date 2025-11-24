#!/bin/bash
# Quick start script for PkgGUI

echo "🚀 Starting PkgGUI..."
echo ""

# Ensure cargo is available
if ! command -v cargo &> /dev/null; then
    echo "📦 Loading Rust toolchain..."
    source $HOME/.cargo/env
fi

# Check if already running
if pgrep -f "tauri dev" > /dev/null; then
    echo "⚠️  Tauri dev is already running. Kill it first with: pkill -f 'tauri dev'"
    exit 1
fi

# Navigate to project
cd "$(dirname "$0")"

echo "✓ Rust toolchain: $(cargo --version)"
echo "✓ Node version: $(node --version)"
echo ""
echo "🔧 Starting Tauri development server..."
echo ""
echo "📋 Once the window opens:"
echo "   1. Enter folder path: /workspaces/codespaces-blank/example/node-app"
echo "   2. Click 'Scan' to detect packages"
echo "   3. View dependencies and click 'Install' or 'Add Package'"
echo "   4. Watch real-time logs in the right panel"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run tauri dev
source $HOME/.cargo/env && npx tauri dev
