import React, { useState } from 'react'
import { Toaster, toast as sonnerToast } from 'sonner'
import { Zap, Package, Box, Cpu, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Hooks
import { useDashboard } from './hooks/useDashboard'

// Views
import DashboardView from './views/DashboardView'
import ProjectDetailsView from './views/ProjectDetailsView'
import FrameworksView from './views/FrameworksView'
import SystemPackagesView from './views/SystemPackagesView'

// Components
import { SettingsDialog } from './components/SettingsDialog'
import AnimatedCounter from './components/AnimatedCounter'

import './styles.css'

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const NAV_TABS = [
  { id: 'dashboard', label: 'Project Package', icon: Package },
  { id: 'system-packages', label: 'System Package', icon: Cpu },
  { id: 'frameworks', label: 'Framework', icon: Box },
]

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
}
const pageTransition = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }

function App() {
  const [viewMode, setViewMode] = useState('dashboard')
  const [currentProject, setCurrentProject] = useState(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    autoScan: true,
    notifications: true,
    accentColor: '#9333ea'
  })

  const showToast = (message, type = 'info') => {
    if (type === 'success') sonnerToast.success(message)
    else if (type === 'error') sonnerToast.error(message)
    else sonnerToast.info(message)
  }

  const { 
    projects, 
    setProjects,
    removeProject, 
    pickFolder 
  } = useDashboard(showToast)

  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings)
    showToast('Settings saved successfully', 'success')
  }

  const activeTabId = viewMode === 'project' || viewMode === 'create-project' ? 'dashboard' : viewMode

  // Hide tab bar when in create-project or project detail view
  const showTabBar = viewMode !== 'create-project' && viewMode !== 'project'

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 blur-[120px] rounded-full"
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100/30 blur-[100px] rounded-full"
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Global Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
        <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PEEAK
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setShowSettingsDialog(true)}
              className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center border border-transparent hover:border-gray-200"
              whileHover={{ scale: 1.08, rotate: 15 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              title="Global Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="py-8 px-8 max-w-[1600px] mx-auto relative z-10 min-h-screen">
        
        {/* Tab Bar — Above page content */}
        <AnimatePresence>
          {showTabBar && (
            <motion.div 
              className="mb-8 flex justify-start"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <nav className="flex items-center bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-inner relative">
                {NAV_TABS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setViewMode(item.id)}
                    className={`relative flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors duration-300 z-10 no-hover ${
                      activeTabId === item.id
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {/* Sliding pill indicator */}
                    {activeTabId === item.id && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 ${activeTabId === item.id ? 'text-white' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <DashboardView 
                setCurrentProject={setCurrentProject}
                setViewMode={setViewMode}
                showToast={showToast}
              />
            </motion.div>
          )}

          {viewMode === 'project' && currentProject && (
            <motion.div
              key="project"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ProjectDetailsView
                currentProject={currentProject}
                showToast={showToast}
                setViewMode={setViewMode}
                AnimatedCounter={AnimatedCounter}
                formatBytes={formatBytes}
              />
            </motion.div>
          )}

          {viewMode === 'create-project' && (
            <motion.div
              key="create-project"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <CreateProjectWrapper 
                setViewMode={setViewMode}
                showToast={showToast}
                pickFolder={pickFolder}
              />
            </motion.div>
          )}

          {viewMode === 'system-packages' && (
            <motion.div
              key="system-packages"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <SystemPackagesView
                showToast={showToast}
                formatBytes={formatBytes}
              />
            </motion.div>
          )}

          {viewMode === 'frameworks' && (
            <motion.div
              key="frameworks"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <FrameworksView 
                currentProject={currentProject}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Dialog — includes Maintenance & History */}
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={appSettings}
        onSave={handleSaveSettings}
        onCheckUpdates={() => showToast('You are using the latest version (v0.5.0)', 'success')}
        projects={projects}
        showToast={showToast}
        formatBytes={formatBytes}
        setCurrentProject={setCurrentProject}
        setViewMode={setViewMode}
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
        offset="90px"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #f3f4f6',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            padding: '14px 18px',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  )
}

// Wrapper to lazy-load ProjectCreationStudio safely (it imports Tauri at top level)
function CreateProjectWrapper({ setViewMode, showToast, pickFolder }) {
  const [StudioComponent, setStudioComponent] = React.useState(null)
  const [loadError, setLoadError] = React.useState(false)

  React.useEffect(() => {
    import('./components/ProjectCreationStudio')
      .then(mod => {
        setStudioComponent(() => mod.ProjectCreationStudio)
      })
      .catch(err => {
        console.error('Failed to load ProjectCreationStudio:', err)
        setLoadError(true)
      })
  }, [])

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4">
          Project creation is only available in Tauri mode
        </p>
        <button 
          onClick={() => setViewMode('dashboard')}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!StudioComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full mb-4"
        />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Studio...</p>
      </div>
    )
  }

  return (
    <StudioComponent 
      onBack={() => setViewMode('dashboard')}
      onImport={(path) => {
        showToast(`Project created at ${path}`, 'success')
        setViewMode('dashboard')
      }}
    />
  )
}

export default App
