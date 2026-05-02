import { useState, useCallback } from 'react'
import { isTauri, mockInvoke } from '../lib/browserMock'

export const useMaintenance = (projects, showToast) => {
  const [maintenanceResult, setMaintenanceResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

  const runMaintenance = useCallback(async () => {
    const invoke = await getInvoke()
    setIsAnalyzing(true)
    try {
      const result = await invoke('run_maintenance_scan', { projects })
      setMaintenanceResult(result)
      showToast('System health scan complete', 'success')
    } catch (e) {
      showToast(`Maintenance scan failed: ${e}`, 'error')
    }
    setIsAnalyzing(false)
  }, [getInvoke, projects, showToast])

  const handleCleanCache = useCallback(async (path) => {
    const invoke = await getInvoke()
    try {
      await invoke('clean_selected_caches', { paths: [path] })
      showToast('Cache cleaned successfully', 'success')
      runMaintenance()
    } catch (e) {
      showToast(`Cleanup failed: ${e}`, 'error')
    }
  }, [getInvoke, runMaintenance, showToast])

  const handleCleanAllCaches = useCallback(async () => {
    if (!maintenanceResult) return
    const invoke = await getInvoke()
    try {
      const paths = maintenanceResult.caches.map(c => c.path)
      await invoke('clean_selected_caches', { paths })
      showToast('All caches cleared', 'success')
      runMaintenance()
    } catch (e) {
      showToast(`Cleanup failed: ${e}`, 'error')
    }
  }, [getInvoke, maintenanceResult, runMaintenance, showToast])

  return {
    maintenanceResult,
    isAnalyzing,
    runMaintenance,
    handleCleanCache,
    handleCleanAllCaches
  }
}
