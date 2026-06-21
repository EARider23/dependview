import React, { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { Zap, Settings, Package, Cpu, Box, Moon, Sun, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// New Icons
import projectIcon from './assets/interfaceicons/project.svg'
import systemIcon from './assets/interfaceicons/system.svg'
import frameworkIcon from './assets/interfaceicons/framework.svg'

// Hooks
import { useDashboard } from './hooks/useDashboard'
import { useFeedbackSync } from './hooks/useFeedbackSync'
import { useAppUpdates } from './hooks/useAppUpdates'

// Views
import DashboardView from './views/DashboardView'
import ProjectDetailsView from './views/ProjectDetailsView'
import FrameworksView from './views/FrameworksView'
import SystemPackagesView from './views/SystemPackagesView'

// Components
import { SettingsDialog } from './components/SettingsDialog'
import { ImportProgressDialog } from './components/ImportProgressDialog'
import { FeedbackDialog } from './components/FeedbackDialog'
import { TicketResolvedDialog } from './components/TicketResolvedDialog'
import { OnboardingModal } from './components/OnboardingModal'
import { WhatsNewDrawer } from './components/WhatsNewDrawer'
import { LaunchModal } from './components/LaunchModal'
import AnimatedCounter from './components/AnimatedCounter'
import { useTheme } from './hooks/useTheme'
import { APP_CONFIG } from './hooks/useAppUpdates'
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
  { id: 'dashboard', label: 'Project Package', img: projectIcon, /* icon: Package */ },
  { id: 'system-packages', label: 'System Package', img: systemIcon, /* icon: Cpu */ },
  { id: 'frameworks', label: 'Framework', img: frameworkIcon, /* icon: Box */ },
]

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
}
const pageTransition = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }

function App() {
  const [viewMode, setViewMode] = useState('dashboard')
  const [currentProject, setCurrentProject] = useState(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const isDebugMode = false; // Set to true to show debug buttons for onboarding/launch

  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    autoScan: true,
    notifications: true,
    accentColor: '#9333ea',
    customScanPaths: [],
    globalSizeThreshold: 2
  })

  const { theme, toggleTheme, setTheme, isDark } = useTheme()

  const showToast = (message, type = 'info') => {
    if (type === 'success') toast.success(message)
    else if (type === 'error') toast.error(message)
    else toast(message)
  }

  // Queue for resolved tickets to show popups one by one
  const [resolvedTickets, setResolvedTickets] = useState([])

  const handleTicketResolved = (ticket) => {
    // Prevent adding duplicates to queue if hook fires multiple times quickly
    setResolvedTickets(prev => {
      if (prev.find(t => t.id === ticket.id)) return prev
      return [...prev, ticket]
    })
  }

  // Start background sync for feedback notifications
  useFeedbackSync(handleTicketResolved)

  // App Updates & Onboarding System
  const {
    showOnboarding,
    showLaunchModal,
    finishOnboarding,
    finishLaunchModal,
    triggerOnboardingTest,
    triggerLaunchModalTest
  } = useAppUpdates()

  const {
    projects,
    setProjects,
    projectViewMode,
    setProjectViewMode,
    importingProject,
    importStage,
    importPkgCount,
    importingProjectName,
    setImportingProject,
    removeProject,
    pickFolder,
    importFromPath,
    updateProject
  } = useDashboard(showToast)

  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings)
    if (newSettings.theme) {
      setTheme(newSettings.theme)
    }
    showToast('Settings saved successfully', 'success')
  }

  const activeTabId = viewMode === 'project' || viewMode === 'create-project' ? 'dashboard' : viewMode

  // Hide tab bar when in project detail view
  const showTabBar = viewMode !== 'project'

  return (
    <div 
      className="min-h-screen bg-[#fcfcfd] text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900"
      onContextMenu={(e) => e.preventDefault()}
    >
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

          <div className="flex items-center gap-2">
            {/* Feedback / Bug Report */}
            <motion.button
              onClick={() => setShowFeedbackDialog(true)}
              className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center border border-transparent hover:border-gray-200"
              whileHover={{ scale: 1.08, rotate: -15 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              title="Report Bug or Request Feature"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <line x1="9" y1="10" x2="15" y2="10"></line>
                <line x1="12" y1="7" x2="12" y2="13"></line>
              </svg>
            </motion.button>

            {/* What's New / Notifications (Temporarily Disabled by Config) */}
            {APP_CONFIG.hasNewPatchNotes && (
              <motion.button
                onClick={() => setShowWhatsNew(true)}
                className="relative w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center border border-transparent hover:border-gray-200"
                whileHover={{ scale: 1.08, rotate: 15 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                title="What's New"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
              </motion.button>
            )}

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center border border-transparent hover:border-gray-200"
              whileHover={{ scale: 1.08, rotate: isDark ? -15 : 15 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-5 h-5 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

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

            {/* Debug Buttons (Hidden by default) */}
            {isDebugMode && (
              <>
                <motion.button
                  onClick={triggerOnboardingTest}
                  className="px-3 py-1 ml-2 text-xs font-bold text-white bg-black rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Test Onboarding
                </motion.button>
                <motion.button
                  onClick={triggerLaunchModalTest}
                  className="px-3 py-1 text-xs font-bold text-white bg-purple-600 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Test Launch Modal
                </motion.button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 min-h-screen">
        <div className="py-8 px-8 max-w-[1600px] mx-auto">

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
                      className={`relative flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors duration-300 z-10 no-hover ${activeTabId === item.id
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'
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
                      <img
                        src={item.img}
                        className={`w-4 h-4 object-contain ${activeTabId === item.id ? 'brightness-0 invert' : 'opacity-60 dark:invert'}`}
                        alt={item.label}
                      />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(viewMode === 'dashboard' || viewMode === 'create-project') && (
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
                  projects={projects}
                  projectViewMode={projectViewMode}
                  setProjectViewMode={setProjectViewMode}
                  pickFolder={pickFolder}
                  importFromPath={importFromPath}
                  removeProject={removeProject}
                  showOnboarding={showOnboarding}
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
                  setCurrentProject={setCurrentProject}
                  showToast={showToast}
                  setViewMode={setViewMode}
                  removeProject={removeProject}
                  updateProject={updateProject}
                  AnimatedCounter={AnimatedCounter}
                  formatBytes={formatBytes}
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
        </div>
      </main>

      <AnimatePresence>
        {viewMode === 'create-project' && (
          <motion.div
            key="create-project"
            initial={{ y: '100%', borderRadius: '60px' }}
            animate={{ y: 0, borderRadius: '0px' }}
            exit={{ y: '100%', borderRadius: '60px' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.6 }}
            className="fixed inset-0 bg-[#0e0e11] z-[100] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <CreateProjectWrapper
              setViewMode={setViewMode}
              showToast={showToast}
              pickFolder={pickFolder}
              setCurrentProject={setCurrentProject}
              setProjects={setProjects}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Analysis Dialog */}
      <ImportProgressDialog
        open={importingProject}
        projectName={importingProjectName}
        stage={importStage}
        packageCount={importPkgCount}
        onOpenChange={setImportingProject}
      />

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

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        showToast={showToast}
      />

      {/* Ticket Resolved Popup */}
      {resolvedTickets.length > 0 && (
        <TicketResolvedDialog
          ticket={resolvedTickets[0]}
          onDismiss={() => setResolvedTickets(prev => prev.slice(1))}
        />
      )}

      {/* Cinematic Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={finishOnboarding}
      />

      {/* What's New Drawer */}
      <WhatsNewDrawer
        open={showWhatsNew}
        onClose={() => setShowWhatsNew(false)}
      />

      {/* Launch Modal (Major Updates) */}
      <LaunchModal
        open={showLaunchModal}
        onComplete={finishLaunchModal}
      />

      {/* Global Toast Notifications (Must be outside of motion.divs to prevent CSS transform bugs) */}
      <Toaster position="bottom-right" richColors theme="dark" expand={false} />

    </div>
  )
}

// Wrapper to lazy-load ProjectCreationStudio safely (it imports Tauri at top level)
function CreateProjectWrapper({ setViewMode, showToast, pickFolder, setCurrentProject, setProjects }) {
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
        const projectName = path.split(/[\\\/]/).pop()
        const newProject = {
          path: path,
          name: projectName,
          lastScanned: Date.now(),
          technologies: [],
        }
        setProjects(prev => {
          const exists = prev.find(p => p.path === path)
          if (exists) return prev
          const updated = [newProject, ...prev]
          localStorage.setItem('projects', JSON.stringify(updated))
          return updated
        })
        setCurrentProject(newProject)
        setViewMode('project')
      }}
    />
  )
}

export default App
