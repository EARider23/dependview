import { useState, useCallback, useEffect } from 'react'
import { isTauri, mockInvoke } from '../lib/browserMock'

export const useSystem = (showToast) => {
  const [frameworks, setFrameworks] = useState([])
  const [toolchainInfo, setToolchainInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

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
    setBusy(true)
    try {
      await invoke('install_package', {
        packageManager: manager,
        packageName: pkgName,
        projectPath: currentProject?.path || null,
        isGlobal: !currentProject
      })
      showToast(`Installing ${pkgName}...`, 'success')
    } catch (e) {
      showToast(`Install failed: ${e}`, 'error')
    }
    setBusy(false)
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
    searchQuery,
    setSearchQuery,
    searchResults,
    detectFrameworks,
    searchPackages,
    installPackage
  }
}
