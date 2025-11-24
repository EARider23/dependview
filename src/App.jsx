import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'

function App() {
  const [folder, setFolder] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [logs, setLogs] = useState('')
  const logsRef = useRef(null)
  const [isTauri, setIsTauri] = useState(false)

  // Check if running in Tauri
  useEffect(() => {
    setIsTauri(window.__TAURI__ !== undefined)
    if (!window.__TAURI__) {
      setLogs('⚠️  Running in browser mode. To use full features:\n' +
             '   1. Run: npx tauri dev\n' +
             '   2. Or build .exe: npx tauri build\n\n' +
             '📝 For now, showing demo UI...\n\n')
    }
  }, [])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const pick = () => {
    const p = prompt('Enter project folder path:')
    if (p) setFolder(p)
  }

  const scan = async () => {
    if (!folder) return
    
    if (!isTauri) {
      setLogs((l) => l + '⚠️  Cannot scan in browser mode.\n' +
                         '   Run: npx tauri dev (to test)\n' +
                         '   Or: npx tauri build (to create .exe)\n\n')
      return
    }
    
    setBusy(true)
    setSelectedPackages(new Set())
    try {
      const res = await invoke('scan_project', { folder })
      setScanResult(res)
      setLogs((l) => l + `✓ Scanned ${res.total_count} packages (${formatBytes(res.total_size)})\n`)
    } catch (e) {
      setScanResult({ error: e.message })
      setLogs((l) => l + `✗ Error: ${e.message}\n`)
    }
    setBusy(false)
  }

  const togglePackage = (pkgPath) => {
    const newSelected = new Set(selectedPackages)
    if (newSelected.has(pkgPath)) {
      newSelected.delete(pkgPath)
    } else {
      newSelected.add(pkgPath)
    }
    setSelectedPackages(newSelected)
  }

  const toggleAll = () => {
    if (!scanResult?.packages) return
    if (selectedPackages.size === scanResult.packages.length) {
      setSelectedPackages(new Set())
    } else {
      setSelectedPackages(new Set(scanResult.packages.map(p => p.path)))
    }
  }

  const uninstallSelected = async () => {
    if (selectedPackages.size === 0) return
    
    if (!isTauri) {
      setLogs((l) => l + '⚠️  Uninstall requires Tauri app. Run: npx tauri dev\n')
      return
    }
    
    const count = selectedPackages.size
    const selected = Array.from(selectedPackages)
    const totalSize = selected.reduce((sum, path) => {
      const pkg = scanResult.packages.find(p => p.path === path)
      return sum + (pkg?.size || 0)
    }, 0)
    
    const ok = window.confirm(
      `Uninstall ${count} package(s)?\n\n` +
      `Total size: ${formatBytes(totalSize)}\n\n` +
      `This will DELETE the package folders permanently!`
    )
    if (!ok) return
    
    setBusy(true)
    setLogs((l) => l + `\n🗑️  Uninstalling ${count} packages...\n`)
    
    // Delete folders using a simple delete command
    for (const pkgPath of selected) {
      try {
        const pkg = scanResult.packages.find(p => p.path === pkgPath)
        setLogs((l) => l + `  Deleting: ${pkg?.name} (${formatBytes(pkg?.size || 0)})\n`)
        
        // Use fs remove via backend
        await invoke('delete_package', { path: pkgPath })
        
        setLogs((l) => l + `  ✓ Deleted: ${pkg?.name}\n`)
      } catch (e) {
        setLogs((l) => l + `  ✗ Failed: ${e.message}\n`)
      }
    }
    
    setLogs((l) => l + `\n✓ Freed ${formatBytes(totalSize)}. Rescanning...\n\n`)
    setSelectedPackages(new Set())
    await scan()
    setBusy(false)
  }

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  const loadDemo = (which) => {
    if (which === 'node') setFolder('/workspaces/codespaces-blank/example/node-app')
    else if (which === 'python') setFolder('/workspaces/codespaces-blank/example/python-app')
    else if (which === 'current') setFolder('/workspaces/codespaces-blank')
  }

  const filteredPackages = scanResult?.packages?.filter(pkg => 
    !filter || pkg.name.toLowerCase().includes(filter.toLowerCase())
  ) || []

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 1600 }}>
      <h1>📦 Package Space Analyzer</h1>
      <p>Scan INSTALLED packages (node_modules, site-packages, vendor, etc.) - NOT just manifests!</p>
      
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={pick} style={{ padding: '8px 16px' }}>Pick Folder</button>
        <button onClick={scan} disabled={!folder || busy} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none' }}>
          {busy ? '⏳ Scanning...' : '🔍 Scan Installed Packages'}
        </button>
        <div style={{ marginLeft: 8 }}>
          <button onClick={() => loadDemo('current')}>This Project</button>
          <button onClick={() => loadDemo('node')}>Node Example</button>
          <button onClick={() => loadDemo('python')}>Python Example</button>
        </div>
        <div style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#666' }}>
          {folder || 'No folder selected'}
        </div>
      </div>

      {scanResult && !scanResult.error && (
        <div style={{ background: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>📊 Summary</h3>
          <div style={{ display: 'flex', gap: 32 }}>
            <div><strong>Total Packages:</strong> {scanResult.total_count}</div>
            <div><strong>Total Size:</strong> {formatBytes(scanResult.total_size)}</div>
            <div><strong>Duplicates:</strong> {scanResult.duplicates?.length || 0}</div>
            <div><strong>Selected:</strong> {selectedPackages.size}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          {scanResult?.error && <div style={{ color: 'red', padding: 16 }}>{scanResult.error}</div>}
          
          {scanResult?.packages && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input
                  placeholder="Filter packages..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ flex: 1, padding: 8, fontSize: 14 }}
                />
                <button onClick={toggleAll} style={{ padding: '8px 16px' }}>
                  {selectedPackages.size === scanResult.packages.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={uninstallSelected}
                  disabled={selectedPackages.size === 0 || busy}
                  style={{
                    padding: '8px 16px',
                    background: selectedPackages.size > 0 ? '#dc3545' : '#ccc',
                    color: 'white',
                    border: 'none',
                    cursor: selectedPackages.size > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  🗑️  Uninstall Selected ({selectedPackages.size})
                </button>
              </div>

              <div style={{ maxHeight: 600, overflow: 'auto', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: 8, textAlign: 'left', width: 40 }}>☑</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>Package</th>
                      <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Manager</th>
                      <th style={{ padding: 8, textAlign: 'left', width: 100 }}>Version</th>
                      <th style={{ padding: 8, textAlign: 'right', width: 100 }}>Size</th>
                      <th style={{ padding: 8, textAlign: 'left', width: 60 }}>Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.map((pkg, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee', background: selectedPackages.has(pkg.path) ? '#fff3cd' : 'white' }}>
                        <td style={{ padding: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedPackages.has(pkg.path)}
                            onChange={() => togglePackage(pkg.path)}
                          />
                        </td>
                        <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 13 }}>{pkg.name}</td>
                        <td style={{ padding: 8 }}>
                          <span style={{ background: '#e9ecef', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                            {pkg.manager}
                          </span>
                        </td>
                        <td style={{ padding: 8, color: '#666', fontSize: 13 }}>{pkg.version}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{formatBytes(pkg.size)}</td>
                        <td style={{ padding: 8 }}>
                          {pkg.used === null ? '?' : pkg.used ? '✓' : '✗'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {scanResult.duplicates && scanResult.duplicates.length > 0 && (
                <div style={{ marginTop: 16, padding: 16, background: '#fff3cd', borderRadius: 8 }}>
                  <h4>🔁 Duplicate Packages Found</h4>
                  {scanResult.duplicates.map((dup, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <strong>{dup.package_name}</strong> found in {dup.locations.length} places
                      (wasted: {formatBytes(dup.total_wasted)})
                      <ul style={{ fontSize: 12, color: '#666' }}>
                        {dup.locations.slice(0, 3).map((loc, j) => (
                          <li key={j}>{loc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ width: 500 }}>
          <h3>📋 Activity Log</h3>
          <div
            ref={logsRef}
            style={{
              height: 600,
              overflow: 'auto',
              background: '#0f1724',
              color: '#d1fae5',
              padding: 12,
              fontFamily: 'Consolas, monospace',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              borderRadius: 4
            }}
          >
            {logs || '👋 Welcome! Pick a folder and click "Scan Installed Packages" to start.\n\nThis will scan for:\n• node_modules/ (npm)\n• site-packages/ (pip)\n• vendor/ (composer)\n• Flutter packages\n• Cargo dependencies'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
