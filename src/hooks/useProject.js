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

  const getListen = useCallback(async () => {
    if (isTauri()) {
      const { listen } = await import('@tauri-apps/api/event')
      return listen
    }
    return (event, cb) => {
      // Simple mock for browser testing if needed
      return () => {}
    }
  }, [])

  const [isSilentScanning, setIsSilentScanning] = useState(false)

  const scan = useCallback(async (proj, options = {}) => {
    if (!proj) return
    const { silent = false } = options
    const invoke = await getInvoke()
    setBusy(true)
    if (!silent) {
      setIsScanning(true)
      setIsSilentScanning(false)
    } else {
      setIsSilentScanning(true)
    }

    try {
      // 1. FAST SCAN: Basic structure & Technologies (Essential for UI)
      await invoke('scan_project_stream', { folder: proj.path })
      
      const techs = await invoke('detect_project_technologies', { projectPath: proj.path })
      const techsArray = Array.isArray(techs) ? techs : []
      setProjectTechnologies(techsArray.map(t => typeof t === 'string' ? getTechIcon(t) : t).filter(Boolean))

      // Overlay will now stay until deep scan is finished for non-silent scans
      // (Early exit removed for dramatic sequencing)

      // 2. BACKGROUND DEEP SCAN: Slow operations (Outdated, Audit, Scripts, Venv)
      // These run in parallel and don't block each other or the UI
      setIsLoadingAudit(true)
      
      Promise.allSettled([
        // Scripts
        invoke('read_package_scripts', { projectPath: proj.path }).then(s => setProjectScripts(s || {})),
        
        // Outdated
        invoke('run_npm_outdated', { projectPath: proj.path }).then(outdated => {
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
        }),

        // Venv
        invoke('get_venv', { projectPath: proj.path }).then(v => setVenvPath(v || null)),

        // Audit
        invoke('run_npm_audit', { projectPath: proj.path }).then(audit => {
          setAuditResult(audit)
          setIsLoadingAudit(false)
        }).catch(() => setIsLoadingAudit(false))

      ]).finally(() => {
        setBusy(false)
        setIsScanning(false)
        setIsSilentScanning(false)
      })

    } catch (e) {
      console.error('[useProject] Scan failed:', e)
      showToast(`Scan failed: ${e}`, 'error')
      setBusy(false)
      setIsScanning(false)
      setIsSilentScanning(false)
    }
  }, [getInvoke, showToast])

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const manager = scanResult?.packages?.[0]?.manager || 'npm'
      console.log(`[useProject] Searching for "${searchQuery}" with manager: ${manager}`)
      
      const results = await invoke('search_packages', {
        packageManager: manager,
        query: searchQuery
      })
      
      console.log(`[useProject] Search results:`, results)
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
    
    // ATOMIC NAME LOCK: Force the name to be treated as a single identifier
    let rawName = packageName.trim()
    
    // 1. Remove any accidental spaces
    rawName = rawName.replace(/\s+/g, '')

    // 2. GUARD: Reject names that look like GitHub shorthands (user/repo) 
    //    which npm would split into multiple packages. Only @scope/name is valid.
    if (rawName.includes('/') && !rawName.startsWith('@')) {
      showToast(`Invalid package name: "${rawName}". Use @scope/name format for scoped packages.`, 'error')
      setBusy(false)
      return
    }

    // 3. Handle versioning if included in the packageName string (e.g. lodash@4.17.21)
    let finalVersion = version
    let baseName = rawName
    
    // For scoped packages like @scope/pkg@1.2.3, find the LAST @ that's after the /
    if (rawName.startsWith('@') && rawName.includes('/')) {
      const slashIndex = rawName.indexOf('/')
      const afterSlash = rawName.substring(slashIndex)
      if (afterSlash.includes('@')) {
        const versionAtIndex = slashIndex + afterSlash.indexOf('@')
        baseName = rawName.substring(0, versionAtIndex)
        finalVersion = rawName.substring(versionAtIndex + 1) || version
      }
    } else if (rawName.includes('@') && !rawName.startsWith('@')) {
      // Simple package with version: lodash@4.17.21
      const atIndex = rawName.indexOf('@')
      baseName = rawName.substring(0, atIndex)
      finalVersion = rawName.substring(atIndex + 1) || version
    }

    console.log(`[useProject] INSTALL REQUEST: raw="${packageName}" → baseName="${baseName}" version="${finalVersion}"`)

    // Set installing state using the base name for UI matching
    setInstallingPackages(prev => new Map(prev).set(baseName, { progress: 5, type: 'install', lastLog: 'Initializing...' }))
    
    try {
      // Determine manager from project metadata if possible
      const manager = await invoke('detect_package_manager', { projectPath: currentProject.path })
      console.log(`[useProject] Installation will use manager: ${manager}`)

      // ATOMIC NAME LOCK: Use the baseName exactly as provided (no auto-scoping)
      // If user wants a scoped package, they should include the @ in search or input.
      let finalInstallName = baseName
      if (finalVersion !== 'latest' && !baseName.includes('@', 1)) {
        finalInstallName = `${baseName}@${finalVersion}`
      }

      console.log(`[useProject] EXEC INSTALL: "${finalInstallName}" (Manager: ${manager})`)

      // Execute installation and listener in parallel
      const listen = await getListen()
      let unlisten;

      const setupListener = async () => {
        unlisten = await listen('install-log', (event) => {
          const { package: pkgName, line, stream, code } = event.payload;
          if (pkgName !== baseName && pkgName !== finalInstallName) return;

          if (line) {
            const l = line.trim()
            if (l) {
              setInstallingPackages(prev => {
                const state = prev.get(baseName)
                if (state) {
                  let newProgress = state.progress;
                  
                  // MB parsing for pip
                  const mbMatch = line.match(/(\d+\.?\d*)\/(\d+\.?\d*)\s*MB/);
                  if (mbMatch) {
                    const currentMB = parseFloat(mbMatch[1]);
                    const totalMB = parseFloat(mbMatch[2]);
                    newProgress = Math.round((currentMB / totalMB) * 100);
                  } else {
                    // Fallback incremental progress
                    newProgress = Math.min(98, newProgress + 1);
                  }

                  return new Map(prev).set(baseName, { 
                    ...state, 
                    progress: newProgress,
                    lastLog: l.substring(0, 60),
                    throughput: line.match(/\d+\.?\d*\s*MB\/s/)?.[0] || state.throughput
                  })
                }
                return prev
              })
            }
          }
        });
      };

      await setupListener();
      
      try {
        await invoke('install_package', {
          packageManager: manager,
          packageName: finalInstallName,
          projectPath: currentProject.path,
          isGlobal: false
        })
      } finally {
        if (unlisten) unlisten();
      }

      setInstallingPackages(prev => new Map(prev).set(baseName, { progress: 100, type: 'install', lastLog: 'Complete' }))
      
      showToast(`${finalInstallName} installed successfully`, 'success')

      setTimeout(() => {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(baseName)
          return next
        })
        scan(currentProject, { silent: true })
        setSearchResults([])
        setSearchQuery('')
      }, 800)
    } catch (e) {
      showToast(`Install failed: ${e}`, 'error')
      setInstallingPackages(prev => {
        const next = new Map(prev)
        next.delete(baseName)
        return next
      })
    } finally {
      setBusy(false)
    }
  }, [currentProject, getInvoke, getListen, scan, showToast])
  
  const syncProject = useCallback(async () => {
    if (!currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    setInstallingPackages(prev => new Map(prev).set('PROJECT_SYNC', { progress: 5, type: 'sync', lastLog: 'Initializing sync...' }))
    
    try {
      const listen = await getListen()
      let unlisten;

      const setupListener = async () => {
        unlisten = await listen('install-log', (event) => {
          const { line } = event.payload;
          if (line) {
            setInstallingPackages(prev => {
              const state = prev.get('PROJECT_SYNC')
              if (state) {
                return new Map(prev).set('PROJECT_SYNC', { 
                  ...state, 
                  progress: Math.min(98, state.progress + 1),
                  lastLog: line.trim().substring(0, 60)
                })
              }
              return prev
            })
          }
        });
      };

      await setupListener();
      
      try {
        await invoke('sync_project', {
          projectPath: currentProject.path
        })
      } finally {
        if (unlisten) unlisten();
      }

      setInstallingPackages(prev => new Map(prev).set('PROJECT_SYNC', { progress: 100, type: 'sync', lastLog: 'Sync complete' }))
      showToast(`Project synced successfully`, 'success')

      setTimeout(() => {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete('PROJECT_SYNC')
          return next
        })
        scan(currentProject, { silent: true })
      }, 800)
    } catch (e) {
      showToast(`Sync failed: ${e}`, 'error')
      setInstallingPackages(prev => {
        const next = new Map(prev)
        next.delete('PROJECT_SYNC')
        return next
      })
    } finally {
      setBusy(false)
    }
  }, [currentProject, getInvoke, getListen, scan, showToast])


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
    setInstallingPackages(prev => new Map(prev).set(packageName, { progress: 0, type: 'update' }))
    
    try {
      const listen = await getListen()
      let unlisten;

      const setupListener = async () => {
        unlisten = await listen('install-log', (event) => {
          const { package: pkgName, line, stream } = event.payload;
          if (pkgName !== packageName) return;

          if (line) {
            const l = line.trim()
            if (l) {
              setInstallingPackages(prev => {
                const state = prev.get(packageName)
                if (state) {
                  let newProgress = state.progress;
                  const mbMatch = line.match(/(\d+\.?\d*)\/(\d+\.?\d*)\s*MB/);
                  if (mbMatch) {
                    const currentMB = parseFloat(mbMatch[1]);
                    const totalMB = parseFloat(mbMatch[2]);
                    newProgress = Math.round((currentMB / totalMB) * 100);
                  } else {
                    newProgress = Math.min(98, newProgress + 1);
                  }
                  return new Map(prev).set(packageName, { 
                    ...state, 
                    progress: newProgress,
                    lastLog: l.substring(0, 60),
                    throughput: line.match(/\d+\.?\d*\s*MB\/s/)?.[0] || state.throughput
                  })
                }
                return prev
              })
            }
          }
        });
      };

      await setupListener();

      const manager = currentPkg?.manager || 'npm'
      try {
        await invoke('update_package', {
          packageManager: manager,
          packageName: packageName,
          projectPath: currentProject.path,
          isGlobal: false
        })
      } finally {
        if (unlisten) unlisten();
      }
      
      setInstallingPackages(prev => new Map(prev).set(packageName, { progress: 100, type: 'update', lastLog: 'Complete' }))
      
      // Optimistic UI Update: Update version and clear outdated status immediately
      setScanResult(prev => {
        const nextPackages = prev.packages.map(p => {
          if (p.name === packageName) {
            const latest = availableUpdates.get(packageName)
            return { ...p, version: latest || p.version, is_outdated: false }
          }
          return p
        })
        return { ...prev, packages: nextPackages }
      })

      setAvailableUpdates(prev => {
        const next = new Map(prev)
        next.delete(packageName)
        return next
      })
      setOutdatedCount(prev => Math.max(0, prev - 1))

      showToast(`Successfully updated ${packageName}`, 'success')
      setTimeout(() => {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(packageName)
          return next
        })
        scan(currentProject, { silent: true })
      }, 200)
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
  }, [currentProject, scanResult, getInvoke, scan, showToast, availableUpdates])

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
    setInstallingPackages(prev => new Map(prev).set(packageName, { progress: 0, type: 'revert' }))
    
    try {
      const listen = await getListen()
      let unlisten;

      const setupListener = async () => {
        unlisten = await listen('install-log', (event) => {
          const { package: pkgName, line } = event.payload;
          // Revert might use packageName@version in some events, but base name is safer for UI
          if (!pkgName?.startsWith(packageName)) return;

          if (line) {
            const l = line.trim()
            if (l) {
              setInstallingPackages(prev => {
                const state = prev.get(packageName)
                if (state) {
                  let newProgress = state.progress;
                  newProgress = Math.min(98, newProgress + 2);
                  return new Map(prev).set(packageName, { ...state, progress: newProgress, lastLog: l.substring(0, 60) })
                }
                return prev
              })
            }
          }
        });
      };

      await setupListener();

      const manager = scanResult?.packages?.find(p => p.name === packageName)?.manager || 'npm'
      try {
        await invoke('update_package', {
          packageManager: manager,
          packageName: `${packageName}@${targetVersion}`,
          projectPath: currentProject.path,
          isGlobal: false
        })
      } finally {
        if (unlisten) unlisten();
      }
      
      setInstallingPackages(prev => new Map(prev).set(packageName, { progress: 100, type: 'revert', lastLog: 'Complete' }))
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

  const handleDelete = useCallback(async (pkg) => {
    if (!currentProject || !pkg) return

    const invoke = await getInvoke()
    setBusy(true)
    try {
      const packageName = pkg.name
      if (!pkg.path) throw new Error('Package path not found')

      // Optimistic UI: Remove from state immediately
      setScanResult(prev => ({
        ...prev,
        packages: prev.packages.filter(p => p.name !== packageName),
        total_count: Math.max(0, (prev.total_count || 0) - 1),
        total_size: Math.max(0, (prev.total_size || 0) - (pkg.size || 0))
      }))

      if (pkg.is_declared) {
        await invoke('remove_package', {
          packageManager: pkg.manager || 'npm',
          packageName: pkg.name,
          projectPath: currentProject.path,
          isGlobal: false
        })
      } else {
        await invoke('delete_package', {
          path: pkg.path
        })
      }
      showToast(`${packageName} uninstalled`, 'success')
      setTimeout(() => scan(currentProject, { silent: true }), 1000)
    } catch (e) {
      showToast(`Uninstall failed: ${e}`, 'error')
    } finally {
      setBusy(false)
    }
  }, [currentProject, getInvoke, scan, showToast])

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
        let pendingPackages = []
        let updateTimer = null

        listen('scan-progress', (event) => {
          const pkg = event.payload?.package
          if (!pkg) return
          
          pendingPackages.push(pkg)

          if (!updateTimer) {
            updateTimer = setTimeout(() => {
              setScanResult(prev => {
                const packages = prev?.packages || []
                const nextPackages = [...packages]
                
                pendingPackages.forEach(p => {
                  const idx = nextPackages.findIndex(old => old.path === p.path)
                  if (idx >= 0) nextPackages[idx] = p
                  else nextPackages.push(p)
                })
                
                pendingPackages = []
                updateTimer = null

                return {
                  ...prev,
                  packages: nextPackages,
                  total_size: nextPackages.reduce((s, p) => s + (p?.size || 0), 0),
                  total_count: nextPackages.length
                }
              })
            }, 150) // Batch updates every 150ms
          }
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
      await invoke('run_package_script', { 
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

  const handleUpdateSelected = useCallback(async (packages, options = {}) => {
    if (!currentProject || !packages || packages.length === 0) return
    const { silent = false } = options
    const invoke = await getInvoke()
    setBusy(true)
    let successCount = 0
    
    for (const pkg of packages) {
      try {
        // Store history before update
        if (pkg.version) {
          setPackageVersionHistory(prev => {
            const next = new Map(prev)
            const history = next.get(pkg.name) || []
            if (!history.includes(pkg.version)) {
              const updated = [...history, pkg.version]
              next.set(pkg.name, updated)
              saveVersionHistory(next)
            }
            return next
          })
        }

        // Set progress state
        setInstallingPackages(prev => new Map(prev).set(pkg.name, { progress: 30, type: 'update' }))

        await invoke('update_package', {
          packageManager: pkg.manager,
          packageName: pkg.name,
          projectPath: currentProject.path,
          isGlobal: false
        })
        
        successCount++
        setInstallingPackages(prev => new Map(prev).set(pkg.name, { progress: 100, type: 'update' }))
        
        // Optimistic update for each package
        setScanResult(prev => {
          const nextPackages = prev.packages.map(p => {
            if (p.name === pkg.name) {
              const latest = availableUpdates.get(pkg.name)
              return { ...p, version: latest || p.version, is_outdated: false }
            }
            return p
          })
          return { ...prev, packages: nextPackages }
        })
      } catch (e) {
        console.error('Update failed for', pkg.name, e)
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(pkg.name)
          return next
        })
      }
    }

    if (!silent) {
      showToast(`Updated ${successCount}/${packages.length} packages`, successCount === packages.length ? 'success' : 'info')
    }
    
    // Cleanup progress bars
    setTimeout(() => {
      setInstallingPackages(prev => {
        const next = new Map(prev)
        packages.forEach(p => next.delete(p.name))
        return next
      })
      setSelectedPackages(new Set())
      setBusy(false)
      scan(currentProject, { silent: true })
    }, 500)
  }, [currentProject, getInvoke, scan, showToast, availableUpdates])

  const handleUpdateAll = useCallback(async (options = {}) => {
    const { silent = false } = options
    const toUpdate = scanResult?.packages?.filter(p => p.manager === 'npm' && p.is_outdated) || []
    if (toUpdate.length === 0) {
      // Fallback: check availableUpdates map
      const availableNames = Array.from(availableUpdates.keys())
      const packagesToUpdate = scanResult?.packages?.filter(p => availableNames.includes(p.name)) || []
      if (packagesToUpdate.length > 0) {
        await handleUpdateSelected(packagesToUpdate, options)
      } else {
        if (!silent) showToast('No updates available', 'info')
      }
      return
    }
    await handleUpdateSelected(toUpdate, options)
  }, [scanResult, availableUpdates, handleUpdateSelected, showToast])

  const handleAuditFix = useCallback(async () => {
    if (!currentProject) return
    const invoke = await getInvoke()
    setBusy(true)
    try {
      console.log('[useProject] Running automatic security fix...')
      await invoke('fix_npm_audit', { projectPath: currentProject.path })
      showToast('Security fixes applied successfully', 'success')
      scan(currentProject, { silent: true })
    } catch (e) {
      console.error('[useProject] Security fix failed:', e)
    } finally {
      setBusy(false)
    }
  }, [currentProject, getInvoke, scan, showToast])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedPackages.size === 0 || !currentProject) return

    const invoke = await getInvoke()
    setBusy(true)
    let successCount = 0
    const packagesToDelete = Array.from(selectedPackages).map(path => 
      scanResult?.packages?.find(p => p.path === path)
    ).filter(Boolean)

    // Optimistic UI: Remove all selected packages from state immediately
    const deletedSize = packagesToDelete.reduce((sum, p) => sum + (p.size || 0), 0)
    setScanResult(prev => ({
      ...prev,
      packages: prev.packages.filter(p => !selectedPackages.has(p.path)),
      total_count: Math.max(0, (prev.total_count || 0) - packagesToDelete.length),
      total_size: Math.max(0, (prev.total_size || 0) - deletedSize)
    }))

    for (const pkg of packagesToDelete) {
      try {
        setInstallingPackages(prev => new Map(prev).set(pkg.name, { progress: 50, type: 'delete' }))
        
        if (pkg.is_declared) {
          await invoke('remove_package', {
            packageManager: pkg.manager || 'npm',
            packageName: pkg.name,
            projectPath: currentProject.path,
            isGlobal: false
          })
        } else {
          await invoke('delete_package', {
            path: pkg.path
          })
        }
        
        successCount++
      } catch (e) {
        console.error(`Delete failed for ${pkg.name}:`, e)
        showToast(`Failed to delete ${pkg.name}: ${e}`, 'error')
      } finally {
        setInstallingPackages(prev => {
          const next = new Map(prev)
          next.delete(pkg.name)
          return next
        })
      }
    }
    if (successCount > 0) {
      showToast(`Successfully uninstalled ${successCount} package(s)`, 'success')
    }
    setSelectedPackages(new Set())
    setBusy(false)
    scan(currentProject, { silent: true })
  }, [selectedPackages, scanResult, currentProject, getInvoke, scan, showToast])


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
    isSilentScanning,
    busy,
    availableUpdates,
    packageVersionHistory,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    selectedPackages,
    setSelectedPackages,
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
    syncProject,
    handleDeleteSelected,
    togglePackage,
    installingPackagesHasPath,
    installingPackages,
    runScript,
    handleAuditFix
  }
}
