#!/bin/bash

echo "================================================"
echo "🧪 Testing Package Space Analyzer"
echo "================================================"
echo ""

# Check demo projects exist
echo "📁 Checking demo projects..."
if [ -d "/workspaces/codespaces-blank/test-projects/node-demo/node_modules" ]; then
    echo "✓ Node.js demo project ready"
    pkg_count=$(ls -1 /workspaces/codespaces-blank/test-projects/node-demo/node_modules | wc -l)
    echo "  → $pkg_count packages installed"
else
    echo "✗ Node.js demo project not found"
fi

if [ -d "/workspaces/codespaces-blank/test-projects/python-demo/venv" ]; then
    echo "✓ Python demo project ready"
else
    echo "✗ Python demo project not found"
fi

echo ""
echo "================================================"
echo "🚀 How to Test Your Software"
echo "================================================"
echo ""

echo "OPTION 1 - Quick Browser Test (Do this now!):"
echo "---------------------------------------------"
echo "1. Run in terminal:"
echo "   npm run dev"
echo ""
echo "2. Open Simple Browser to: http://localhost:5173"
echo ""
echo "3. In the UI:"
echo "   • Click 'Pick Folder'"
echo "   • Enter: /workspaces/codespaces-blank/test-projects/node-demo"
echo "   • Click 'Scan Installed Packages'"
echo ""
echo "4. You should see:"
echo "   ✓ 79+ packages detected"
echo "   ✓ Sizes shown (KB/MB)"
echo "   ✓ lodash, axios, express marked as 'used' (✓)"
echo "   ✓ Other packages marked 'unused' (✗)"
echo ""
echo ""

echo "OPTION 2 - Test on Windows PC:"
echo "------------------------------"
echo "1. Copy this code to Windows"
echo "2. Run: npx tauri build"
echo "3. Open: Package Space Analyzer.exe"
echo "4. Scan any real project folder!"
echo ""
echo ""

echo "================================================"
echo "📊 Demo Project Locations"
echo "================================================"
echo ""
echo "Node.js demo:  /workspaces/codespaces-blank/test-projects/node-demo"
echo "Python demo:   /workspaces/codespaces-blank/test-projects/python-demo"
echo "This project:  /workspaces/codespaces-blank"
echo ""

echo "================================================"
echo "✅ Quick Start Command"
echo "================================================"
echo ""
echo "Run this now:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo "And scan: /workspaces/codespaces-blank/test-projects/node-demo"
echo ""
echo "See TESTING_GUIDE.md for detailed instructions!"
echo ""
