import { useState, useEffect, useCallback } from 'react'
import { isTauri, mockInvoke } from '../lib/browserMock'
import { getTechIcon } from '../assets/iconLinks'

export const useDashboard = (showToast) => {
  const [projects, setProjects] = useState([])
  const [projectViewMode, setProjectViewMode] = useState('grid')
  const [importingProject, setImportingProject] = useState(false)
  const [importStage, setImportStage] = useState('checking')
  const [importPkgCount, setImportPkgCount] = useState(0)
  const [importingProjectName, setImportingProjectName] = useState('')

  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

  const loadProjects = useCallback(() => {
    const saved = localStorage.getItem('projects')
    if (saved) {
      try {
        setProjects(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse projects', e)
      }
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  /**
   * Full import pipeline:
   * 1. Pick folder
   * 2. Stage: checking  → validate it's a real project
   * 3. Stage: scanning  → scan node_modules / packages via stream
   * 4. Stage: detecting → detect technologies, scripts, audit, outdated
   * 5. Save project with all data, return it so caller can navigate
   */
  const pickFolder = useCallback(async () => {
    const invoke = await getInvoke()
    try {
      const selected = await invoke('pick_folder')
      if (!selected) return null

      const projectName = selected.split(/[\\\/]/).pop()
      setImportingProjectName(projectName)
      setImportingProject(true)
      setImportStage('checking')
      setImportPkgCount(0)

      let detectedTechnologies = []
      let scanData = { packages: [], total_size: 0, total_count: 0 }

      if (isTauri()) {
        const { listen } = await import('@tauri-apps/api/event')

        // ── Stage 1: scanning ──────────────────────────────────────────
        setImportStage('scanning')

        await new Promise(async (resolve) => {
          const pkgList = []

          const unlistenProgress = await listen('scan-progress', (event) => {
            const pkg = event.payload?.package
            if (pkg) {
              pkgList.push(pkg)
              setImportPkgCount(pkgList.length)
            }
          })

          const unlistenComplete = await listen('scan-complete', (event) => {
            const result = event.payload?.result || event.payload || {}
            scanData = result
            unlistenProgress()
            unlistenComplete()
            resolve()
          })

          try {
            await invoke('scan_project_stream', { folder: selected })
          } catch (e) {
            unlistenProgress()
            unlistenComplete()
            resolve()
          }
        })

        // ── Stage 2: detecting ─────────────────────────────────────────
        setImportStage('detecting')

        // Detect technologies
        try {
          const techs = await invoke('detect_project_technologies', { projectPath: selected })
          detectedTechnologies = (techs || []).map(t =>
            typeof t === 'string' ? getTechIcon(t) : t
          )
        } catch (_) {}

        // Read scripts, audit, outdated (parallel, non-blocking)
        let scripts = {}
        let auditResult = null
        let outdatedCount = 0

        await Promise.allSettled([
          invoke('read_package_scripts', { projectPath: selected })
            .then(r => { scripts = r || {} }).catch(() => {}),
          invoke('run_npm_audit', { projectPath: selected })
            .then(r => { auditResult = r }).catch(() => {}),
          invoke('run_npm_outdated', { projectPath: selected })
            .then(r => { outdatedCount = Object.keys(r || {}).length }).catch(() => {}),
        ])

        const newProject = {
          path: selected,
          name: projectName,
          lastScanned: Date.now(),
          technologies: detectedTechnologies.map(t => t.name || t).filter(Boolean),
          _scanData: scanData,
          _scripts: scripts,
          _auditResult: auditResult,
          _outdatedCount: outdatedCount,
        }

        setProjects(prev => {
          const exists = prev.find(p => p.path === selected)
          if (exists) return prev
          const updated = [newProject, ...prev]
          localStorage.setItem('projects', JSON.stringify(updated))
          return updated
        })

        setImportingProject(false)
        return newProject

      } else {
        // ── Browser mock ───────────────────────────────────────────────
        await new Promise(r => setTimeout(r, 800))
        setImportStage('scanning')
        setImportPkgCount(0)
        await new Promise(r => setTimeout(r, 1200))
        setImportPkgCount(24)
        setImportStage('detecting')
        await new Promise(r => setTimeout(r, 1000))

        const newProject = {
          path: selected,
          name: projectName,
          lastScanned: Date.now(),
          technologies: ['npm'],
        }

        setProjects(prev => {
          const exists = prev.find(p => p.path === selected)
          if (exists) return prev
          const updated = [newProject, ...prev]
          localStorage.setItem('projects', JSON.stringify(updated))
          return updated
        })

        setImportingProject(false)
        return newProject
      }

    } catch (e) {
      setImportingProject(false)
      showToast(`Failed to import: ${e}`, 'error')
    }
    return null
  }, [getInvoke, showToast])

  const removeProject = useCallback((projectPath) => {
    if (!window.confirm('Remove this project from the list?')) return
    const updated = projects.filter(p => p.path !== projectPath)
    setProjects(updated)
    localStorage.setItem('projects', JSON.stringify(updated))
  }, [projects])

  const updateProject = useCallback((projectPath, updates) => {
    setProjects(prev => {
      const updated = prev.map(p => p.path === projectPath ? { ...p, ...updates } : p)
      localStorage.setItem('projects', JSON.stringify(updated))
      return updated
    })
  }, [])

  return {
    projects,
    setProjects,
    projectViewMode,
    setProjectViewMode,
    importingProject,
    importStage,
    importPkgCount,
    importingProjectName,
    setImportingProject,
    pickFolder,
    removeProject,
    updateProject
  }
}
