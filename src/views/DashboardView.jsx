import React, { useRef, useEffect } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderOpen, Layers, Square, Menu, Zap, Box } from 'lucide-react'
import { gsap } from 'gsap'
import { Button } from '../components/ui/button'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectCardStack } from '../components/ProjectCardStack'



// Stagger container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 }
  },
}

const DashboardView = ({
  setCurrentProject,
  setViewMode,
  showToast,
  projects,
  projectViewMode,
  setProjectViewMode,
  pickFolder,
  removeProject
}) => {

  const handleImportProject = async () => {
    const project = await pickFolder()
    if (project) {
      setCurrentProject(project)
      setViewMode('project')
    }
  }

  const emptyIconRef = useRef(null)

  // GSAP pulse glow on empty state icon
  useEffect(() => {
    if (projects.length === 0 && emptyIconRef.current) {
      gsap.to(emptyIconRef.current, {
        boxShadow: '0 0 40px rgba(147, 51, 234, 0.25)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }
  }, [projects.length])

  const handleSelectProject = (p) => {
    setCurrentProject(p)
    setViewMode('project')
  }

  const viewModes = ['grid', 'list', 'stack']

  return (
    <div>
      {/* Title & Actions Section */}
      {/* Title & Actions Section */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center">
              Project <span className="text-purple-600 ml-1">Manager</span>
            </h2>
            <motion.div
              className="bg-purple-50 px-2 h-5 rounded-md border border-purple-100 hidden sm:flex items-center justify-center ml-3 translate-y-[2px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">Inventory</span>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="flex flex-wrap gap-3 items-center w-full md:w-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        >
          {/* Create Project */}
          <Button
            onClick={() => setViewMode('create-project')}
            size="lg"
            className="flex-1 md:flex-none h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 rounded-xl transition-all active:scale-95 font-bold no-hover"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Project
          </Button>

          {/* Import Project */}
          <Button
            onClick={handleImportProject}
            size="lg"
            className="flex-1 md:flex-none h-11 px-6 bg-white text-gray-900 border border-gray-100 shadow-sm rounded-xl transition-all active:scale-95 font-bold no-hover hover:border-gray-200 hover:bg-gray-50"
          >
            <FolderOpen className="w-4 h-4 mr-2 text-gray-400" /> Import Project
          </Button>

          {/* View mode toggle */}
          <div className="flex bg-gray-100/50 rounded-xl p-1 border border-gray-100 relative">
            {viewModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setProjectViewMode(mode)}
                className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 no-hover ${projectViewMode === mode
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {/* Animated view mode pill */}
                {projectViewMode === mode && (
                  <motion.div
                    layoutId="viewModePill"
                    className="absolute inset-0 bg-white shadow-sm border border-gray-100/50 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {mode === 'grid' && <Square className="w-4 h-4" />}
                {mode === 'list' && <Menu className="w-4 h-4" />}
                {mode === 'stack' && <Layers className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Centered Text Divider */}
      <motion.div
        className="flex items-center gap-4 mb-10 w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="h-[1px] bg-gradient-to-r from-transparent to-gray-200 flex-1"></div>
        <span className="text-gray-400 font-bold text-xs tracking-widest whitespace-nowrap">Manage Inventory</span>
        <div className="h-[1px] bg-gradient-to-l from-transparent to-gray-200 flex-1"></div>
      </motion.div>

      <div className="mb-12">
        {projects.length === 0 ? (
          <motion.div
            className="relative py-12 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Minimal Drop Zone Container */}
            <motion.div
              onClick={pickFolder}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                // Tauri handles file drops via window events usually, 
                // but we'll stick to the click-to-pick for reliability 
                // unless the user specifically asks for native tauri drop listener
                pickFolder()
              }}
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Animated Dashed Border */}
              <div className="absolute inset-0 rounded-[3rem] border-2 border-dashed border-gray-200 group-hover:border-purple-400 group-hover:bg-purple-50/30 transition-all duration-500" />

              {/* Inner Content */}
              <div className="relative z-10 flex flex-col items-center justify-center py-32 px-12 text-center">
                {/* Floating Icon */}
                <motion.div
                  className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-10 border border-gray-100 group-hover:border-purple-200 transition-colors"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative">
                    <FolderOpen className="w-10 h-10 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    <motion.div
                      className="absolute -top-8 -right-8 w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">
                  Import Your <span className="text-purple-600">Project</span>
                </h2>
                <p className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.3em] mb-8">
                  Initialize your local Project
                </p>

                <div className="flex flex-col items-center gap-2">
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                    Click or Drag Folder Here
                  </span>
                </div>
              </div>

              {/* Decorative Corner Accents */}
              <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-gray-200 group-hover:border-purple-400 transition-colors rounded-tl-lg" />
              <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-gray-200 group-hover:border-purple-400 transition-colors rounded-tr-lg" />
              <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-gray-200 group-hover:border-purple-400 transition-colors rounded-bl-lg" />
              <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-gray-200 group-hover:border-purple-400 transition-colors rounded-br-lg" />
            </motion.div>

            {/* Sub-hints */}
            <div className="mt-12 flex items-center justify-center gap-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 group cursor-help hover:text-gray-400 transition-colors">
                <Zap className="w-3 h-3" /> Auto-Detect Tech
              </span>
              <span className="flex items-center gap-2 group cursor-help hover:text-gray-400 transition-colors">
                <Box className="w-3 h-3" /> Dependency Audit
              </span>
              <span className="flex items-center gap-2 group cursor-help hover:text-gray-400 transition-colors">
                <Layers className="w-3 h-3" /> System Hygiene
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {projectViewMode === 'stack' && (
                <motion.div
                  key="stack"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="h-[500px] w-full max-w-4xl mx-auto flex items-center justify-center p-8"
                >
                  <ProjectCardStack
                    projects={projects}
                    onClick={(p) => handleSelectProject(p)}
                    onRemove={(path) => removeProject(path)}
                  />
                </motion.div>
              )}
              {projectViewMode === 'grid' && (
                <motion.div
                  key="grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                >
                  {projects.map((p, i) => (
                    <motion.div key={p.path} variants={itemVariants}>
                      <ProjectCard
                        project={p}
                        viewMode="grid"
                        onClick={() => handleSelectProject(p)}
                        onRemove={(path) => removeProject(path)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {projectViewMode === 'list' && (
                <motion.div
                  key="list"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col space-y-3"
                >
                  {projects.map((p) => (
                    <motion.div key={p.path} variants={itemVariants}>
                      <ProjectCard
                        project={p}
                        viewMode="list"
                        onClick={() => handleSelectProject(p)}
                        onRemove={(path) => removeProject(path)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" richColors theme="dark" />
    </div>
  )
}

export default DashboardView
