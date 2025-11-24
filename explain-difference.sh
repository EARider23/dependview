#!/bin/bash
# Quick demo showing what YOU actually need vs what currently exists

clear
echo "═══════════════════════════════════════════════════════════════"
echo "  🔍 CURRENT CODE vs YOUR REQUIREMENTS - COMPARISON"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "❌ WHAT CURRENT CODE DOES (WRONG):"
echo "───────────────────────────────────────────────────────────────"
echo "1. Reads package.json file"
echo "2. Shows dependencies LISTED in manifest"
echo "3. Can run 'npm install' command"
echo "4. Opens in BROWSER (not desktop app in dev mode)"
echo ""
sleep 2

echo "✅ WHAT YOU ACTUALLY NEED:"
echo "───────────────────────────────────────────────────────────────"
echo "1. Scan INSTALLED packages (node_modules folder)"
echo "2. Show DISK SPACE used by each package"
echo "3. Detect GLOBAL vs PROJECT packages"
echo "4. Find DUPLICATE packages across projects"
echo "5. Check which packages are ACTUALLY USED in code"
echo "6. UNINSTALL selected packages"
echo "7. Real DESKTOP .exe (Windows executable)"
echo ""
sleep 2

echo "═══════════════════════════════════════════════════════════════"
echo "  📊 DEMO: What Scanner SHOULD DO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd /workspaces/codespaces-blank

# Create demo scan
echo "Scanning for INSTALLED packages..."
echo ""

if [ -d "node_modules" ]; then
    echo "📦 Found node_modules/ in current project:"
    echo ""
    
    # Count packages
    pkg_count=$(find node_modules -maxdepth 2 -name package.json 2>/dev/null | wc -l)
    echo "   Total packages: $pkg_count"
    
    # Calculate size
    total_size=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "   Total space: $total_size"
    echo ""
    
    echo "   Top 5 largest packages:"
    du -sh node_modules/*/* 2>/dev/null | sort -rh | head -5 | while read size path; do
        pkg=$(basename "$path")
        echo "      • $pkg - $size"
    done
    echo ""
fi

# Check for example projects
if [ -d "example/node-app/node_modules" ]; then
    echo "📦 Found node_modules/ in example/node-app:"
    pkg_count=$(find example/node-app/node_modules -maxdepth 2 -name package.json 2>/dev/null | wc -l)
    size=$(du -sh example/node-app/node_modules 2>/dev/null | cut -f1)
    echo "   Packages: $pkg_count, Space: $size"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  🎯 WHAT PROPER SCANNER SHOULD SHOW"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cat << 'DEMO'
┌─────────────────────────────────────────────────────────────┐
│ Package Space Analyzer v1.0                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📂 Project: /home/user/my-project                          │
│                                                             │
│ INSTALLED PACKAGES (node_modules):                         │
│ ──────────────────────────────────────────────────────────│
│ [✓] lodash              4.17.21    2.5 MB    ✓ Used       │
│ [✓] axios               1.6.0      1.2 MB    ✓ Used       │
│ [ ] moment              2.29.4     4.8 MB    ✗ UNUSED     │
│ [✓] react               18.2.0     1.8 MB    ✓ Used       │
│ [ ] unused-lib          1.0.0      8.2 MB    ✗ UNUSED     │
│                                                             │
│ DUPLICATES FOUND:                                           │
│ ──────────────────────────────────────────────────────────│
│ 🔁 lodash found in 3 projects:                             │
│    • /my-project/node_modules (2.5 MB)                     │
│    • /other-project/node_modules (2.5 MB)                  │
│    • /third-project/node_modules (2.5 MB)                  │
│    💡 Wasted space: 5.0 MB                                 │
│                                                             │
│ SUMMARY:                                                    │
│ ──────────────────────────────────────────────────────────│
│ Total packages: 245                                         │
│ Total space: 845 MB                                         │
│ Unused packages: 12 (45 MB)                                │
│ Duplicate space: 123 MB                                     │
│                                                             │
│ GLOBAL PACKAGES (npm -g):                                   │
│ ──────────────────────────────────────────────────────────│
│ [✓] npm                 9.8.1      C:\Users\...            │
│ [✓] typescript          5.3.0      C:\Users\...            │
│                                                             │
│ [ Uninstall Selected ]  [ Clean Unused ]  [ Find More ]   │
└─────────────────────────────────────────────────────────────┘
DEMO

echo ""
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  🔧 TECHNICAL DIFFERENCE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "CURRENT CODE reads:"
echo "   example/node-app/package.json"
echo "   → Shows: { dependencies: { react: '^18.2.0' } }"
echo ""

echo "CORRECT CODE should read:"
echo "   example/node-app/node_modules/"
echo "   → Scans folder structure"
echo "   → Calculates: react/ = 1.8 MB"
echo "   → Checks: grep -r 'import.*react' src/"
echo "   → Result: USED ✓"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 BROWSER vs DESKTOP APP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "CURRENT (Development):"
echo "   npx tauri dev"
echo "   → Opens Vite dev server in browser"
echo "   → URL: http://localhost:5173"
echo "   → NOT a desktop app (just for testing)"
echo ""

echo "CORRECT (Production):"
echo "   npx tauri build"
echo "   → Creates: pkg-gui.exe"
echo "   → Double-click .exe to run"
echo "   → Opens NATIVE window (not browser)"
echo "   → Can distribute .exe file"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  ❓ NEXT STEPS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Read: PROJECT_CLARIFICATION.md (just created)"
echo ""
echo "Choose option:"
echo "  1. Start fresh - Build correct app from scratch"
echo "  2. Quick demo - Show working node_modules scanner"
echo "  3. Explain more - I still have questions"
echo ""
