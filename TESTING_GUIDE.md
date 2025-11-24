# 🧪 Testing Your Package Space Analyzer

## ✅ Demo Projects Created

I've created test projects for you in `test-projects/`:

```
test-projects/
├── node-demo/          ← Node.js project with real packages
│   ├── node_modules/   (79 packages installed!)
│   ├── package.json
│   └── index.js        (uses lodash, axios, express)
│
└── python-demo/        ← Python project with venv
    ├── venv/           (packages installed in virtualenv)
    ├── main.py         (uses requests, flask)
    └── requirements.txt
```

---

## 🚀 How to Test (Right Now in Codespaces)

### Option 1: Test the UI in Browser

Since you're in Codespaces (no GUI), test via browser:

```bash
# Start the app
cd /workspaces/codespaces-blank
npm run dev
```

Then in another terminal:
```bash
npx tauri dev
```

**Or simpler - just open the browser view:**
- The UI is already built at http://localhost:5173
- Click "Open in Simple Browser" or visit the port

**In the UI:**
1. Click "Pick Folder" 
2. Enter: `/workspaces/codespaces-blank/test-projects/node-demo`
3. Click "Scan Installed Packages"
4. You should see:
   - ✅ 79+ packages detected (lodash, axios, express, etc.)
   - ✅ Sizes calculated (a few MB each)
   - ✅ lodash, axios, express marked as "used" ✓
   - ✅ Other packages marked as "unused" ✗

---

## 🪟 Test on Windows (Recommended)

**This is where your software REALLY shines!**

1. **Copy code to Windows PC:**
   ```bash
   git clone <your-repo>
   # or download as ZIP
   ```

2. **Build the .exe:**
   ```powershell
   cd path\to\project
   npm ci
   npm run build
   npx tauri build
   ```

3. **Run the .exe:**
   ```powershell
   .\src-tauri\target\release\Package Space Analyzer.exe
   ```

4. **Test with demo projects:**
   - Point it at `test-projects\node-demo`
   - Point it at `test-projects\python-demo`
   - Point it at ANY real project on your PC!

---

## 🎯 What to Expect When Testing

### Scanning `node-demo/`:

**Expected output:**
```
📊 Summary
Total Packages: 79
Total Size: ~15 MB
Duplicates: 0

Packages shown:
✓ lodash       npm   4.17.21   535 KB    ✓ used
✓ axios        npm   1.6.0     2.1 MB    ✓ used
✓ express      npm   4.18.0    210 KB    ✓ used
✓ body-parser  npm   1.20.0    235 KB    ✗ unused  ← (not imported in code)
... (75 more packages)
```

### Scanning `python-demo/`:

**Expected output:**
```
📊 Summary
Total Packages: 15
Total Size: ~5 MB
Duplicates: 0

Packages shown:
✓ requests     pip   2.31.0    1.2 MB    ✓ used
✓ Flask        pip   3.0.0     800 KB    ✓ used
✓ certifi      pip   2023.7    150 KB    ✗ unused
... (12 more packages)
```

---

## 🔍 Testing Specific Features

### 1. Test Usage Detection:

**What to check:**
- Packages imported in `index.js` should show ✓ (used)
- Packages NOT imported should show ✗ (unused)

**How it works:**
- Scans `index.js` for `require('lodash')`, `require('axios')`, etc.
- Marks those packages as used

### 2. Test Global Packages:

**Run this first:**
```bash
# Install some global packages
npm install -g typescript nodemon

# Then scan any folder
# Global packages should appear with "global" badge
```

### 3. Test Duplicate Detection:

**Create duplicate scenario:**
```bash
cd /workspaces/codespaces-blank/test-projects
mkdir project-A project-B

cd project-A
npm init -y
npm install lodash

cd ../project-B
npm init -y
npm install lodash

# Now scan test-projects/ folder
# Should detect lodash duplicated in A and B
```

### 4. Test Uninstall:

1. Scan `node-demo/`
2. Select some unused packages (checkbox)
3. Click "Uninstall Selected"
4. Confirm deletion
5. Rescan - packages should be gone
6. Check `node_modules/` - folders deleted

---

## 📊 Testing Checklist

Run through this to verify everything works:

- [ ] **Scan works** - Detects packages in node_modules
- [ ] **Size calculation** - Shows MB/GB for each package
- [ ] **Usage detection** - Marks imported packages as ✓
- [ ] **Filter works** - Can search for specific package
- [ ] **Checkboxes work** - Can select multiple packages
- [ ] **Select All works** - Toggles all checkboxes
- [ ] **Uninstall works** - Deletes selected packages
- [ ] **Rescan works** - Updates after deletion
- [ ] **Duplicates shown** - If same package in multiple folders
- [ ] **Activity log updates** - Shows progress messages

---

## 🎮 Quick Test Commands

### Test in Codespaces (Browser UI):

```bash
cd /workspaces/codespaces-blank

# Open browser at localhost:5173
# Use the Simple Browser feature in VS Code

# In UI, test these paths:
# → /workspaces/codespaces-blank/test-projects/node-demo
# → /workspaces/codespaces-blank/test-projects/python-demo
# → /workspaces/codespaces-blank (scan this project itself!)
```

### Test Backend Directly:

```bash
cd /workspaces/codespaces-blank/src-tauri

# Run Rust tests
cargo test

# Check compilation
cargo check

# Build release
cargo build --release
```

---

## 🐛 Troubleshooting Tests

### "No packages found"
- Make sure you scanned correct folder
- Check `node_modules/` exists in the path
- Try: `/workspaces/codespaces-blank/test-projects/node-demo`

### "Used detection not working"
- Make sure source files exist (`index.js`, `main.py`)
- Check packages are imported/required in those files
- Usage detection scans: `.js`, `.jsx`, `.ts`, `.tsx`, `.py` files

### "Can't test in Codespaces"
- Tauri needs GUI - use browser UI at localhost:5173
- Or push to GitHub and use Actions to build Windows .exe
- Or copy code to Windows PC to test native app

---

## 🎯 Real-World Testing

After basic tests pass, try with **REAL projects:**

### Your own projects:
```
C:\Users\YourName\Projects\my-react-app
C:\Users\YourName\Projects\python-project
C:\Dev\work-project
```

### Multiple projects (duplicate detection):
```
C:\Users\YourName\Projects\
  ├── app-1/ (has lodash)
  ├── app-2/ (has lodash)
  └── app-3/ (has lodash)

Scan: C:\Users\YourName\Projects\
Result: Shows lodash duplicated 3x with wasted space
```

---

## ✅ Success Criteria

**Your software is working correctly if:**

1. ✅ Scans test-projects/node-demo and shows 79+ packages
2. ✅ Shows sizes in KB/MB
3. ✅ Marks lodash/axios/express as "used" ✓
4. ✅ Marks other packages as "unused" ✗
5. ✅ Can uninstall selected packages
6. ✅ Rescanning shows updated counts
7. ✅ On Windows: .exe launches and native window opens

---

## 📁 Test Project Locations

```bash
/workspaces/codespaces-blank/test-projects/node-demo/
  node_modules/    ← 79 packages installed
  index.js         ← uses lodash, axios, express
  package.json

/workspaces/codespaces-blank/test-projects/python-demo/
  venv/           ← Python virtual environment
  main.py         ← uses requests, flask
```

**You can scan these RIGHT NOW to test!**

---

## 🚀 Next Steps

1. **Test in browser:** Open http://localhost:5173 and scan demo projects
2. **Verify features:** Check usage detection, sizes, uninstall
3. **Build .exe:** On Windows PC, run `npx tauri build`
4. **Test with real projects:** Point at your actual code folders
5. **Share/distribute:** Copy .exe to other Windows PCs

---

**Your demo projects are ready! Start testing now! 🎉**
