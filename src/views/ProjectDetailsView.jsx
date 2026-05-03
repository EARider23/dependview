import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RefreshCw, HardDrive, ShieldCheck, Zap, FolderOpen, FolderMinus,
  Search, X, Box, Square, Menu, Trash2, ArrowUpCircle, Package, Play, Plus, ExternalLink, Database
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { PackageCard } from '../components/PackageCard'
import { getTechIcon } from '../assets/iconLinks'
import { useProject } from '../hooks/useProject'

const ProjectDetailsView = ({
  currentProject,
  setCurrentProject,
  showToast,
  setViewMode,
  removeProject,
  updateProject,
  AnimatedCounter,
  formatBytes
}) => {
  if (!currentProject) return null

  const fileInputRef = useRef(null)
  const [packageView, setPackageView] = React.useState('grid')
  const {
    scanResult,
    auditResult,
    projectTechnologies,
    projectScripts,
    outdatedCount,
    venvPath,
    isScanning,
    isLoadingAudit,
    busy,
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
    topPackages,
    filteredPackages,
    scan,
    handleSearch,
    handleInstall,
    handleUpdate,
    handleDelete,
    openFolder,
    handleUpdateAll,
    togglePackage,
    installingPackagesHasPath,
    installingPackages,
    runScript
  } = useProject(currentProject, showToast)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Image = event.target.result
      const updates = { image: base64Image }
      updateProject(currentProject.path, updates)
      setCurrentProject({ ...currentProject, ...updates })
      showToast('Project image updated successfully', 'success')
    }
    reader.readAsDataURL(file)
  }

  const searchInputRef = useRef(null)
  const [isUninstallDialogOpen, setIsUninstallDialogOpen] = React.useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = React.useState('');

  const [displayMetrics, setDisplayMetrics] = React.useState({
    pkgCount: 0,
    outdatedCount: 0,
    totalSize: 0,
    criticalCount: 0,
    highCount: 0,
    totalVulns: 0
  });

  React.useEffect(() => {
    if (!isScanning && scanResult) {
      const timer = setTimeout(() => {
        setDisplayMetrics({
          pkgCount: scanResult?.packages?.length || 0,
          outdatedCount: outdatedCount || 0,
          totalSize: scanResult?.total_size || 0,
          criticalCount: auditResult?.metadata?.vulnerabilities?.critical || 0,
          highCount: auditResult?.metadata?.vulnerabilities?.high || 0,
          totalVulns: auditResult?.metadata?.vulnerabilities?.total || 0
        });
      }, 300);
      return () => clearTimeout(timer);
    } else if (isScanning) {
      setDisplayMetrics({
        pkgCount: 0,
        outdatedCount: 0,
        totalSize: 0,
        criticalCount: 0,
        highCount: 0,
        totalVulns: 0
      });
    }
  }, [isScanning, scanResult, auditResult, outdatedCount]);

  const handleUninstall = () => {
    if (confirmDeleteText === `delete - ${currentProject?.name}`) {
      removeProject(currentProject.path);
      setViewMode('dashboard');
      showToast(`${currentProject?.name} uninstalled successfully`, 'success');
      setIsUninstallDialogOpen(false);
      setConfirmDeleteText('');
    }
  };

  const vulnsMetadata = auditResult?.metadata?.vulnerabilities || {};
  const totalVulns = vulnsMetadata.total || 0;
  const criticalCount = vulnsMetadata.critical || 0;
  const highCount = vulnsMetadata.high || 0;
  const totalSize = scanResult?.total_size || 0
  const pkgCount = scanResult?.packages?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 pb-20 max-w-7xl mx-auto"
    >
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setViewMode('dashboard')}
            variant="ghost"
            size="sm"
            className="w-9 h-9 rounded-lg bg-white/60 border border-gray-100 shadow-sm p-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Button>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center">
              Project <span className="text-purple-600 ml-1">Details</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => scan(currentProject)}
            disabled={busy}
            variant="outline"
            className="h-9 px-3 rounded-lg bg-white shadow-sm font-bold text-[10px] uppercase tracking-wider"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${busy ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Project Analysis Overlay (Opening Project) */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-32 h-32 mb-8 relative flex items-center justify-center">
                {/* Background Squircle */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                  <rect
                    x="4" y="4" width="92" height="92" rx="28"
                    className="fill-none stroke-purple-100 stroke-[4]"
                  />
                </svg>

                {/* Animated Trail */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                  <motion.rect
                    x="4" y="4" width="92" height="92" rx="28"
                    className="fill-none stroke-purple-600 stroke-[4]"
                    strokeLinecap="round"
                    initial={{ pathLength: 0.2, pathOffset: 0 }}
                    animate={{ pathOffset: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </svg>

                <div className="relative z-10 w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center border border-purple-50">
                  <Package className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Analyzing Workspace</h3>
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Synchronizing dependency state & node_modules</p>
            </div>

            <div className="mt-12 flex gap-3">
              <Badge variant="outline" className="bg-white/50 animate-pulse border-purple-100 text-purple-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                Scanning Node Modules
              </Badge>
              <Badge variant="outline" className="bg-white/50 animate-pulse delay-75 border-purple-100 text-purple-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                Detecting Changes
              </Badge>
              <Badge variant="outline" className="bg-white/50 animate-pulse delay-150 border-purple-100 text-purple-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                Syncing Metrics
              </Badge>
            </div>

            {/* Animated Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uninstall Confirmation Modal */}
      <AnimatePresence>
        {isUninstallDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-red-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 text-center mb-2">Uninstall Project?</h3>
              <p className="text-gray-500 text-center mb-6 text-sm">
                This action is irreversible. To proceed, please type <span className="font-bold text-red-600">delete - {currentProject?.name}</span> below.
              </p>

              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder={`delete - ${currentProject?.name}`}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-red-500 outline-none transition-all font-bold text-sm mb-6 text-center"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold border-gray-100"
                  onClick={() => {
                    setIsUninstallDialogOpen(false);
                    setConfirmDeleteText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className={`flex-1 h-12 rounded-xl font-bold ${confirmDeleteText !== `delete - ${currentProject?.name}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={confirmDeleteText !== `delete - ${currentProject?.name}`}
                  onClick={handleUninstall}
                >
                  Uninstall
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Bento Grid Design (As per Screenshot) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-8 items-stretch">
        {/* Left Tall Card: Project Branding */}
        <motion.div
          whileHover="hover"
          className="xl:col-span-4 xl:row-span-3 bg-white rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm relative flex flex-col items-center justify-center group overflow-hidden"
        >
          {/* Background Decor - Subtle & Professional */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50" />

            {/* Very Mild Hover Glow */}
            <motion.div
              variants={{
                hover: {
                  opacity: 1,
                  scale: 1.1
                }
              }}
              className="absolute -inset-20 bg-gradient-to-tr from-indigo-50/20 via-transparent to-indigo-50/20 opacity-0 blur-3xl transition-opacity duration-1000"
            />
          </div>

          <div className="absolute top-6 right-6 flex gap-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              title="Remove from Dashboard (List Only)"
              onClick={() => {
                if (window.confirm('Remove this project from the dashboard list? (Physical files will not be deleted)')) {
                  removeProject(currentProject.path);
                  setViewMode('dashboard');
                }
              }}
              className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"
            >
              <FolderMinus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Uninstall Project (Delete Files)"
              onClick={() => setIsUninstallDialogOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative z-10 flex flex-col items-center w-full">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <motion.div
              variants={{ hover: { y: -5, scale: 1.05 } }}
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mb-6 border border-indigo-100 transition-all duration-700 ease-out ring-1 ring-indigo-50/30 overflow-hidden cursor-pointer group/icon"
            >
              {currentProject?.image ? (
                <div className="relative w-full h-full group/img">
                  <img src={currentProject.image} className="w-full h-full object-cover" alt={currentProject?.name} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProject(currentProject.path, { image: null });
                      setCurrentProject({ ...currentProject, image: null });
                      showToast('Project image removed', 'info');
                    }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                    title="Remove Image"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 text-indigo-500 group-hover/icon:scale-110 transition-transform">
                  <FolderOpen className="w-full h-full" />
                </div>
              )}
            </motion.div>

            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter text-center truncate w-full px-4 drop-shadow-sm">{currentProject?.name}</h3>

            {/* Tech Stack Dock (Mac-style Zoom) */}
            <div className="flex -space-x-2 items-center justify-center h-16 px-4">
              {(projectTechnologies || []).slice(0, 7).map((tech, i) => {
                const techName = tech?.name || (typeof tech === 'string' ? tech : 'Unknown');
                const iconData = tech?.image ? tech : getTechIcon(techName);

                return (
                  <div key={`${techName}-${i}`} className="relative group/tech">
                    {/* Floating Label */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tech:opacity-100 group-hover/tech:-top-12 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl">
                      {techName}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                    </div>

                    <motion.div
                      whileHover={{
                        scale: 1.3,
                        y: -8,
                        marginInline: "0.5rem",
                        zIndex: 40
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`w-10 h-10 rounded-full ${techName.toLowerCase().includes('next') ? 'bg-slate-900' : 'bg-white'} border-2 border-indigo-50 shadow-lg flex items-center justify-center overflow-hidden relative cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 transition-shadow`}
                      style={{ zIndex: 20 - i }}
                    >
                      {iconData?.image ? (
                        <img src={iconData.image} className={`w-6 h-6 object-contain ${techName.toLowerCase().includes('next') ? 'brightness-200' : ''}`} alt={techName} />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase">
                            {techName[0] || '?'}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decorative background accent */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700" />
        </motion.div>

        {/* Row 1 Metric Cards */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-indigo-200 transition-all">
          <div className="space-y-1.5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white"
            >
              <Box className="w-5 h-5" />
            </motion.div>
            <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Packages</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
              <AnimatedCounter value={displayMetrics.pkgCount} />
            </span>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-blue-200 transition-all">
          <div className="space-y-1.5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Updates</span>
          </div>
          <div className="mt-2">
            <span className={`text-3xl font-black tracking-tighter leading-none ${displayMetrics.outdatedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              <AnimatedCounter value={displayMetrics.outdatedCount} />
            </span>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden hover:border-red-200 transition-all">
          <div className="absolute top-5 right-5">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 10 }}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 transition-colors group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600"
            >
              <ShieldCheck className="w-5 h-5" />
            </motion.div>
          </div>
          <div className="space-y-2">
            <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Security Analysis</span>
            <div className="flex flex-col">
              {isLoadingAudit ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xl font-black text-slate-400 animate-pulse uppercase tracking-widest">Auditing...</span>
                </div>
              ) : (
                <>
                  <span className={`text-3xl font-black tracking-tighter leading-none ${displayMetrics.totalVulns > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {displayMetrics.totalVulns > 0 ? `${displayMetrics.totalVulns} Vulnerabilities` : 'Project Secure'}
                  </span>
                  <div className="flex gap-2 mt-3">
                    {displayMetrics.criticalCount > 0 && (
                      <Badge className="bg-rose-950 text-white border-0 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                        Critical: {displayMetrics.criticalCount}
                      </Badge>
                    )}
                    {displayMetrics.highCount > 0 && (
                      <Badge className="bg-red-600 text-white border-0 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                        High: {displayMetrics.highCount}
                      </Badge>
                    )}
                    {displayMetrics.totalVulns === 0 && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                        Verified Clean
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 Metric Cards */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 transition-colors group-hover:bg-slate-900 group-hover:text-white"
            >
              <HardDrive className="w-5 h-5" />
            </motion.div>
            <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Disk Usage</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
              <AnimatedCounter value={displayMetrics.totalSize} formatter={formatBytes} />
            </span>
          </div>
        </div>

        <div className="xl:col-span-6 bg-slate-50 rounded-[2rem] p-5 border border-slate-200 shadow-inner flex flex-col justify-between group hover:bg-slate-100/50 transition-all h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-black uppercase text-[9px] tracking-widest">Environment Root</span>
              <Badge className="bg-slate-900 text-white border-0 font-black text-[7px] rounded-lg px-1.5 py-0 shadow-sm uppercase tracking-widest">Isolated</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -15 }}
              onClick={() => openFolder(currentProject?.path)}
              className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200 hover:bg-slate-900 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <FolderOpen className="w-4 h-4" />
            </motion.div>
            <span className="text-xs font-bold text-slate-600 truncate flex-1 tracking-tight">{currentProject?.path}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openFolder(currentProject?.path)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 3: Scripts (Now under Env Path) */}
        <div className="xl:col-span-8 bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all h-[140px] overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg"
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-black uppercase text-[10px] tracking-[0.1em]">Project Scripts</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {projectScripts && Object.keys(projectScripts).length > 0 ? (
              Object.keys(projectScripts).map(script => (
                <motion.div
                  key={script}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => runScript(script)}
                    className="h-8 px-3 rounded-xl border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 font-black text-[9px] uppercase tracking-widest transition-all group/btn flex items-center gap-2 shadow-sm"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white group-hover/btn:bg-indigo-500 transition-colors flex items-center justify-center shadow-sm">
                      <Play className="w-2 h-2 text-indigo-600 group-hover/btn:text-white fill-current" />
                    </div>
                    {script}
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="w-full flex items-center justify-center h-full">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">No scripts</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Storage Insights: Stealth Monochrome Section */}
      <div className="mb-14 mt-6 bg-[#080808] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Subtle Scanline Effect Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

        <div className="relative z-10">
          {/* Tactical Header: Unified Center Text with Thermal Indicators */}
          <div className="flex items-center justify-between mb-12 relative px-2">
            <motion.div 
              initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.25em] leading-none drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">High Usage</span>
              </div>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.15em] pl-3.5">Max Storage</span>
            </motion.div>
            
            <div className="flex-1 mx-16 relative flex items-center justify-center">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-white/5" />
               </div>
               <div className="relative z-20 bg-[#080808] px-10 py-3 border border-white/10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] flex items-center gap-3">
                    <Database className="w-3 h-3 text-slate-500" />
                    Storage Consumed Package
                  </span>
               </div>
            </div>
  
            <motion.div 
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-end gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.25em] leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">Low Usage</span>
                <div className="w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              </div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] pr-3.5">Min Storage</span>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {topPackages && topPackages.length > 0 ? (
              topPackages.map((pkg, idx) => {
                // Smart Brand Detection using iconLinks.js
                const pkgLower = pkg.name.toLowerCase();
                let techKey = pkgLower;
                
                if (pkgLower.includes('firebase')) techKey = 'firebase';
                else if (pkgLower.includes('three')) techKey = 'three';
                
                const tech = getTechIcon(techKey);
                const displayIcon = tech.image;
                
                return (
                  <motion.div
                    key={pkg.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    whileHover={{ y: -8 }}
                    className="relative group"
                  >
                    {/* Tactical Data Card: Enhanced Glow Style */}
                    <div className="bg-[#121212] rounded-[2rem] p-6 border border-white/5 group-hover:border-white/10 group-hover:bg-[#161616] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 h-[230px] flex flex-col justify-between relative overflow-hidden">
                      {/* Background Index Number with Glow */}
                      <div className="absolute top-4 right-6 text-[45px] font-black text-white/[0.01] group-hover:text-white/[0.05] transition-all duration-700 leading-none select-none italic tracking-tighter group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        0{idx + 1}
                      </div>
  
                      <div className="relative z-10">
                        {/* Icon Container with White Backdrop for Dark Icons */}
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-2xl mb-6 group-hover:bg-white/[0.08] group-hover:scale-110 group-hover:border-white/10 transition-all overflow-hidden relative shadow-inner">
                          {/* Visibility Glow for Dark Icons */}
                          <div className="absolute inset-2 bg-white/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {displayIcon ? (
                            <img 
                              src={displayIcon} 
                              alt={pkg.name} 
                              className="w-7 h-7 object-contain relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" 
                            />
                          ) : (
                            <Box className="w-5 h-5 text-slate-400 relative z-10" />
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em]">ID: {pkg.name.slice(0, 10)}...</span>
                          <h4 className="text-[14px] font-black text-white truncate tracking-tight group-hover:text-white transition-colors">
                            {pkg.name}
                          </h4>
                        </div>
                      </div>
    
                      <div className="relative z-10">
                        <div className="flex items-baseline gap-1.5 mb-5">
                          <span className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
                            {formatBytes(pkg.size).split(' ')[0]}
                          </span>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">
                            {formatBytes(pkg.size).split(' ')[1]}
                          </span>
                        </div>
    
                        {/* Metric Visualizer */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center px-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                              {idx === 0 ? 'MAX LOAD' : 'NOMINAL'}
                            </span>
                            <span className="text-[10px] font-black text-white/50 tabular-nums">
                              {Math.round((pkg.size / topPackages[0].size) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden p-[1px]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(pkg.size / topPackages[0].size) * 100}%` }}
                              transition={{ duration: 1.5, delay: idx * 0.1 + 0.5, ease: [0.22, 1, 0.36, 1] }}
                              className={`h-full rounded-full ${idx === 0 ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-slate-600 group-hover:bg-slate-400'} transition-all`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-5 py-24 flex flex-col items-center justify-center bg-[#121212] rounded-[2.5rem] border border-dashed border-white/5">
                <HardDrive className="w-10 h-10 text-slate-800 mb-4" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">Standby: Initializing Data</span>
              </div>
            )}
          </div>
        </div>
      </div>




      {/* Search & Registry */}
      <div className="mb-8">
        <div className="bg-purple-600 rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Inject new package (npm, pip)..."
              className="w-full h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-bold placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all"
            />
          </div>
          <Button onClick={handleSearch} disabled={busy || !searchQuery} className="h-10 px-6 rounded-xl bg-white text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 shadow-lg">
            Search Registry
          </Button>
        </div>

        <AnimatePresence>
          {searchResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto"
            >
              {searchResults.map((pkg) => (
                <div key={pkg.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm border border-gray-100 uppercase font-black text-gray-300">
                      {pkg.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{pkg.name}</h4>
                      <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">v{pkg.version}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleInstall(pkg.name, pkg.version)} size="sm" className="h-7 w-7 p-0 rounded-lg bg-gray-900 text-white shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inventory Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</span>
          <Badge variant="outline" className="text-[9px] font-black bg-white">{pkgCount} Total</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setPackageView('grid')} className={`p-1.5 rounded-md ${packageView === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}>
              <Square className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPackageView('list')} className={`p-1.5 rounded-md ${packageView === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}>
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter dependencies..."
            className="w-full h-8 pl-8 pr-3 bg-white border border-gray-100 rounded-lg text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-purple-500/20"
          />
        </div>
        <Button onClick={() => handleUpdateAll()} disabled={outdatedCount === 0 || busy} className="h-8 px-4 rounded-lg bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
          Update All ({outdatedCount})
        </Button>
      </div>

      {/* Package Lists */}
      <div className="space-y-8">
        {/* Project Dependencies */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Project Dependencies</h4>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>
          <div className={packageView === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "flex flex-col gap-2"}>
            {filteredPackages.filter(p => p?.is_declared).map(pkg => (
              <PackageCard
                key={pkg.path}
                pkg={pkg}
                viewMode={packageView}
                venvPath={venvPath}
                onUpdate={() => handleUpdate(pkg.name)}
                onDelete={() => handleDelete(pkg.name)}
                onToggle={() => togglePackage(pkg.path)}
                isSelected={selectedPackages.has(pkg.path)}
                isInstalling={installingPackagesHasPath(pkg.path)}
                installProgress={installingPackages.get(pkg.name)}
              />
            ))}
          </div>
        </section>

        {/* Sub-Dependencies */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sub Dependencies</h4>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>
          <div className={packageView === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "flex flex-col gap-2"}>
            {filteredPackages.filter(p => !p?.is_declared).map(pkg => (
              <PackageCard
                key={pkg.path}
                pkg={pkg}
                viewMode={packageView}
                venvPath={venvPath}
                onUpdate={() => handleUpdate(pkg.name)}
                onDelete={() => handleDelete(pkg.name)}
                onToggle={() => togglePackage(pkg.path)}
                isSelected={selectedPackages.has(pkg.path)}
                isInstalling={installingPackagesHasPath(pkg.path)}
                installProgress={installingPackages.get(pkg.name)}
              />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  )
}

export default ProjectDetailsView
