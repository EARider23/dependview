import { useState, useEffect, useRef, useCallback } from 'react'
import { isTauri, mockInvoke, setupMockEventListeners } from '../lib/browserMock'
import { getTechIcon } from '../assets/iconLinks'

export const useProject = (currentProject, showToast) => {
  const [scanResult, setScanResult] = useState({ packages: [], total_size: 0, total_count: 0, duplicates: [] })
  const [auditResult, setAuditResult] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [projectTechnologies, setProjectTechnologies] = useState([])
  const [projectScripts, setProjectScripts] = useState({})
  const [outdatedCount, setOutdatedCount] = useState(0)
  const [venvPath, setVenvPath] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [packageView, setPackageView] = useState('grid')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [installingPackages, setInstallingPackages] = useState(new Map())

  const scanResultRef = useRef(null)
  const lastScannedPathRef = useRef(null)

  // Use the sync version for initial setup, then dynamic imports
  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

  const scan = useCallback(async (proj) => {
    if (!proj) return
    const invoke = await getInvoke()
    setBusy(true)
    setIsScanning(true)

    try {
      // Use streaming scan
      await invoke('scan_project_stream', { folder: proj.path })

      // Detect technologies
      const techs = await invoke('detect_project_technologies', { projectPath: proj.path })
      // Ensure techs is an array before mapping
      const techsArray = Array.isArray(techs) ? techs : []
      const mappedTechs = techsArray.map(t => typeof t === 'string' ? getTechIcon(t) : t).filter(Boolean)
      setProjectTechnologies(mappedTechs)

      // Check for python venv
      try {
        const v = await invoke('get_venv', { projectPath: proj.path })
        setVenvPath(v || null)
      } catch (e) {
        setVenvPath(null)
      }
    } catch (e) {
      showToast(`Scan failed: ${e}`, 'error')
    } finally {
      setBusy(false)
      // Safety fallback — scan-complete event should handle this, but ensure overlay always clears
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
    setBusy(true)
    try {
      const manager = scanResult?.packages?.find(p => p.name === packageName)?.manager || 'npm'
      await invoke('update_package', {
        packageManager: manager,
        packageName: packageName,
        projectPath: currentProject.path,
        isGlobal: false
      })
      showToast(`Updating ${packageName}...`, 'info')
      setTimeout(() => scan(currentProject), 2000)
    } catch (e) {
      showToast(`Update failed: ${e}`, 'error')
    } finally {
      setBusy(false)
    }
  }, [currentProject, scanResult, getInvoke, scan, showToast])

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

  // Auto-scan when project changes
  useEffect(() => {
    if (currentProject && lastScannedPathRef.current !== currentProject.path) {
      scan(currentProject)
      lastScannedPathRef.current = currentProject.path

      // Fetch extra details
      getInvoke().then(invoke => {
        invoke('read_package_scripts', { projectPath: currentProject.path })
          .then(scripts => {
            console.log('Fetched scripts for:', currentProject.name, scripts);
            setProjectScripts(scripts || {});
          })
          .catch((err) => { 
            console.error('Failed to read scripts:', err);
            setProjectScripts({});
          })

        setIsLoadingAudit(true)
        invoke('run_npm_audit', { projectPath: currentProject.path })
          .then(res => {
            setAuditResult(res)
            setIsLoadingAudit(false)
          })
          .catch(() => setIsLoadingAudit(false))

        invoke('run_npm_outdated', { projectPath: currentProject.path })
          .then(res => {
            setOutdatedCount(Object.keys(res || {}).length)
          })
          .catch(() => { })
      })
    }
  }, [currentProject, scan, getInvoke])

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

  const topPackages = (scanResult?.packages || [])
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5)

  const filteredPackages = (scanResult?.packages || [])
    .filter(p => p && (p.name || '').toLowerCase().includes((filter || '').toLowerCase()))
    .sort((a, b) => {
      if (!a || !b) return 0
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
      return 0
    })

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
    handleDelete,
    openFolder,
    handleUpdateSelected,
    handleUpdateAll,
    togglePackage,
    installingPackagesHasPath
  }
}
