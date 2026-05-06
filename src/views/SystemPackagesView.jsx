import React, { useState, useCallback, useEffect } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import systemIcon from '../assets/interfaceicons/system.svg'
import {
  Package,
  Search,
  Download,
  RefreshCw,
  Cpu,
  HardDrive,
  Trash2,
  Box,
  ChevronDown,
  ChevronUp,
  Layers,
  ShieldCheck,
  Terminal
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { getTechIcon, getPackageIcon } from '../assets/iconLinks'
import { isTauri, mockInvoke } from '../lib/browserMock'
import AnimatedCounter from '../components/AnimatedCounter'
import { useSystem } from '../hooks/useSystem'


// Stagger variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}
const staggerItem = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 }
  },
}

const SystemPackagesView = ({ showToast, formatBytes }) => {
  const [systemResult, setSystemResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedManagers, setExpandedManagers] = useState(new Set(['npm']))
  const [recentGlobals, setRecentGlobals] = useState([])
  
    const {
    frameworks,
    busy: systemBusy,
    installingPackages,
    searchQuery: engineQuery,
    setSearchQuery: setEngineQuery,
    searchResults,
    searchPackages,
    installPackage
  } = useSystem(showToast)


  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recently_installed_globals') || '[]');
    setRecentGlobals(recent);
  }, []);

  const getInvoke = useCallback(async () => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      return invoke
    }
    return mockInvoke
  }, [])

  const scanSystemPackages = useCallback(async () => {
    const invoke = await getInvoke()
    setBusy(true)
    try {
      const result = await invoke('scan_system_packages')
      setSystemResult(result)
      showToast(`Found ${result.packages?.length || 0} global packages`, 'success')
    } catch (e) {
      showToast(`System scan failed: ${e}`, 'error')
    }
    setBusy(false)
  }, [getInvoke, showToast])

  useEffect(() => {
    if (!systemResult) {
      scanSystemPackages()
    }
  }, [])

  const toggleManager = (manager) => {
    const next = new Set(expandedManagers)
    if (next.has(manager)) next.delete(manager)
    else next.add(manager)
    setExpandedManagers(next)
  }

  const deletePackage = async (manager, pkgName) => {
    if (!window.confirm(`Are you sure you want to uninstall ${pkgName} globally?`)) return

    const invoke = await getInvoke()
    setBusy(true)
    try {
      await invoke('remove_package', {
        packageManager: manager,
        packageName: pkgName,
        projectPath: null,
        isGlobal: true
      })
      showToast(`${pkgName} uninstalled successfully`, 'success')
      // Refresh the list
      scanSystemPackages()
    } catch (e) {
      showToast(`Uninstall failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  const groupedPackages = (systemResult?.packages || []).reduce((acc, pkg) => {
    const key = pkg.manager || 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(pkg)
    return acc
  }, {})

  const filteredGroups = Object.entries(groupedPackages).reduce((acc, [manager, pkgs]) => {
    const filtered = pkgs.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filtered.length > 0) acc[manager] = filtered
    return acc
  }, {})

  const managerLabels = {
    npm: { label: 'Node.js (NPM)', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: 'N', tech: 'nodejs' },
    yarn: { label: 'Node.js (Yarn)', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: 'Y', tech: 'yarn' },
    pnpm: { label: 'Node.js (PNPM)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: 'PN', tech: 'pnpm' },
    pip: { label: 'Python (pip)', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', icon: 'P', tech: 'python' },
    cargo: { label: 'Rust (cargo)', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', icon: 'C', tech: 'rust' },
    gem: { label: 'Ruby (gem)', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: 'G', tech: 'ruby' },
    unknown: { label: 'System Other', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', icon: '?', tech: 'package' },
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <img src={systemIcon} className="w-4 h-4 brightness-0 invert" alt="System" />
              {/* <Layers className="w-4 h-4 text-white" /> */}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center">
              Global <span className="text-purple-600 ml-1">Packages</span>
            </h2>
            <motion.div
              className="bg-purple-50 px-2 h-5 rounded-md border border-purple-100 hidden sm:flex items-center justify-center ml-3 translate-y-[2px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">Global Tools</span>
            </motion.div>
          </div>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
            System-wide Discovery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={scanSystemPackages}
            disabled={busy}
            size="lg"
            className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 rounded-xl transition-all active:scale-95 font-bold no-hover"
          >
            {busy ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Rescan System
          </Button>
        </div>
      </motion.div>

      {/* NEW: Tactical Obsidian Registry Intelligence Engine */}
      <motion.div
        className="mb-12 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-slate-950 rounded-[3.5rem] overflow-hidden">
          {/* Tactical Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          
          {/* Cyan Glow Pulse */}
          <motion.div 
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 p-10 lg:p-12">
          {/* Engine Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Box className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Registry Intelligence Engine</h3>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] font-black tracking-widest px-1.5 py-0.5 uppercase">v4.0.2_PRO</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Global Nexus Protocol Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
              <div className="flex flex-col items-end">
                <span className="text-slate-600">Sync Status</span>
                <span className="text-cyan-400">Synchronized</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div className="flex flex-col items-end">
                <span className="text-slate-600">Endpoint</span>
                <span className="text-white">API.GLOBAL_REGISTRY</span>
              </div>
            </div>
          </div>

          {/* Industrial Search Bar */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl flex gap-2 shadow-2xl focus-within:border-cyan-500/50 transition-colors">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  placeholder="QUERY REGISTRY (NPM, PYPI, CARGO...)"
                  value={engineQuery}
                  onChange={(e) => setEngineQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && engineQuery && searchPackages(frameworks[0]?.package_manager || 'npm')}
                  className="pl-16 h-14 bg-transparent border-none focus:ring-0 text-white font-mono text-sm placeholder:text-slate-600 uppercase tracking-widest"
                />
              </div>
              <Button
                onClick={() => searchPackages(frameworks[0]?.package_manager || 'npm')}
                disabled={systemBusy || !engineQuery}
                className="bg-cyan-600 hover:bg-cyan-500 text-white h-14 px-10 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)] active:scale-95 disabled:opacity-20"
              >
                {systemBusy ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Run Query"}
              </Button>
            </div>
          </div>

          {/* Results Grid - Command Line Style */}
          <AnimatePresence mode="wait">
            {searchResults && searchResults.length > 0 ? (
              <motion.div
                key="results"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {searchResults.map((pkg, i) => {
                  const installState = installingPackages.get(pkg.name);
                  const isInstalling = !!installState;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`bg-slate-900/40 border ${isInstalling ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-800'} rounded-2xl p-5 hover:border-cyan-500/30 transition-all group/pkg relative overflow-hidden`}
                    >
                      {/* Installation Progress Overlay */}
                      {isInstalling && (
                        <motion.div 
                          className="absolute bottom-0 left-0 h-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-20"
                          initial={{ width: 0 }}
                          animate={{ width: `${installState.progress}%` }}
                        />
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-white tracking-tight truncate mb-1">{pkg.name}</h4>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block font-mono">
                            {isInstalling ? (
                              <span className="text-cyan-400 animate-pulse">DEPLOYING {installState.progress}%</span>
                            ) : `v${pkg.version}`}
                          </span>
                        </div>
                        <button
                          disabled={isInstalling}
                          onClick={() => installPackage(frameworks[0]?.package_manager || 'npm', pkg.name, null)}
                          className={`w-10 h-10 rounded-xl ${isInstalling ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-cyan-600 hover:text-white'} flex items-center justify-center transition-all active:scale-90 shadow-sm border border-slate-700/50 hover:border-cyan-400`}
                        >
                          {isInstalling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                      </div>

                      {isInstalling ? (
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">
                              {installState.throughput || 'Streaming Data...'}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-400 truncate bg-slate-950/50 p-1.5 rounded-md border border-slate-800/50">
                            {installState.lastLog || 'Initializing Protocol...'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 line-clamp-2 font-medium leading-relaxed mb-4 uppercase tracking-wider">
                          {pkg.description || 'System metadata missing'}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1 h-1 rounded-full ${isInstalling ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)]'}`} />
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                            {isInstalling ? 'Atomic Install Active' : 'Stable Release'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : engineQuery && !systemBusy && (
              <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">No valid signatures found in registry</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>


      {/* Stats Bento Grid */}
      {systemResult && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Main Stat Card */}
          <motion.div
            variants={staggerItem}
            className="md:col-span-2 bg-white rounded-[2rem] p-6 border border-indigo-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Package className="w-32 h-32 rotate-12 text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">System Stats</span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-[48px] font-black text-purple-600 leading-none tracking-tighter font-sans">
                  <AnimatedCounter value={systemResult.packages?.length || 0} />
                </div>
                <span className="text-slate-400 font-black text-lg mb-1.5 font-sans tracking-tighter">Packages</span>
              </div>
              <p className="text-slate-400 font-bold text-[10px] tracking-tight max-w-[180px] leading-relaxed uppercase">
                Global packages detected on your system.
              </p>
            </div>
          </motion.div>

          {/* Secondary Stats */}
          <motion.div
            variants={staggerItem}
            className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-indigo-200 transition-all relative border-b-[2px] border-b-indigo-500/30 hover:border-b-indigo-500"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Storage Used</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">
                {formatBytes(systemResult.total_size || 0)}
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-emerald-200 transition-all relative border-b-[2px] border-b-emerald-500/30 hover:border-b-emerald-500"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Active Engines</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-emerald-600 tracking-tighter leading-none">
                <AnimatedCounter value={Object.keys(groupedPackages).length} />
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Filter Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
          <Input
            placeholder="Search global tools & packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 h-16 bg-white border border-slate-100 focus:border-purple-200 rounded-2xl text-[15px] font-bold shadow-sm font-sans placeholder:text-slate-300 transition-all"
          />
        </div>
      </motion.div>


      {/* Package List - Expandable Cards */}
      {!systemResult && busy ? (
        <div className="flex flex-col items-center justify-center pt-24 pb-48 relative overflow-hidden">
          {/* 3D Radar Wrapper */}
          <div className="relative w-64 h-64 mb-16 [perspective:1000px] flex items-center justify-center">
            <motion.div
              className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 55 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {/* Concentric Pulses with Depth */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-indigo-500/30 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  initial={{ scale: 0.5, opacity: 0, translateZ: 0 }}
                  animate={{
                    scale: 1.8,
                    opacity: [0, 0.6, 0],
                    translateZ: i * 20
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.2,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Main Radar Disc (Glass Floor) */}
              <div className="absolute inset-[-20%] rounded-full border-4 border-white/80 bg-gradient-to-b from-indigo-50/40 to-white/10 backdrop-blur-sm shadow-[0_20px_50px_rgba(99,102,241,0.1)] [transform:translateZ(-10px)]" />
              <div className="absolute inset-0 rounded-full border-2 border-slate-200/50 [transform:translateZ(0px)]" />

              {/* Rotating 3D Sweep */}
              <motion.div
                className="absolute inset-[-10%] rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(99, 102, 241, 0.3) 15%, transparent 25%)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.1)'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />

              {/* Internal Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-[1px] bg-indigo-500 absolute" />
                <div className="h-full w-[1px] bg-indigo-500 absolute" />
                <div className="w-full h-full rounded-full border border-indigo-200" />
                <div className="w-2/3 h-2/3 rounded-full border border-indigo-200" />
                <div className="w-1/3 h-1/3 rounded-full border border-indigo-200" />
              </div>

              {/* Holographic Center Core */}
              <div className="relative z-50">
                <motion.div
                  className="w-5 h-5 rounded-full bg-indigo-600 shadow-[0_0_25px_rgba(99,102,241,0.8)] border-2 border-white"
                  animate={{
                    translateZ: [0, 15, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Ground Shadow */}
            <div className="absolute bottom-[-10%] w-[80%] h-8 bg-black/5 blur-2xl rounded-full translate-y-12" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <h3 className="text-slate-900 font-black text-xl tracking-tight">Active Scan</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Inventorying Global Binaries...</p>
          </div>
        </div>
      ) : !systemResult ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <Cpu className="w-12 h-12 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900 mb-2">Inventory Offline</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Run scan to detect system environments</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {Object.entries(filteredGroups).map(([manager, pkgs]) => {
            const meta = managerLabels[manager] || managerLabels.unknown
            const isExpanded = expandedManagers.has(manager)
            const techIcon = getTechIcon(meta.tech)

            return (
              <motion.div
                key={manager}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-purple-100"
              >
                {/* Manager Header Bar */}
                <div
                  onClick={() => toggleManager(manager)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center p-2.5 shadow-inner`}>
                      {techIcon.image ? (
                        <img src={techIcon.image} className="w-full h-full object-contain" alt={manager} />
                      ) : (
                        <span className={`font-black text-xl ${meta.color}`}>{meta.icon}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                        {meta.label}
                        <Badge className="bg-purple-50 text-purple-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest">Live</Badge>
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pkgs.length} Packages</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {formatBytes(pkgs.reduce((sum, p) => sum + (p.size || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex -space-x-3 overflow-hidden">
                      {pkgs.slice(0, 4).map((p, i) => {
                        const icon = getTechIcon(p.name);
                        const stackColors = [
                          'bg-indigo-50',
                          'bg-indigo-100',
                          'bg-indigo-200',
                          'bg-indigo-300'
                        ];
                        return (
                          <div key={i} className={`inline-block h-8 w-8 rounded-full ring-4 ring-white ${stackColors[i] || 'bg-slate-50'} flex items-center justify-center border border-slate-100/50 shadow-sm`} />
                        )
                      })}
                      {pkgs.length > 4 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white shadow-lg z-10">
                          +{pkgs.length - 4}
                        </div>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Expandable Package Grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="p-6 pt-0 border-t-2 border-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-6">
                          {pkgs.map((pkg, i) => {
                            const pkgIcon = getPackageIcon(pkg.name);
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                                className="group relative p-5 bg-white border border-slate-100 rounded-[1.5rem] transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 border-b-4 border-b-slate-100 hover:border-b-indigo-500 flex flex-col justify-between"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center p-2 border border-slate-100 group-hover:scale-110 transition-transform shadow-inner shrink-0">
                                      {pkgIcon.image ? (
                                        <img src={pkgIcon.image} className="w-full h-full object-contain" />
                                      ) : (
                                        <span className="text-[12px] font-black text-slate-400">{pkg.name[0].toUpperCase()}</span>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-black text-slate-900 text-[14px] tracking-tight truncate leading-tight mb-1">{pkg.name}</h4>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatBytes(pkg.size)}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {recentGlobals.includes(pkg.name) && (
                                      <Badge className="bg-red-600 text-white border-none font-black text-[7px] px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">New</Badge>
                                    )}
                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-mono text-[9px] px-2 py-0.5 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                      v{pkg.version}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                                  <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-[0.15em]">
                                    <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                                    Verified Runtime
                                  </div>
                                  <button
                                    onClick={() => deletePackage(manager, pkg.name)}
                                    className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
      <Toaster position="bottom-right" richColors theme="dark" />
    </div>
  )
}

export default SystemPackagesView
