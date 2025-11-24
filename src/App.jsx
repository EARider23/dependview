import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

function App() {
  const [folder, setFolder] = useState(null)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [viewMode, setViewMode] = useState('project') // 'project' or 'system'
  const [scanResult, setScanResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [logs, setLogs] = useState('')
  const logsRef = useRef(null)
  const [isTauri, setIsTauri] = useState(true) // Assume Tauri by default

  // Check if running in Tauri
  useEffect(() => {
    // Check multiple ways to detect Tauri environment
    const checkTauri = () => {
      const hasTauri = window.__TAURI__ !== undefined || 
                       window.__TAURI_INTERNALS__ !== undefined ||
                       typeof invoke === 'function'
      setIsTauri(hasTauri)
      
      if (!hasTauri) {
        setLogs('⚠️  Running in browser mode. To use full features:\n' +
               '   1. Run: npx tauri dev\n' +
               '   2. Or build .exe: npx tauri build\n\n' +
               '📝 For now, showing demo UI...\n\n')
      }
    }
    
    // Check immediately and after a short delay
    checkTauri()
    const timer = setTimeout(checkTauri, 100)
    return () => clearTimeout(timer)
  }, [])

  // Load saved projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('importedProjects')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProjects(parsed)
        if (parsed.length > 0) {
          setCurrentProject(parsed[0])
          setFolder(parsed[0].path)
        }
      } catch (e) {
        console.error('Failed to load projects:', e)
      }
    }
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('importedProjects', JSON.stringify(projects))
    }
  }, [projects])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const pickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Folder'
      })
      
      if (selected) {
        const projectName = selected.split(/[\\\/]/).pop() || 'Unknown'
        const newProject = {
          path: selected,
          name: projectName,
          addedAt: new Date().toISOString(),
          lastScanned: null
        }
        
        // Check if project already exists
        const exists = projects.find(p => p.path === selected)
        if (!exists) {
          setProjects([...projects, newProject])
        }
        
        setCurrentProject(newProject)
        setFolder(selected)
        setLogs((l) => l + `📁 Imported project: ${projectName}\n`)
      }
    } catch (e) {
      setLogs((l) => l + `✗ Error selecting folder: ${e.message}\n`)
    }
  }

  const removeProject = (projectPath) => {
    const filtered = projects.filter(p => p.path !== projectPath)
    setProjects(filtered)
    if (currentProject?.path === projectPath) {
      setCurrentProject(filtered[0] || null)
      setFolder(filtered[0]?.path || null)
      setScanResult(null)
    }
  }

  const switchProject = (project) => {
    setCurrentProject(project)
    setFolder(project.path)
    setScanResult(null)
  }

  const scan = async () => {
    if (!folder) return
    
    setBusy(true)
    setSelectedPackages(new Set())
    try {
      const res = await invoke('scan_project', { folder })
      setScanResult(res)
      setLogs((l) => l + `✓ Scanned ${res.total_count} packages (${formatBytes(res.total_size)})\n`)
      
      // Update last scanned time for current project
      if (currentProject) {
        const updated = projects.map(p => 
          p.path === currentProject.path 
            ? { ...p, lastScanned: new Date().toISOString() }
            : p
        )
        setProjects(updated)
      }
    } catch (e) {
      setScanResult({ error: e.message })
      setLogs((l) => l + `✗ Error: ${e.message}\n`)
    }
    setBusy(false)
  }

  const scanSystemPackages = async () => {
    setBusy(true)
    setSelectedPackages(new Set())
    try {
      // Scan both npm and pip global packages
      const [npmResult, pipResult] = await Promise.all([
        invoke('scan_global_npm').catch(() => ({ packages: [] })),
        invoke('scan_global_pip').catch(() => ({ packages: [] }))
      ])
      
      const combined = {
        packages: [...npmResult.packages, ...pipResult.packages],
        total_count: (npmResult.packages?.length || 0) + (pipResult.packages?.length || 0),
        total_size: 0 // Global packages don't track size yet
      }
      
      setScanResult(combined)
      setLogs((l) => l + `✓ Found ${combined.total_count} global packages\n`)
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
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 1600, margin: '0 auto' }}>
      <h1>📦 DependView - Package Manager</h1>
      <p>Scan and manage project dependencies & global packages</p>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <button onClick={pickFolder} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          📁 Browse & Import Project
        </button>
        
        <div style={{ display: 'flex', gap: 4, background: '#f0f0f0', padding: 4, borderRadius: 6 }}>
          <button
            onClick={() => setViewMode('project')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'project' ? '#007bff' : 'transparent',
              color: viewMode === 'project' ? 'white' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            📂 Project Packages
          </button>
          <button
            onClick={() => setViewMode('system')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'system' ? '#007bff' : 'transparent',
              color: viewMode === 'system' ? 'white' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            🌐 System Packages
          </button>
        </div>

        {viewMode === 'project' && folder && (
          <button
            onClick={scan}
            disabled={busy}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1
            }}
          >
            {busy ? '⏳ Scanning...' : '🔄 Refresh Packages'}
          </button>
        )}

        {viewMode === 'system' && (
          <button
            onClick={scanSystemPackages}
            disabled={busy}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1
            }}
          >
            {busy ? '⏳ Scanning...' : '🔍 Scan Global Packages'}
          </button>
        )}
      </div>

      {/* Project List Sidebar */}
      {viewMode === 'project' && projects.length > 0 && (
        <div style={{ marginBottom: 20, background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>📚 Imported Projects</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {projects.map((proj) => (
              <div
                key={proj.path}
                style={{
                  padding: 12,
                  background: currentProject?.path === proj.path ? '#007bff' : 'white',
                  color: currentProject?.path === proj.path ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  cursor: 'pointer',
                  minWidth: 200
                }}
                onClick={() => switchProject(proj)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{proj.name}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{proj.path}</div>
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                  {proj.lastScanned ? `Scanned: ${new Date(proj.lastScanned).toLocaleString()}` : 'Not scanned yet'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeProject(proj.path)
                  }}
                  style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {scanResult && !scanResult.error && (
        <div style={{ background: '#e7f3ff', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div><strong>📦 Total Packages:</strong> {scanResult.total_count}</div>
            <div><strong>💾 Total Size:</strong> {formatBytes(scanResult.total_size)}</div>
            {scanResult.duplicates && <div><strong>🔁 Duplicates:</strong> {scanResult.duplicates.length}</div>}
            <div><strong>☑️ Selected:</strong> {selectedPackages.size}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          {scanResult?.error && (
            <div style={{ color: 'red', padding: 16, background: '#ffe0e0', borderRadius: 8 }}>
              ❌ {scanResult.error}
            </div>
          )}
          
          {scanResult?.packages && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input
                  placeholder="🔍 Filter packages..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ flex: 1, padding: 10, fontSize: 14, border: '1px solid #ddd', borderRadius: 6 }}
                />
                <button
                  onClick={toggleAll}
                  style={{
                    padding: '10px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  {selectedPackages.size === scanResult.packages.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={uninstallSelected}
                  disabled={selectedPackages.size === 0 || busy}
                  style={{
                    padding: '10px 16px',
                    background: selectedPackages.size > 0 ? '#dc3545' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: selectedPackages.size > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  🗑️ Uninstall ({selectedPackages.size})
                </button>
              </div>

              {/* Card Grid Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 16,
                  maxHeight: 600,
                  overflow: 'auto',
                  padding: 4
                }}
              >
                {filteredPackages.map((pkg, i) => (
                  <div
                    key={i}
                    style={{
                      border: '2px solid ' + (selectedPackages.has(pkg.path) ? '#007bff' : '#ddd'),
                      borderRadius: 12,
                      padding: 16,
                      background: selectedPackages.has(pkg.path) ? '#e7f3ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onClick={() => togglePackage(pkg.path)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedPackages.has(pkg.path)}
                      onChange={() => togglePackage(pkg.path)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 20,
                        height: 20,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Package Icon/Image */}
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 30,
                        marginBottom: 12
                      }}
                    >
                      {pkg.manager === 'npm' ? '📦' : pkg.manager === 'pip' ? '🐍' : pkg.manager === 'composer' ? '🎼' : '📚'}
                    </div>

                    {/* Package Name */}
                    <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, wordBreak: 'break-word' }}>
                      {pkg.name}
                    </div>

                    {/* Manager Badge */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: pkg.manager === 'npm' ? '#cb3837' : pkg.manager === 'pip' ? '#3776ab' : '#885630',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 'bold'
                        }}
                      >
                        {pkg.manager.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 13, color: '#666' }}>v{pkg.version}</span>
                      {pkg.used !== null && (
                        <span
                          style={{
                            background: pkg.used ? '#28a745' : '#ffc107',
                            color: pkg.used ? 'white' : '#333',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 'bold'
                          }}
                        >
                          {pkg.used ? '✓ USED' : '✗ UNUSED'}
                        </span>
                      )}
                    </div>

                    {/* Size */}
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#007bff', marginBottom: 8 }}>
                      {formatBytes(pkg.size)}
                    </div>

                    {/* Path */}
                    <div
                      style={{
                        fontSize: 11,
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={pkg.path}
                    >
                      📂 {pkg.path}
                    </div>
                  </div>
                ))}
              </div>

              {/* Duplicates Warning */}
              {scanResult.duplicates && scanResult.duplicates.length > 0 && (
                <div style={{ marginTop: 20, padding: 16, background: '#fff3cd', borderRadius: 8, border: '2px solid #ffc107' }}>
                  <h4 style={{ marginTop: 0 }}>🔁 Duplicate Packages Found</h4>
                  {scanResult.duplicates.map((dup, i) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #ffe69c' }}>
                      <strong>{dup.package_name}</strong> - Found in {dup.locations.length} locations
                      <div style={{ color: '#856404', marginTop: 4 }}>
                        💾 Wasted space: {formatBytes(dup.total_wasted)}
                      </div>
                      <ul style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                        {dup.locations.slice(0, 3).map((loc, j) => (
                          <li key={j}>{loc}</li>
                        ))}
                        {dup.locations.length > 3 && <li>...and {dup.locations.length - 3} more</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!scanResult && (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <h2>👋 Welcome to DependView!</h2>
              <p>
                {viewMode === 'project'
                  ? '📁 Click "Browse & Import Project" to select a project folder, then click "Refresh Packages" to scan.'
                  : '🌐 Click "Scan Global Packages" to view system-wide installed packages.'}
              </p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div style={{ width: 400 }}>
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
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              borderRadius: 8,
              lineHeight: 1.6
            }}
          >
            {logs || '👋 Welcome to DependView!\n\n' +
              '📂 PROJECT MODE:\n' +
              '• Browse and import project folders\n' +
              '• Scan node_modules, site-packages, vendor, etc.\n' +
              '• Track usage and find duplicates\n\n' +
              '🌐 SYSTEM MODE:\n' +
              '• View globally installed npm packages\n' +
              '• View globally installed pip packages\n' +
              '• See install locations\n\n' +
              'Ready to start! 🚀'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
