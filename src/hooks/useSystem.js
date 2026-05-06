import { useState, useCallback, useEffect } from 'react'
import { isTauri, mockInvoke } from '../lib/browserMock'

export const useSystem = (showToast) => {
  const [frameworks, setFrameworks] = useState([])
  const [toolchainInfo, setToolchainInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [installingPackages, setInstallingPackages] = useState(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

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
    return (event, cb) => () => {}
  }, [])

  // Global log listener for installations
  useEffect(() => {
    let unlisten;
    const setupListener = async () => {
      const listen = await getListen();
      unlisten = await listen('install-log', (event) => {
        const { package: pkgName, line, stream, code } = event.payload;
        if (!pkgName) return;

        setInstallingPackages(prev => {
          const next = new Map(prev);
          const current = next.get(pkgName) || { progress: 10, lastLog: 'Initializing...' };

          if (stream === 'exit') {
            if (code === 0) {
              next.set(pkgName, { ...current, progress: 100, lastLog: 'Complete' });
              setTimeout(() => {
                setInstallingPackages(p => {
                  const n = new Map(p);
                  n.delete(pkgName);
                  return n;
                });
              }, 2000);
            } else {
              next.delete(pkgName);
            }
          } else if (line) {
            // Intelligent progress estimation based on common logs
            let newProgress = current.progress;
            const logLine = line.toLowerCase();
            
            if (logLine.includes('downloading')) newProgress = Math.max(newProgress, 30);
            if (logLine.includes('extracting')) newProgress = Math.max(newProgress, 60);
            if (logLine.includes('installing')) newProgress = Math.max(newProgress, 80);
            
            // Pip specific MB parsing: "[###] 1.2/11.5 MB"
            const mbMatch = line.match(/(\d+\.?\d*)\/(\d+\.?\d*)\s*MB/);
            if (mbMatch) {
              const currentMB = parseFloat(mbMatch[1]);
              const totalMB = parseFloat(mbMatch[2]);
              newProgress = Math.round((currentMB / totalMB) * 100);
            }

            next.set(pkgName, { 
              ...current, 
              progress: Math.min(99, newProgress), 
              lastLog: line.substring(0, 60),
              throughput: line.match(/\d+\.?\d*\s*MB\/s/)?.[0] || current.throughput
            });
          }
          return next;
        });
      });
    };

    setupListener();
    return () => { if (unlisten) unlisten(); };
  }, [getListen]);

  const detectFrameworks = useCallback(async () => {
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const detected = await invoke('detect_frameworks')
      setFrameworks(detected)
      showToast(`Detected ${detected.length} framework(s)`, 'success')
    } catch (e) {
      showToast(`Detection failed: ${e}`, 'error')
    }
    setBusy(false)
  }, [getInvoke, showToast])

  const searchPackages = useCallback(async (manager) => {
    if (!searchQuery) return
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const results = await invoke('search_packages', { packageManager: manager, query: searchQuery })
      setSearchResults(results)
    } catch (e) {
      showToast(`Search failed: ${e}`, 'error')
    } finally {
      setBusy(false)
    }
  }, [getInvoke, searchQuery, showToast])

  const installPackage = useCallback(async (manager, pkgName, currentProject = null) => {
    const invoke = await getInvoke()
    setInstallingPackages(prev => new Map(prev).set(pkgName, { progress: 5, lastLog: 'Queueing...' }));
    
    try {
      await invoke('install_package', {
        packageManager: manager,
        packageName: pkgName,
        projectPath: currentProject?.path || null,
        isGlobal: !currentProject
      })
      
      if (!currentProject) {
        try {
          const recent = JSON.parse(localStorage.getItem('recently_installed_globals') || '[]');
          if (!recent.includes(pkgName)) {
            localStorage.setItem('recently_installed_globals', JSON.stringify([...recent, pkgName]));
          }
        } catch (e) {
          console.error("Failed to update recently installed packages", e);
        }
      }
      showToast(`Successfully installed ${pkgName}`, 'success')
    } catch (e) {
      showToast(`Install failed: ${e}`, 'error')
      setInstallingPackages(prev => {
        const next = new Map(prev);
        next.delete(pkgName);
        return next;
      });
    }
  }, [getInvoke, showToast])

  useEffect(() => {
    getInvoke().then(invoke => {
      invoke('get_toolchain_info').then(setToolchainInfo).catch(console.error)
    })
  }, [getInvoke])

  return {
    frameworks,
    toolchainInfo,
    busy,
    installingPackages,
    searchQuery,
    setSearchQuery,
    searchResults,
    detectFrameworks,
    searchPackages,
    installPackage
  }
}
