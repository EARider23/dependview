import { useState, useEffect, useCallback } from 'react'
import { isTauri, mockInvoke } from '../lib/browserMock'

export const useDashboard = (showToast) => {
  const [projects, setProjects] = useState([])
  const [projectViewMode, setProjectViewMode] = useState('grid')
  const [importingProject, setImportingProject] = useState(false)
  
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

  const pickFolder = useCallback(async () => {
    const invoke = await getInvoke()
    try {
      const selected = await invoke('pick_folder')
      if (selected) {
        const projectName = selected.split(/[\\\/]/).pop()
        const newProject = { 
          path: selected, 
          name: projectName, 
          lastScanned: Date.now(),
          technologies: ['npm'] 
        }

        setProjects(prev => {
          const exists = prev.find(p => p.path === selected)
          if (exists) return prev
          const updated = [newProject, ...prev]
          localStorage.setItem('projects', JSON.stringify(updated))
          return updated
        })
        
        showToast(`Imported: ${projectName}`, 'success')
        return newProject
      }
    } catch (e) {
      showToast(`Failed to pick folder: ${e}`, 'error')
    }
    return null
  }, [getInvoke, showToast])

  const removeProject = useCallback((projectPath) => {
    if (!window.confirm('Remove this project from imported list?')) return
    const updated = projects.filter(p => p.path !== projectPath)
    setProjects(updated)
    localStorage.setItem('projects', JSON.stringify(updated))
  }, [projects])

  return {
    projects,
    setProjects,
    projectViewMode,
    setProjectViewMode,
    importingProject,
    pickFolder,
    removeProject
  }
}
