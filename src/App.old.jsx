import React, { useState, useEffect, useRef } from 'react'

function App() {
  const [folder, setFolder] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [logs, setLogs] = useState('')
  const logsRef = useRef(null)

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const pick = () => {
    const p = prompt('Enter project folder path (e.g., /workspaces/codespaces-blank/example/node-app):')
    if (p) setFolder(p)
  }

  const scan = async () => {
    if (!folder) return
    setBusy(true)
    setSelectedPackages(new Set())
    try {
      const res = await window.__TAURI__.invoke('scan_project', { folder })
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
    if (selectedPackages.size === scanResult?.packages?.length) {
      setSelectedPackages(new Set())
    } else {
      setSelectedPackages(new Set(scanResult?.packages?.map(p => p.path) || []))
    }
  }

  const uninstallSelected = async () => {
    if (selectedPackages.size === 0) return
    
    const count = selectedPackages.size
    const ok = window.confirm(`Uninstall ${count} selected package(s)?\n\nThis will DELETE the package folders permanently!`)
    if (!ok) return
    
    setBusy(true)
    setLogs((l) => l + `\n🗑️  Uninstalling ${count} packages...\n`)
    
    for (const pkgPath of selectedPackages) {
      try {
        await window.__TAURI__.invoke('run_manager_cmd', { 
          manager: 'delete', 
          action: 'remove', 
          pkg: pkgPath, 
          folder: null 
        })
        setLogs((l) => l + `  ✓ Deleted: ${pkgPath}\n`)
      } catch (e) {
        setLogs((l) => l + `  ✗ Failed: ${pkgPath} - ${e.message}\n`)
      }
    }
    
    setLogs((l) => l + `\n✓ Uninstall complete. Rescanning...\n`)
    setBusy(false)
    setSelectedPackages(new Set())
    scan()
  }

  const [pkgInput, setPkgInput] = useState('')
  const [logs, setLogs] = useState('')
  const logsRef = useRef(null)
  const [filter, setFilter] = useState('')

  const runCmd = async (manager, action, pkg) => {
    const ok = window.confirm(`Run ${manager} ${action} ${pkg || ''} in ${folder || '.'}?`)
    if (!ok) return
    setBusy(true)
    setLogs((l) => l + `> ${manager} ${action} ${pkg || ''}\n`)
    try {
      const out = await window.__TAURI__.invoke('run_manager_cmd', { manager, action, pkg, folder })
      setLogs((l) => l + String(out) + '\n')
    } catch (e) {
      setLogs((l) => l + 'Error: ' + e.message + '\n')
      setBusy(false)
    }
    // keep busy until exit event clears it (backend will emit exit and clear busy)
  }

  const addPkg = async (manager) => {
    if (!pkgInput) return
    await runCmd(manager, 'add', pkgInput)
    setPkgInput('')
  }

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  // listen for streaming log events from the backend
  useEffect(() => {
    let unlistenPromise = null
    try {
      unlistenPromise = window.__TAURI__.event.listen('pkggui-log', (e) => {
        try {
          const payload = e.payload
          if (payload.stream === 'stdout' || payload.stream === 'stderr') {
            setLogs((l) => l + `${payload.stream.toUpperCase()}: ${payload.line}\n`)
          } else if (payload.stream === 'exit') {
            setLogs((l) => l + `PROCESS EXIT code=${payload.code}\n`)
            setBusy(false)
          }
        } catch (err) {
          console.error('log event parse error', err)
        }
      })
    } catch (err) {
      console.warn('Tauri event API not available in this environment', err)
    }

    return () => {
      if (unlistenPromise && typeof unlistenPromise.then === 'function') {
        unlistenPromise.then((un) => { if (un) un(); }).catch(() => {})
      }
    }
  }, [])

  const loadDemo = (which) => {
    // set folder to example subfolders
    if (which === 'node') setFolder('example/node-app')
    else if (which === 'python') setFolder('example/python-app')
    else if (which === 'all') setFolder('example')
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>PkgGUI (Tauri Prototype)</h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={pick}>Pick Project Folder</button>
        <button onClick={scan} disabled={!folder || busy}>Scan</button>
        <div style={{ marginLeft: 8 }}>
          <button onClick={() => loadDemo('node')}>Load Demo: Node</button>
          <button onClick={() => loadDemo('python')}>Load Demo: Python</button>
          <button onClick={() => loadDemo('all')}>Load Demo: All</button>
        </div>
        <div style={{ marginLeft: 'auto', fontStyle: 'italic' }}>{folder || 'No folder selected'}</div>
      </div>

      {busy && <p>Working…</p>}

      <div style={{ marginTop: 10 }}>
        <input placeholder="Filter manifests/deps" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 240, padding: 6 }} />
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          {scanResult && (
            <div style={{ marginTop: 16 }}>
              {scanResult.error && <div style={{ color: 'red' }}>{scanResult.error}</div>}
              {scanResult.manifests && (
                <div>
                  <h3>Detected Manifests</h3>
                  <ul>
                    {scanResult.manifests.map((m, i) => (
                      <li key={i}>
                        <b>{m.manager}</b>: {m.file}
                        {m.data && (
                          <div>
                            {m.data.dependencies && (
                              <div>
                                <h4>Dependencies</h4>
                                {Array.isArray(m.data.dependencies) ? (
                                  <ul>
                                    {m.data.dependencies.filter(d => !filter || String(d).includes(filter)).map((dep, idx) => (
                                      <li key={idx}>{dep}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <ul>
                                    {Object.entries(m.data.dependencies).filter(([k, _]) => !filter || k.includes(filter)).map(([k, v]) => (
                                      <li key={k}>{k}: {v}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {/* dependency graph placeholder */}
                        <div style={{ marginTop: 8, border: '1px dashed #ccc', padding: 8 }}>
                          <small>Dependency graph (preview)</small>
                          <div style={{ height: 60, background: '#fff', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Graph preview</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={() => runCmd(m.manager, 'install', null)}>Install (manager)</button>
                          <button onClick={() => runCmd(m.manager, 'list', null)}>List Installed</button>
                          <input
                            type="text"
                            placeholder="Package name"
                            value={pkgInput}
                            onChange={(e) => setPkgInput(e.target.value)}
                          />
                          <button onClick={() => addPkg(m.manager)}>Add Package</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ width: 480 }}>
          <h3>Logs</h3>
          <div ref={logsRef} style={{ height: 420, overflow: 'auto', background: '#0f1724', color: '#d1fae5', padding: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{logs || 'No logs yet'}</div>
        </div>
      </div>
    </div>
  )
}

export default App
