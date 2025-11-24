#!/bin/bash

echo "================================================"
echo "📦 Package Space Analyzer - Complete Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $1"
        ((failed++))
    fi
}

# Test 1: Backend functions
echo "Testing Backend Functions..."
grep -q "fn scan_node_modules" src-tauri/src/lib.rs
check "scan_node_modules exists"

grep -q "fn scan_python_packages" src-tauri/src/lib.rs
check "scan_python_packages exists"

grep -q "fn scan_composer_packages" src-tauri/src/lib.rs
check "scan_composer_packages exists"

grep -q "fn scan_flutter_packages" src-tauri/src/lib.rs
check "scan_flutter_packages exists"

grep -q "fn scan_cargo_packages" src-tauri/src/lib.rs
check "scan_cargo_packages exists"

grep -q "fn scan_global_npm" src-tauri/src/lib.rs
check "scan_global_npm exists (global detection)"

grep -q "fn scan_global_pip" src-tauri/src/lib.rs
check "scan_global_pip exists (global detection)"

grep -q "fn mark_usage_for_packages" src-tauri/src/lib.rs
check "mark_usage_for_packages exists (usage detection)"

grep -q "fn calculate_dir_size" src-tauri/src/lib.rs
check "calculate_dir_size exists"

grep -q "fn find_duplicates" src-tauri/src/lib.rs
check "find_duplicates exists"

grep -q "fn delete_package" src-tauri/src/lib.rs
check "delete_package exists (uninstall)"

echo ""

# Test 2: Data structures
echo "Testing Data Structures..."
grep -q "used: Option<bool>" src-tauri/src/lib.rs
check "InstalledPackage has 'used' field"

grep -q "is_global: bool" src-tauri/src/lib.rs
check "InstalledPackage has 'is_global' field"

grep -q "struct ScanResult" src-tauri/src/lib.rs
check "ScanResult struct exists"

grep -q "struct DuplicateGroup" src-tauri/src/lib.rs
check "DuplicateGroup struct exists"

echo ""

# Test 3: UI features
echo "Testing UI Features..."
grep -q "formatBytes" src/App.jsx
check "formatBytes function exists"

grep -q "togglePackage" src/App.jsx
check "togglePackage function exists"

grep -q "toggleAll" src/App.jsx
check "toggleAll function exists"

grep -q "uninstallSelected" src/App.jsx
check "uninstallSelected function exists"

grep -q "selectedPackages" src/App.jsx
check "selectedPackages state exists"

grep -q "type=\"checkbox\"" src/App.jsx
check "Checkboxes in UI"

echo ""

# Test 4: Configuration
echo "Testing Configuration..."
grep -q '"identifier": "com.pkganalyzer.app"' src-tauri/tauri.conf.json
check "Bundle identifier fixed (not com.tauri.dev)"

grep -q '"productName": "Package Space Analyzer"' src-tauri/tauri.conf.json
check "Product name set"

grep -q "regex" src-tauri/Cargo.toml
check "regex dependency added"

echo ""

# Test 5: Integration
echo "Testing Integration..."
grep -A 20 "fn scan_project" src-tauri/src/lib.rs | grep -q "scan_global_npm"
check "scan_project calls scan_global_npm"

grep -A 20 "fn scan_project" src-tauri/src/lib.rs | grep -q "scan_global_pip"
check "scan_project calls scan_global_pip"

grep -A 20 "fn scan_project" src-tauri/src/lib.rs | grep -q "mark_usage_for_packages"
check "scan_project calls mark_usage_for_packages"

grep -A 20 "fn scan_project" src-tauri/src/lib.rs | grep -q "find_duplicates"
check "scan_project calls find_duplicates"

echo ""

# Test 6: Build files
echo "Testing Documentation..."
[ -f "BUILD_INSTRUCTIONS.md" ] && check "BUILD_INSTRUCTIONS.md exists" || ((failed++)) && echo -e "${RED}✗${NC} BUILD_INSTRUCTIONS.md exists"
[ -f "VERIFICATION.md" ] && check "VERIFICATION.md exists" || ((failed++)) && echo -e "${RED}✗${NC} VERIFICATION.md exists"
[ -f "READY.md" ] && check "READY.md exists" || ((failed++)) && echo -e "${RED}✗${NC} READY.md exists"
[ -f ".github/workflows/build.yml" ] && check "GitHub Actions workflow exists" || ((failed++)) && echo -e "${RED}✗${NC} GitHub Actions workflow exists"

echo ""

# Test 7: Compilation
echo "Testing Compilation..."
cd src-tauri
if cargo check --quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Rust code compiles without errors"
    ((passed++))
else
    echo -e "${RED}✗${NC} Rust code has compilation errors"
    ((failed++))
fi
cd ..

echo ""

# Summary
echo "================================================"
echo "Summary"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $passed"
if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $failed"
else
    echo -e "${GREEN}Failed:${NC} 0"
fi
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Your software is ready to build!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. On Windows: npm ci && npm run build && npx tauri build"
    echo "2. In GitHub: Push code and run 'Build Release' workflow"
    echo ""
    echo "See BUILD_INSTRUCTIONS.md for detailed steps."
else
    echo -e "${YELLOW}⚠ Some checks failed. Review errors above.${NC}"
    exit 1
fi
