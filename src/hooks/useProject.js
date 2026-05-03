import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { isTauri, mockInvoke, setupMockEventListeners } from '../lib/browserMock'
import { getTechIcon } from '../assets/iconLinks'

export const useProject = (currentProject, showToast) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [installingPackages, setInstallingPackages] = useState(new Map())

  const [scanResult, setScanResult] = useState({ packages: [], total_size: 0, total_count: 0, duplicates: [] })
  const [auditResult, setAuditResult] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [projectTechnologies, setProjectTechnologies] = useState([])
  const [projectScripts, setProjectScripts] = useState({})
  const [outdatedCount, setOutdatedCount] = useState(0)
  const [venvPath, setVenvPath] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [availableUpdates, setAvailableUpdates] = useState(new Map())
  const [packageVersionHistory, setPackageVersionHistory] = useState(new Map())
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [packageView, setPackageView] = useState('grid')

  const scanResultRef = useRef(null)
  const lastScannedPathRef = useRef(null)

  // Load version history on mount or project change
  useEffect(() => {
    if (currentProject) {
      const historyKey = `versionHistory_${currentProject.path}`
      const saved = localStorage.getItem(historyKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPackageVersionHistory(new Map(Object.entries(parsed)))
        } catch (e) {
          console.error('Failed to load version history', e)
        }
      }
    }
  }, [currentProject])

  const saveVersionHistory = (historyMap) => {
    if (currentProject) {
      const historyKey = `versionHistory_${currentProject.path}`
      const historyObj = Object.fromEntries(historyMap)
      localStorage.setItem(historyKey, JSON.stringify(historyObj))
    }
  }

  // Use the sync version for initial setup, then dynamic imports
  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

  const scan = useCallback(async (proj, options = {}) => {
    if (!proj) return
    const { silent = false } = options
    const invoke = await getInvoke()
    setBusy(true)
    if (!silent) setIsScanning(true)

    try {
      // Use streaming scan
      await invoke('scan_project_stream', { folder: proj.path })

      // Detect technologies
      const techs = await invoke('detect_project_technologies', { projectPath: proj.path })
      const techsArray = Array.isArray(techs) ? techs : []
      const mappedTechs = techsArray.map(t => typeof t === 'string' ? getTechIcon(t) : t).filter(Boolean)
      setProjectTechnologies(mappedTechs)

      // Fetch scripts
      try {
        console.log(`[useProject] Fetching scripts for: ${proj.path}`)
        const scripts = await invoke('read_package_scripts', { projectPath: proj.path })
        console.log(`[useProject] Received scripts:`, scripts)
        setProjectScripts(scripts || {})
      } catch (err) {
        console.error('[useProject] Failed to fetch scripts:', err)
        setProjectScripts({})
      }

      // Outdated check
      const outdated = await invoke('run_npm_outdated', { projectPath: proj.path })
      if (outdated && typeof outdated === 'object') {
        const updates = new Map()
        for (const [name, info] of Object.entries(outdated)) {
          if (info.latest && info.current && info.latest !== info.current) {
            updates.set(name, info.latest)
          }
        }
        setAvailableUpdates(updates)
        setOutdatedCount(updates.size)
      }

      // Check for python venv
      try {
        const v = await invoke('get_venv', { projectPath: proj.path })
        setVenvPath(v || null)
      } catch (e) {
        setVenvPath(null)
      }

      // Run Audit
      setIsLoadingAudit(true)
      try {
        const audit = await invoke('run_npm_audit', { projectPath: proj.path })
        setAuditResult(audit)
      } catch (e) {
        console.error('[useProject] Audit failed:', e)
        setAuditResult(null)
      } finally {
        setIsLoadingAudit(false)
      }
    } catch (e) {
      showToast(`Scan failed: ${e}`, 'error')
    } finally {
      setBusy(false)
      setIsScanning(false)
    }
  }, [getInvoke, showToast])

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const manager = scanResult?.packages?.[0]?.manager || 'npm'
      const results = await invoke('search_packages', {
        packageManager: manager,
        query: searchQuery
      })
      setSearchResults(results || [])
      if (!results || results.length === 0) {
        showToast('No packages found matching your query.', 'info')
      }
    } catch (e) {
      showToast(`Search failed: ${e}`, 'error')
    } finally {
      setBusy(false)
    }
  }, [searchQuery, currentProject, scanResult, getInvoke, showToast])

  const handleInstall = useCallback(async (packageName, version = 'latest') => {
    if (!currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const manager = scanResult?.packages?.[0]?.manager || 'npm'
      await invoke('install_package', {
        packageManager: manager,
        packageName: version === 'latest' ? packageName : `${packageName}@${version}`,
        projectPath: currentProject.path,
        isGlobal: false
      })
      showToast(`Started installing ${packageName}`, 'success')
      // Rescan after a delay
      setTimeout(() => scan(currentProject), 2000)
    } catch (e) {
      showToast(`Install failed: ${e}`, 'error')
    } finally {
      setBusy(false)
      setSearchResults([])
      setSearchQuery('')
    }
  }, [currentProject, scanResult, getInvoke, scan, showToast])

  const handleUpdate = useCallback(async (packageName) => {
    if (!currentProject) return
    const invoke = await getInvoke()
    
    // Store history
    const currentPkg = scanResult?.packages?.find(p => p.name === packageName)
    if (currentPkg?.version) {
      setPackageVersionHistory(prev => {
        const next = new Map(prev)
        const history = next.get(packageName) || []
        if (!history.includes(currentPkg.version)) {
          const updated = [...history, currentPkg.version]
          next.set(packageName, updated)
          saveVersionHistory(next)
        }
        return next
      })
    }

    setBusy(true)
    setInstallingPackages(prev => new Map(prev).set(packageName, 0))
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setInstallingPackages(prev => {
          const curr = prev.get(packageName) || 0
          if (curr >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return new Map(prev).set(packageName, curr + 10)
        })
      }, 200)

      const manager = currentPkg?.manager || 'npm'
      await invoke('update_package', {
        packageManager: manager,
        packageName: packageName,
        projectPath: currentProject.path,
        isGlobal: false
      })
      
      clearInterval(progressInterval)
      setInstallingPackages(prev => new Map(prev).set(packageName, 100))
      
      showToast(`Successfully updated ${packageName}`, 'success')
      setTimeout(() => {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(packageName)
          return next
        })
        scan(currentProject, { silent: true })
      }, 1000)
    } catch (e) {
      showToast(`Update failed: ${e}`, 'error')
      setInstallingPackages(prev => {
        const next = new Map(prev)
        next.delete(packageName)
        return next
      })
    } finally {
      setBusy(false)
    }
  }, [currentProject, scanResult, getInvoke, scan, showToast])

  const handleRevert = useCallback(async (packageName, version) => {
    if (!currentProject) return
    const invoke = await getInvoke()
    
    const history = packageVersionHistory.get(packageName) || []
    const targetVersion = version || (history.length > 0 ? history[history.length - 1] : null)
    
    if (!targetVersion) {
      showToast('No version history found to revert', 'error')
      return
    }

    setBusy(true)
    setInstallingPackages(prev => new Map(prev).set(packageName, 0))
    
    try {
      const manager = scanResult?.packages?.find(p => p.name === packageName)?.manager || 'npm'
      await invoke('update_package', {
        packageManager: manager,
        packageName: `${packageName}@${targetVersion}`,
        projectPath: currentProject.path,
        isGlobal: false
      })
      
      setInstallingPackages(prev => new Map(prev).set(packageName, 100))
      showToast(`Reverted ${packageName} to v${targetVersion}`, 'success')
      
      // Update history: remove version we just reverted to and any versions after it
      setPackageVersionHistory(prev => {
        const next = new Map(prev)
        const currHistory = next.get(packageName) || []
        const idx = currHistory.indexOf(targetVersion)
        if (idx !== -1) {
          const updated = currHistory.slice(0, idx)
          if (updated.length === 0) next.delete(packageName)
          else next.set(packageName, updated)
          saveVersionHistory(next)
        }
        return next
      })

      setTimeout(() => {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(packageName)
          return next
        })
        scan(currentProject, { silent: true })
      }, 1000)
    } catch (e) {
      showToast(`Revert failed: ${e}`, 'error')
      setInstallingPackages(prev => {
        const next = new Map(prev)
        next.delete(packageName)
        return next
      })
    } finally {
      setBusy(false)
    }
  }, [currentProject, packageVersionHistory, scanResult, getInvoke, scan, showToast])

  const handleDelete = useCallback(async (packageName) => {
    if (!currentProject) return
    if (!confirm(`Are you sure you want to uninstall ${packageName}?`)) return

    const invoke = await getInvoke()
    setBusy(true)
    try {
      const manager = scanResult?.packages?.find(p => p.name === packageName)?.manager || 'npm'
      await invoke('uninstall_package', {
        packageManager: manager,
        packageName: packageName,
        projectPath: currentProject.path,
        isGlobal: false
      })
      showToast(`${packageName} uninstalled`, 'success')
      setTimeout(() => scan(currentProject), 1000)
    } catch (e) {
      showToast(`Uninstall failed: ${e}`, 'error')
    } finally {
      setBusy(false)
    }
  }, [currentProject, scanResult, getInvoke, scan, showToast])

  const openFolder = useCallback(async (path) => {
    if (!path) return
    const invoke = await getInvoke()
    try {
      await invoke('open_folder', { path })
    } catch (e) {
      showToast(`Could not open folder: ${e}`, 'error')
    }
  }, [getInvoke, showToast])

  // Listen for scan events
  useEffect(() => {
    const handleScanComplete = (event) => {
      const payload = event.payload || {}
      const result = payload.result || payload
      setScanResult(result)
      scanResultRef.current = result
      setBusy(false)
      setIsScanning(false)
    }

    const unlistens = []

    if (isTauri()) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('scan-progress', (event) => {
          const pkg = event.payload?.package
          if (!pkg) return
          
          setScanResult(prev => {
            const packages = prev?.packages || []
            const idx = packages.findIndex(p => p && p.path === pkg.path)
            let newPackages
            if (idx >= 0) {
              newPackages = [...packages]
              newPackages[idx] = pkg
            } else {
              newPackages = [...packages, pkg]
            }
            return {
              ...prev,
              packages: newPackages,
              total_size: newPackages.reduce((s, p) => s + (p?.size || 0), 0),
              total_count: newPackages.length
            }
          })
        }).then(u => unlistens.push(u))

        listen('scan-complete', handleScanComplete).then(u => unlistens.push(u))
      })
    } else {
      const u = setupMockEventListeners({ onScanComplete: handleScanComplete })
      unlistens.push(u)
    }

    return () => {
      unlistens.forEach(u => u())
    }
  }, [])

  const runScript = useCallback(async (scriptName) => {
    if (!currentProject) return
    const invoke = await getInvoke()
    try {
      showToast(`Running script: ${scriptName}`, 'info')
      await invoke('run_script', { 
        projectPath: currentProject.path, 
        scriptName 
      })
      showToast(`Script ${scriptName} completed`, 'success')
    } catch (e) {
      showToast(`Script failed: ${e}`, 'error')
    }
  }, [currentProject, getInvoke, showToast])

  // Auto-scan when project changes
  useEffect(() => {
    if (currentProject && lastScannedPathRef.current !== currentProject.path) {
      scan(currentProject)
      lastScannedPathRef.current = currentProject.path
    }
  }, [currentProject, scan])

  const handleUpdateSelected = useCallback(async (packages) => {
    if (!currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    let successCount = 0
    for (const pkg of packages) {
      try {
        await invoke('update_package', {
          packageManager: pkg.manager,
          packageName: pkg.name,
          projectPath: currentProject.path,
          isGlobal: false
        })
        successCount++
      } catch (e) {
        console.error('Update failed for', pkg.name, e)
      }
    }
    showToast(`Updated ${successCount}/${packages.length} packages`, successCount === packages.length ? 'success' : 'info')
    setBusy(false)
    scan(currentProject)
  }, [currentProject, getInvoke, scan, showToast])

  const handleUpdateAll = useCallback(async () => {
    const toUpdate = scanResult?.packages?.filter(p => p.manager === 'npm' && p.is_outdated) || []
    if (toUpdate.length === 0) return
    await handleUpdateSelected(toUpdate)
  }, [scanResult, handleUpdateSelected])

  const togglePackage = useCallback((path) => {
    setSelectedPackages(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const installingPackagesHasPath = useCallback((path) => {
    const pkg = scanResult?.packages?.find(p => p.path === path)
    return pkg ? installingPackages.has(pkg.name) : false
  }, [scanResult, installingPackages])

  const topPackages = useMemo(() => 
    (scanResult?.packages || [])
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5),
    [scanResult?.packages]
  )

  const filteredPackages = useMemo(() => 
    (scanResult?.packages || [])
      .filter(p => p && (p.name || '').toLowerCase().includes((filter || '').toLowerCase()))
      .sort((a, b) => {
        if (!a || !b) return 0
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
        if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
        return 0
      }),
    [scanResult?.packages, filter, sortBy]
  )

  return {
    scanResult,
    auditResult,
    isLoadingAudit,
    projectTechnologies,
    projectScripts,
    outdatedCount,
    venvPath,
    isScanning,
    busy,
    availableUpdates,
    packageVersionHistory,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    selectedPackages,
    setSelectedPackages,
    installingPackages,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    packageView,
    setPackageView,
    topPackages,
    filteredPackages,
    scan,
    handleSearch,
    handleInstall,
    handleUpdate,
    handleRevert,
    handleDelete,
    openFolder,
    handleUpdateSelected,
    handleUpdateAll,
    togglePackage,
    installingPackagesHasPath,
    runScript
  }
}
