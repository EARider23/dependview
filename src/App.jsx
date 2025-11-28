import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Toaster } from './components/ui/toaster'
import { useToast } from './components/ui/use-toast'
import { FolderOpen, Package, Layers, Search, Download, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react'
import './styles.css'
import babelImg from './assets/babel.svg'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: 20, overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px' }}>
            Reload App
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [folder, setFolder] = useState(null)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [viewMode, setViewMode] = useState('project') // 'project' | 'system' | 'frameworks'
  const [scanResult, setScanResult] = useState(null)
  const [frameworks, setFrameworks] = useState([])
  const [selectedFramework, setSelectedFramework] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [installTarget, setInstallTarget] = useState('global') // 'global' or project path
  const [busy, setBusy] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'size' | 'age'
  const [logs, setLogs] = useState('')
  const logsRef = useRef(null)
  const [isTauri, setIsTauri] = useState(true) // Assume Tauri by default
  const [backend, setBackend] = useState('browser') // 'tauri' | 'electron' | 'browser'
  const { toast } = useToast()

  // Popular package suggestions by category
  const popularPackages = {
    npm: {
      date: ['date-fns', 'moment', 'dayjs', 'luxon'],
      http: ['axios', 'fetch', 'got', 'node-fetch'],
      testing: ['jest', 'mocha', 'chai', 'vitest'],
      ui: ['react', 'vue', 'svelte', 'solid-js'],
      build: ['vite', 'webpack', 'rollup', 'esbuild'],
      utility: ['lodash', 'underscore', 'ramda']
    },
    pip: {
      data: ['pandas', 'numpy', 'scipy'],
      web: ['django', 'flask', 'fastapi'],
      http: ['requests', 'httpx', 'aiohttp'],
      testing: ['pytest', 'unittest', 'nose'],
      ml: ['tensorflow', 'pytorch', 'scikit-learn']
    }
  }

  // Check if running in Tauri
  useEffect(() => {
    // Check multiple ways to detect Tauri environment
    const checkTauri = () => {
      const hasTauriInternals = typeof window !== 'undefined' && (window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined)
      const hasElectronApi = typeof window !== 'undefined' && window.api !== undefined
      if (hasTauriInternals) setBackend('tauri')
      else if (hasElectronApi) setBackend('electron')
      else setBackend('browser')
      setIsTauri(hasTauriInternals)

      if (!hasTauriInternals && !hasElectronApi) {
        const msg = 'Running in browser mode — some features disabled.'
        setLogs('⚠️  Running in browser mode. To use full features:\n' +
               '   1. Run: npx tauri dev\n' +
               '   2. Or build .exe: npx tauri build\n\n' +
               '📝 For now, showing demo UI...\n\n')
        showToast(msg, 'warning')
      }
    }
    
    // Check immediately and after a short delay
    checkTauri()
    const timer = setTimeout(checkTauri, 100)
    return () => clearTimeout(timer)
  }, [])

  // Load saved projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('projects')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProjects(parsed)
      } catch (e) {
        console.error('Failed to load projects:', e)
      }
    }
  }, [])

  const uninstallSelected = async () => {
    if (!isTauri) {
      setLogs((l) => l + '⚠️  Uninstall requires Tauri app. Run: npx tauri dev\n')
      showToast('Uninstall requires desktop app (Tauri).', 'warning')
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
    showToast(`Uninstalling ${count} package(s)...`, 'info')
    
    // Delete folders using a simple delete command
    for (const pkgPath of selected) {
      try {
        const pkg = scanResult.packages.find(p => p.path === pkgPath)
        setLogs((l) => l + `  Deleting: ${pkg?.name} (${formatBytes(pkg?.size || 0)})\n`)
        
        // Use fs remove via backend
        if (backend === 'tauri') {
          await invoke('delete_package', { path: pkgPath })
        } else if (backend === 'electron' && window.api && typeof window.api.deletePackage === 'function') {
          await window.api.deletePackage(pkgPath)
        } else {
          throw new Error('delete_package not available in this environment')
        }
        
        setLogs((l) => l + `  ✓ Deleted: ${pkg?.name}\n`)
      } catch (e) {
        setLogs((l) => l + `  ✗ Failed: ${e.message}\n`)
        showToast(`Failed to delete ${pkg?.name}: ${e.message}`, 'error')
      }
    }
    
    setLogs((l) => l + `\n✓ Freed ${formatBytes(totalSize)}. Rescanning...\n\n`)
    showToast(`Freed ${formatBytes(totalSize)}`, 'success')
    setSelectedPackages(new Set())
    await scan()
    setBusy(false)
  }

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  // Listen for streaming scan events (scan-progress, scan-complete)
  useEffect(() => {
    if (!isTauri || !window.__TAURI__ || !window.__TAURI__.event) return

    let buffer = []
    let flushTimer = null

    const flush = () => {
      if (buffer.length === 0) return
      setScanResult(prev => {
        const prevPackages = (prev && prev.packages) || []
        return { ...prev, packages: [...prevPackages, ...buffer] }
      })
      buffer = []
    }

    const listenProgress = window.__TAURI__.event.listen('scan-progress', (e) => {
      try {
        const payload = e.payload
        const pkg = payload && payload.package ? payload.package : payload
        buffer.push(pkg)
        if (!flushTimer) {
          flushTimer = setTimeout(() => {
            flush()
            clearTimeout(flushTimer)
            flushTimer = null
          }, 150)
        }
      } catch (err) {
        console.warn('scan-progress handler error', err)
      }
    })

    const listenComplete = window.__TAURI__.event.listen('scan-complete', (e) => {
      try {
        if (flushTimer) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
        flush()
        const payload = e.payload
        setScanResult(prev => ({ ...(prev || {}), packages: (prev && prev.packages) || [], total_size: payload.total_size || 0, total_count: payload.total_count || 0, duplicates: payload.duplicates || [] }))
        showToast(`Scanned ${payload.total_count || 0} packages`, 'success')
      } catch (err) {
        console.warn('scan-complete handler error', err)
      }
    })

    const listenError = window.__TAURI__.event.listen('scan-error', (e) => {
      try {
        const payload = e.payload
        showToast(`Scan error: ${payload?.error || 'unknown'}`, 'error')
      } catch (err) {
        console.warn('scan-error handler', err)
      }
    })

    // cleanup
    return () => {
      listenProgress.then(f => f && f())
      listenComplete.then(f => f && f())
      listenError.then(f => f && f())
      if (flushTimer) clearTimeout(flushTimer)
    }
  }, [isTauri])

  // Toast helper using shadcn toast
  function showToast(message, type = 'info') {
    const variantMap = {
      'info': 'default',
      'success': 'default',
      'warning': 'default',
      'error': 'destructive'
    }
    
    const titleMap = {
      'info': 'Info',
      'success': 'Success',
      'warning': 'Warning',
      'error': 'Error'
    }
    
    toast({
      title: titleMap[type] || 'Info',
      description: message,
      variant: variantMap[type] || 'default'
    })
  }

  // Detect installed frameworks
  const detectFrameworks = async () => {
    if (backend !== 'tauri') {
      showToast('Framework detection requires desktop app', 'warning')
      return
    }
    setBusy(true)
    try {
      const detected = await invoke('detect_frameworks')
      setFrameworks(detected)
      if (detected.length > 0) {
        setSelectedFramework(detected[0])
        showToast(`Detected ${detected.length} framework(s)`, 'success')
      } else {
        showToast('No frameworks detected', 'info')
      }
    } catch (e) {
      showToast(`Framework detection failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  // Search packages in registry
  const searchPackages = async () => {
    if (!selectedFramework || !searchQuery) return
    setBusy(true)
    try {
      const results = await invoke('search_packages', {
        packageManager: selectedFramework.package_manager,
        query: searchQuery
      })
      setSearchResults(results)
      if (results.length === 0) {
        showToast(`No packages found for "${searchQuery}". Try exact package name.`, 'warning')
      } else {
        showToast(`Found ${results.length} package(s)`, 'success')
      }
    } catch (e) {
      showToast(`Search failed: ${e}`, 'error')
      setSearchResults([])
    }
    setBusy(false)
  }

  // Install package
  const installPackage = async (packageName) => {
    if (!selectedFramework) return
    setBusy(true)
    
    const isGlobal = installTarget === 'global'
    
    // Check if project selected for non-global install
    if (!isGlobal && !currentProject) {
      showToast('Please import a project first or select Global install', 'warning')
      setBusy(false)
      return
    }
    
    const projectPath = isGlobal ? null : currentProject.path
    
    // For Python + project install, check venv
    if (selectedFramework.package_manager === 'pip' && !isGlobal && projectPath) {
      try {
        const hasVenv = await invoke('check_venv', { projectPath })
        if (!hasVenv) {
          const createVenv = window.confirm(
            'No virtual environment found in this project.\n\n' +
            'Would you like to create one? This is recommended for Python projects.\n\n' +
            'A "venv" folder will be created in the project root.'
          )
          if (createVenv) {
            showToast('Creating virtual environment...', 'info')
            try {
              await invoke('create_venv', { projectPath })
              showToast('Virtual environment created successfully', 'success')
            } catch (venvError) {
              showToast(`Failed to create venv: ${venvError}`, 'error')
              setBusy(false)
              return
            }
          } else {
            showToast('Installation cancelled - venv required', 'warning')
            setBusy(false)
            return
          }
        }
      } catch (e) {
        showToast(`Venv check failed: ${e}`, 'error')
        setBusy(false)
        return
      }
    }
    
    // Proceed with installation
    try {
      await invoke('install_package', {
        packageManager: selectedFramework.package_manager,
        packageName,
        projectPath,
        isGlobal
      })
      showToast(`Installing ${packageName}...`, 'info')
      // Listen for install completion
      setTimeout(() => {
        showToast(`${packageName} installed successfully`, 'success')
        if (viewMode === 'system') scanSystemPackages()
        else if (viewMode === 'project' && currentProject) scan()
      }, 3000)
    } catch (e) {
      showToast(`Install failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  // Update package
  const updatePackage = async (packageName) => {
    if (!selectedFramework) return
    setBusy(true)
    const isGlobal = installTarget === 'global'
    const projectPath = isGlobal ? null : (currentProject?.path || null)
    
    try {
      await invoke('update_package', {
        packageManager: selectedFramework.package_manager,
        packageName,
        projectPath,
        isGlobal
      })
      showToast(`Updating ${packageName}...`, 'info')
      setTimeout(() => {
        showToast(`${packageName} updated successfully`, 'success')
        if (viewMode === 'system') scanSystemPackages()
        else if (viewMode === 'project' && currentProject) scan()
      }, 3000)
    } catch (e) {
      showToast(`Update failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  const loadDemo = (which) => {
    if (which === 'node') setFolder('/workspaces/codespaces-blank/example/node-app')
    else if (which === 'python') setFolder('/workspaces/codespaces-blank/example/python-app')
    else if (which === 'current') setFolder('/workspaces/codespaces-blank')
  }

  // Pick folder and import project
  const pickFolder = async () => {
    if (!isTauri) {
      showToast('Folder picker requires desktop app', 'warning')
      return
    }
    try {
      const selected = await open({ directory: true, multiple: false })
      if (selected) {
        setFolder(selected)
        const projectName = selected.split(/[\\/]/).pop()
        const newProject = { path: selected, name: projectName }
        const updated = [newProject, ...projects.filter(p => p.path !== selected)]
        setProjects(updated)
        localStorage.setItem('projects', JSON.stringify(updated))
        setCurrentProject(newProject)
        showToast(`Imported: ${projectName}`, 'success')
        await scan()
      }
    } catch (e) {
      showToast(`Failed to pick folder: ${e}`, 'error')
    }
  }

  // Scan a project (optionally pass a project object to scan immediately)
  const scan = async (project = null) => {
    const proj = project || currentProject
    if (!proj) {
      showToast('No project selected', 'warning')
      return
    }
    setBusy(true)
    setLogs((l) => l + `\n🔍 Scanning: ${proj.path}\n`)
    try {
      // For Tauri backend use streaming scan to receive incremental packages
      if (backend === 'tauri') {
        // reset scan result so UI can populate incrementally
        setScanResult({ packages: [], total_size: 0, total_count: 0, duplicates: [] })
        await invoke('scan_project_stream', { folder: proj.path })
      } else {
        const result = await invoke('scan_project', { folder: proj.path })
        setScanResult(result)
      }
      const updated = projects.map(p => 
        p.path === proj.path ? { ...p, lastScanned: Date.now() } : p
      )
      setProjects(updated)
      localStorage.setItem('projects', JSON.stringify(updated))
      // showToast will be triggered by scan-complete event when streaming
    } catch (e) {
      setLogs((l) => l + `✗ Scan failed: ${e}\n`)
      showToast(`Scan failed: ${e}`, 'error')
      setScanResult({ error: String(e) })
    }
    setBusy(false)
  }

  // Scan system packages
  const scanSystemPackages = async () => {
    if (!isTauri) {
      showToast('System scan requires desktop app', 'warning')
      return
    }
    setBusy(true)
    setLogs((l) => l + '\n🔍 Scanning global packages...\n')
    try {
      const result = await invoke('scan_system_packages')
      setScanResult(result)
      setLogs((l) => l + `✓ Found ${result.total_count} global packages (${formatBytes(result.total_size)})\n`)
      showToast(`Found ${result.total_count} global packages`, 'success')
    } catch (e) {
      setLogs((l) => l + `✗ System scan failed: ${e}\n`)
      showToast(`System scan failed: ${e}`, 'error')
      setScanResult({ error: String(e) })
    }
    setBusy(false)
  }

  // Switch project
  const switchProject = (proj) => {
    setCurrentProject(proj)
    setScanResult(null)
    setSelectedPackages(new Set())
    showToast(`Switched to: ${proj.name}`, 'info')
    // Immediately scan the project we switched to so packages load
    scan(proj)
  }

  // Remove project
  const removeProject = (path) => {
    const updated = projects.filter(p => p.path !== path)
    setProjects(updated)
    localStorage.setItem('projects', JSON.stringify(updated))
    if (currentProject?.path === path) {
      setCurrentProject(null)
      setScanResult(null)
    }
    showToast('Project removed', 'info')
  }

  // Toggle package selection
  const togglePackage = (path) => {
    const newSet = new Set(selectedPackages)
    if (newSet.has(path)) newSet.delete(path)
    else newSet.add(path)
    setSelectedPackages(newSet)
  }

  // Toggle all packages
  const toggleAll = () => {
    if (selectedPackages.size === scanResult.packages.length) {
      setSelectedPackages(new Set())
    } else {
      setSelectedPackages(new Set(scanResult.packages.map(p => p.path)))
    }
  }

  // Get size category and color
  const getSizeInfo = (bytes) => {
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return { label: 'Tiny', color: 'bg-green-100 text-green-800', emoji: '🟢' }
    if (mb < 5) return { label: 'Small', color: 'bg-blue-100 text-blue-800', emoji: '🔵' }
    if (mb < 20) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' }
    if (mb < 50) return { label: 'Large', color: 'bg-orange-100 text-orange-800', emoji: '🟠' }
    return { label: 'Huge', color: 'bg-red-100 text-red-800', emoji: '🔴' }
  }

  // Get popular packages for current framework
  const getPopularSuggestions = () => {
    if (!selectedFramework) return []
    const pm = selectedFramework.package_manager
    if (pm === 'npm' && popularPackages.npm) {
      return Object.entries(popularPackages.npm).flatMap(([category, packages]) =>
        packages.map(pkg => ({ name: pkg, category }))
      )
    }
    if (pm === 'pip' && popularPackages.pip) {
      return Object.entries(popularPackages.pip).flatMap(([category, packages]) =>
        packages.map(pkg => ({ name: pkg, category }))
      )
    }
    return []
  }

  // Format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter and sort packages
  const filteredPackages = React.useMemo(() => {
    let packages = scanResult?.packages?.filter(pkg => 
      !filter || pkg.name.toLowerCase().includes(filter.toLowerCase())
    ) || []
    
    // Sort packages
    if (sortBy === 'size') {
      packages = [...packages].sort((a, b) => (b.size || 0) - (a.size || 0))
    } else if (sortBy === 'name') {
      packages = [...packages].sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return packages
  }, [scanResult, filter, sortBy])

  // Calculate total size of top packages
  const topLargestPackages = React.useMemo(() => {
    if (!scanResult?.packages) return []
    return [...scanResult.packages]
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5)
  }, [scanResult])

  console.log('App rendering, backend:', backend, 'isTauri:', isTauri)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 p-5">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-4xl bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Peeak
                </CardTitle>
                <CardDescription>Modern Package Manager for Developers</CardDescription>
              </div>
              <Badge variant="default" className="h-10 px-6 text-sm">
                {backend === 'tauri' ? '⚡ Desktop Mode' : backend === 'electron' ? '🔌 Electron Mode' : '🌐 Browser Mode'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Top Controls */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <Button onClick={pickFolder} size="lg" className="gap-2">
                <FolderOpen className="w-5 h-5" />
                Browse & Import Project
              </Button>
              
              <div className="flex gap-0 bg-muted p-1 rounded-lg">
                <Button
                  onClick={() => setViewMode('project')}
                  variant={viewMode === 'project' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Package className="w-4 h-4" />
                  Project Packages
                </Button>
                <Button
                  onClick={() => setViewMode('system')}
                  variant={viewMode === 'system' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Layers className="w-4 h-4" />
                  System Packages
                </Button>
                <Button
                  onClick={() => { setViewMode('frameworks'); detectFrameworks(); }}
                  variant={viewMode === 'frameworks' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Frameworks
                </Button>
              </div>
            </div>

            {viewMode === 'system' && (
              <Button
                onClick={scanSystemPackages}
                disabled={busy}
                variant="secondary"
                className="gap-2"
              >
                {busy ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {busy ? 'Scanning...' : 'Scan Global Packages'}
              </Button>
            )}

            {/* Frameworks View */}
            {viewMode === 'frameworks' && (
        <div style={{ marginBottom: 30 }}>
          {/* Framework Cards */}
          {frameworks.length > 0 && (
            <div style={{ 
              marginBottom: 24,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 20, fontWeight: 700, color: '#333' }}>
                🛠️ Detected Frameworks
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {frameworks.map((fw, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFramework(fw)}
                    style={{
                      padding: 20,
                      background: selectedFramework?.name === fw.name 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'white',
                      color: selectedFramework?.name === fw.name ? 'white' : '#333',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: selectedFramework?.name === fw.name ? 'none' : '2px solid #e0e0e0',
                      boxShadow: selectedFramework?.name === fw.name 
                        ? '0 6px 20px rgba(102, 126, 234, 0.4)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>
                      {fw.name === 'Node.js' ? '📦' : fw.name === 'Python' ? '🐍' : fw.name === 'Flutter' ? '🦋' : fw.name === 'Go' ? '🐹' : '🦀'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{fw.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>{fw.version}</div>
                    <div style={{ 
                      fontSize: 11, 
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      📂 {fw.path || 'Unknown path'}
                    </div>
                    <div style={{
                      marginTop: 12,
                      padding: '6px 12px',
                      background: selectedFramework?.name === fw.name ? 'rgba(255,255,255,0.2)' : '#667eea',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      {fw.package_manager.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package Browser & Installer */}
          {selectedFramework && (
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 700, color: '#333' }}>
                📦 Browse & Install Packages for {selectedFramework.name}
              </h3>

              {/* Install Target Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 8, display: 'block' }}>
                  Install Location:
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setInstallTarget('global')}
                    style={{
                      padding: '10px 20px',
                      background: installTarget === 'global' ? '#667eea' : '#e0e0e0',
                      color: installTarget === 'global' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    🌐 Global
                  </button>
                  {currentProject && (
                    <button
                      onClick={() => setInstallTarget(currentProject.path)}
                      style={{
                        padding: '10px 20px',
                        background: installTarget !== 'global' ? '#667eea' : '#e0e0e0',
                        color: installTarget !== 'global' ? 'white' : '#666',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      📂 Current Project ({currentProject.name})
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input
                  placeholder={`Search ${selectedFramework.package_manager} packages...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPackages()}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: 15,
                    border: '2px solid #e0e0e0',
                    borderRadius: 12,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={searchPackages}
                  disabled={busy || !searchQuery}
                  style={{
                    padding: '14px 28px',
                    background: busy || !searchQuery ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    cursor: busy || !searchQuery ? 'not-allowed' : 'pointer',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: busy || !searchQuery ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  🔍 Search
                </button>
              </div>

              {/* Popular Package Suggestions */}
              {!searchQuery && searchResults.length === 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 12 }}>
                    💡 Popular Packages
                  </h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {getPopularSuggestions().slice(0, 12).map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(item.name)
                        }}
                        style={{
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
                          border: '1px solid #ccc',
                          borderRadius: 20,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          color: '#333'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          e.target.style.color = 'white'
                          e.target.style.borderColor = '#667eea'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)'
                          e.target.style.color = '#333'
                          e.target.style.borderColor = '#ccc'
                        }}
                      >
                        {item.name} <span style={{ opacity: 0.6, fontSize: 11 }}>({item.category})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 16 }}>
                    Search Results ({searchResults.length})
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16,
                    maxHeight: 500,
                    overflow: 'auto'
                  }}>
                    {searchResults.map((pkg, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 16,
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          borderRadius: 12,
                          border: '2px solid #e0e0e0'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#333' }}>
                          {pkg.name || pkg.package?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
                          {pkg.description || pkg.package?.description || 'No description available'}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                          Version: {pkg.version || pkg.package?.version || 'latest'}
                        </div>
                        <button
                          onClick={() => installPackage(pkg.name || pkg.package?.name)}
                          disabled={busy}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: busy ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: busy ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                          }}
                        >
                          ⬇️ Install
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently Installed Packages Section */}
              {(viewMode === 'frameworks' && scanResult?.packages) && (
                <div style={{ marginTop: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: 0 }}>
                      Installed Packages ({scanResult.packages.filter(p => p.manager === selectedFramework.package_manager).length})
                    </h4>
                    <button
                      onClick={() => {
                        if (installTarget === 'global') scanSystemPackages()
                        else if (currentProject) scan()
                      }}
                      disabled={busy}
                      style={{
                        padding: '8px 16px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}>
                    {scanResult.packages
                      .filter(p => p.manager === selectedFramework.package_manager)
                      .map((pkg, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 16,
                            background: 'white',
                            borderRadius: 12,
                            border: '2px solid #e0e0e0'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#333' }}>
                            {pkg.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                            v{pkg.version}
                          </div>
                          <button
                            onClick={() => updatePackage(pkg.name)}
                            disabled={busy}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: busy ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              cursor: busy ? 'not-allowed' : 'pointer',
                              fontSize: 13,
                              fontWeight: 600
                            }}
                          >
                            ⬆️ Update
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No frameworks detected */}
          {frameworks.length === 0 && !busy && (
            <div style={{
              padding: 60,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 16
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛠️</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                No Frameworks Detected
              </h3>
              <p style={{ fontSize: 15, color: '#666' }}>
                Install Node.js, Python, Flutter, Go, or Rust to get started.
              </p>
            </div>
          )}
        </div>
            )}

            {/* Project List Sidebar */}
            {viewMode === 'project' && projects.length > 0 && (
        <div style={{ 
          marginBottom: 30, 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
          padding: 24, 
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 16,
            fontSize: 20,
            fontWeight: 700,
            color: '#333'
          }}>📚 Imported Projects</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {projects.map((proj) => (
              <div
                key={proj.path}
                className="fade-in"
                style={{
                  padding: 16,
                  background: currentProject?.path === proj.path 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'white',
                  color: currentProject?.path === proj.path ? 'white' : '#333',
                  border: currentProject?.path === proj.path ? 'none' : '2px solid #e0e0e0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  minWidth: 220,
                  transition: 'all 0.2s',
                  boxShadow: currentProject?.path === proj.path 
                    ? '0 6px 20px rgba(102, 126, 234, 0.4)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onClick={() => switchProject(proj)}
              >
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{proj.name}</div>
                <div style={{ 
                  fontSize: 11, 
                  opacity: 0.8, 
                  marginBottom: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📂 {proj.path}
                </div>
                <div style={{ fontSize: 10, marginTop: 8, opacity: 0.9 }}>
                  {proj.lastScanned ? `✓ ${new Date(proj.lastScanned).toLocaleString()}` : '⏳ Not scanned'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeProject(proj.path)
                  }}
                  style={{
                    marginTop: 12,
                    padding: '6px 12px',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            ))}
          </div>
        </div>
            )}

            {/* Summary */}
            {scanResult && !scanResult.error && (
        <div className="fade-in" style={{ 
          background: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)', 
          padding: 24, 
          borderRadius: 16, 
          marginBottom: 30,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{ fontSize: 32 }}>📦</span>
              <div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Total Packages</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{scanResult.total_count}</div>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{ fontSize: 32 }}>💾</span>
              <div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Total Size</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{formatBytes(scanResult.total_size)}</div>
              </div>
            </div>
            {scanResult.duplicates && scanResult.duplicates.length > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                background: 'rgba(255, 193, 7, 0.2)',
                padding: '12px 20px',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <span style={{ fontSize: 32 }}>🔁</span>
                <div>
                  <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Duplicates</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f57c00' }}>{scanResult.duplicates.length}</div>
                </div>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{ fontSize: 32 }}>☑️</span>
              <div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Selected</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{selectedPackages.size}</div>
              </div>
            </div>
          </div>
          
          {/* Top 5 Largest Packages */}
          {topLargestPackages.length > 0 && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: 12,
              border: '2px solid #ff9800',
              boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>📊</span>
                <strong style={{ fontSize: 14, color: '#333' }}>Top 5 Largest Packages</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topLargestPackages.map((pkg, i) => {
                  const sizeInfo = getSizeInfo(pkg.size || 0)
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'white',
                      borderRadius: 8,
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#999', minWidth: 20 }}>#{i + 1}</span>
                        <span style={{ fontWeight: 600, color: '#333' }}>{pkg.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{sizeInfo.emoji}</span>
                        <span style={{ fontWeight: 700, color: '#ff9800' }}>{formatBytes(pkg.size || 0)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {viewMode === 'system' && scanResult.paths && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <strong style={{ fontSize: 14, color: '#333' }}>📂 Global Package Locations:</strong>
              <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
                {scanResult.paths.npm && <li style={{ fontSize: 13, color: '#666' }}><strong>npm:</strong> {scanResult.paths.npm}</li>}
                {scanResult.paths.pip && <li style={{ fontSize: 13, color: '#666' }}><strong>pip:</strong> {scanResult.paths.pip}</li>}
              </ul>
            </div>
          )}
        </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                {scanResult?.error && (
            <div className="fade-in" style={{ 
              color: '#d32f2f', 
              padding: 20, 
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', 
              borderRadius: 16,
              border: '2px solid #ef5350',
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>❌</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Error Occurred</div>
                  <div style={{ fontSize: 14 }}>{scanResult.error}</div>
                </div>
              </div>
            </div>
                )}
          
                {scanResult?.packages && (
            <div className="fade-in">
              {/* Sort and Filter Controls */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>Sort by:</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSortBy('name')}
                    style={{
                      padding: '8px 16px',
                      background: sortBy === 'name' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                      color: sortBy === 'name' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📝 Name
                  </button>
                  <button
                    onClick={() => setSortBy('size')}
                    style={{
                      padding: '8px 16px',
                      background: sortBy === 'size' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                      color: sortBy === 'size' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📊 Size
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <input
                  placeholder="🔍 Search packages..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '14px 20px', 
                    fontSize: 15, 
                    border: '2px solid #e0e0e0', 
                    borderRadius: 12,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button
                  onClick={toggleAll}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)'
                  }}
                >
                  {selectedPackages.size === scanResult.packages.length ? '❌ Deselect All' : '✅ Select All'}
                </button>
                <button
                  onClick={uninstallSelected}
                  disabled={selectedPackages.size === 0 || busy}
                  style={{
                    padding: '14px 24px',
                    background: selectedPackages.size > 0 
                      ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' 
                      : '#e0e0e0',
                    color: selectedPackages.size > 0 ? 'white' : '#999',
                    border: 'none',
                    borderRadius: 12,
                    cursor: selectedPackages.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: selectedPackages.size > 0 ? '0 4px 12px rgba(220, 53, 69, 0.3)' : 'none'
                  }}
                >
                  🗑️ Uninstall ({selectedPackages.size})
                </button>
              </div>

              {/* Card Grid Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 20,
                  maxHeight: 600,
                  overflow: 'auto',
                  padding: 4
                }}
              >
                {filteredPackages.map((pkg, i) => (
                  <div
                    key={i}
                    className="package-card"
                    style={{
                      border: selectedPackages.has(pkg.path) 
                        ? '3px solid #667eea' 
                        : '2px solid #e0e0e0',
                      borderRadius: 16,
                      padding: 20,
                      background: selectedPackages.has(pkg.path) 
                        ? 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' 
                        : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      boxShadow: selectedPackages.has(pkg.path)
                        ? '0 8px 24px rgba(102, 126, 234, 0.2)'
                        : '0 4px 12px rgba(0, 0, 0, 0.05)'
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
                        top: 16,
                        right: 16,
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        accentColor: '#667eea'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />

                        {/* Package Icon: show package-provided icon (data URL) first, then bundled assets */}
                        <div style={{ marginBottom: 16 }}>
                          {(() => {
                            const rawName = (pkg.name || '').toLowerCase();
                            // Normalize scoped package names like @babel/core -> babel-core
                            const nameKey = rawName.startsWith('@') ? rawName.slice(1).replace('/', '-') : rawName.replace('/', '-');
                            const assetMap = {
                              'babel': babelImg,
                              'babel-core': babelImg
                            };
                            const src = pkg.icon || assetMap[nameKey] || null;
                            if (src) {
                              return (
                                <img src={src} alt={pkg.name} style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} />
                              )
                            }
                            // fallback emoji
                            return (
                              <div style={{
                                width: 70,
                                height: 70,
                                background: pkg.manager === 'npm' ? 'linear-gradient(135deg, #cb3837 0%, #a02c2b 100%)' : pkg.manager === 'pip' ? 'linear-gradient(135deg, #3776ab 0%, #2a5a87 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 36,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }}>
                                {pkg.manager === 'npm' ? '📦' : pkg.manager === 'pip' ? '🐍' : '📚'}
                              </div>
                            )
                          })()}
                        </div>

                    {/* Package Name */}
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: 17, 
                      marginBottom: 12, 
                      wordBreak: 'break-word',
                      color: '#333',
                      lineHeight: 1.3
                    }}>
                      {pkg.name}
                    </div>

                    {/* Manager Badge */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: pkg.manager === 'npm' 
                            ? '#cb3837' 
                            : pkg.manager === 'pip' 
                            ? '#3776ab' 
                            : '#885630',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {pkg.manager.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>v{pkg.version}</span>
                      {pkg.used !== null && (
                        <span
                          style={{
                            background: pkg.used 
                              ? 'linear-gradient(135deg, #28a745 0%, #20883a 100%)' 
                              : 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.5px'
                          }}
                        >
                          {pkg.used ? '✓ USED' : '✗ UNUSED'}
                        </span>
                      )}
                    </div>

                    {/* Size with Category Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ 
                        fontSize: 22, 
                        fontWeight: 700, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {formatBytes(pkg.size)}
                      </div>
                      <span
                        style={{
                          background: getSizeInfo(pkg.size || 0).color,
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {getSizeInfo(pkg.size || 0).emoji} {getSizeInfo(pkg.size || 0).label}
                      </span>
                    </div>

                    {/* Path */}
                    <div
                      style={{
                        fontSize: 11,
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: 8,
                        marginTop: 8
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
                <div className="fade-in" style={{ 
                  marginTop: 30, 
                  padding: 24, 
                  background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)', 
                  borderRadius: 16, 
                  border: '3px solid #ffc107',
                  boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#856404',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 32 }}>🔁</span> Duplicate Packages Found
                  </h4>
                  {scanResult.duplicates.map((dup, i) => (
                    <div key={i} style={{ 
                      marginBottom: 16, 
                      paddingBottom: 16, 
                      borderBottom: i < scanResult.duplicates.length - 1 ? '2px solid #ffe69c' : 'none',
                      background: 'rgba(255, 255, 255, 0.6)',
                      padding: 16,
                      borderRadius: 12
                    }}>
                      <strong style={{ fontSize: 16, color: '#333' }}>{dup.package_name}</strong>
                      <span style={{ 
                        marginLeft: 12, 
                        color: '#856404',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        Found in {dup.locations.length} locations
                      </span>
                      <div style={{ 
                        color: '#f57c00', 
                        marginTop: 8,
                        fontSize: 15,
                        fontWeight: 700
                      }}>
                        💾 Wasted space: {formatBytes(dup.total_wasted)}
                      </div>
                      <ul style={{ 
                        fontSize: 13, 
                        color: '#666', 
                        marginTop: 12,
                        lineHeight: 1.8
                      }}>
                        {dup.locations.slice(0, 3).map((loc, j) => (
                          <li key={j} style={{ marginBottom: 4 }}>{loc}</li>
                        ))}
                        {dup.locations.length > 3 && (
                          <li style={{ fontWeight: 600, color: '#856404' }}>
                            ...and {dup.locations.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
                )}

                {!scanResult && (
            <div className="fade-in" style={{ 
              padding: 60, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <div className="text-7xl mb-6 drop-shadow-lg">
                👋
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome to Peeak!
              </h2>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                {viewMode === 'project'
                  ? '📁 Import a project to scan node_modules and detect unused packages.'
                  : '🌐 Scan global npm/pip packages and view locations.'}
              </p>
            </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}

export default AppWithErrorBoundary
