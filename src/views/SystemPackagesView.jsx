import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { getTechIcon } from '../assets/iconLinks'
import { isTauri, mockInvoke } from '../lib/browserMock'
import AnimatedCounter from '../components/AnimatedCounter'

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
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center">
              System <span className="text-purple-600 ml-1">Inventory</span>
            </h2>
            <motion.div
              className="bg-purple-50 px-2 h-5 rounded-md border border-purple-100 hidden sm:flex items-center justify-center ml-3 translate-y-[2px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">Global Toolchain</span>
            </motion.div>
          </div>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-2">
            Runtime & Global Package Analysis
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
            Refresh Inventory
          </Button>
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
            className="md:col-span-2 bg-white rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Package className="w-40 h-40 rotate-12 text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Environment Metrics</span>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-[64px] font-black text-purple-600 leading-none tracking-tighter font-sans">
                  <AnimatedCounter value={systemResult.packages?.length || 0} />
                </div>
                <span className="text-slate-400 font-black text-xl mb-2 font-sans tracking-tighter">Packages</span>
              </div>
              <p className="text-slate-400 font-bold text-[11px] tracking-tight max-w-[200px] leading-relaxed uppercase">
                Registered binary modules detected across system runtimes.
              </p>
            </div>
          </motion.div>

          {/* Secondary Stats */}
          <motion.div
            variants={staggerItem}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-indigo-200 transition-all relative border-l-[2px] border-l-indigo-500/30 hover:border-l-indigo-500"
          >
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Disk Footprint</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">
                {formatBytes(systemResult.total_size || 0)}
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden hover:border-emerald-200 transition-all relative border-l-[2px] border-l-emerald-500/30 hover:border-l-emerald-500"
          >
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Active Runtimes</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">
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
            placeholder="Search through global toolchain inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 h-16 bg-white border border-slate-100 focus:border-purple-200 rounded-2xl text-[15px] font-bold shadow-sm font-sans placeholder:text-slate-300 transition-all"
          />
        </div>
      </motion.div>


      {/* Package List - Expandable Cards */}
      {!systemResult && busy ? (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mb-4"
          >
            <RefreshCw className="w-10 h-10 text-slate-200" />
          </motion.div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Inventorying Global Binaries...</p>
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
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-purple-100"
              >
                {/* Manager Header Bar */}
                <div
                  onClick={() => toggleManager(manager)}
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[1.25rem] ${meta.bg} flex items-center justify-center p-3 shadow-inner`}>
                      {techIcon.image ? (
                        <img src={techIcon.image} className="w-full h-full object-contain" alt={manager} />
                      ) : (
                        <span className={`font-black text-xl ${meta.color}`}>{meta.icon}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                        {meta.label}
                        <Badge className="bg-purple-50 text-purple-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest">Global</Badge>
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pkgs.length} Modules</span>
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
                        return (
                          <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                            {icon.image ? <img src={icon.image} className="w-4 h-4 object-contain" /> : <span className="text-[8px] font-black">{p.name[0]}</span>}
                          </div>
                        )
                      })}
                      {pkgs.length > 4 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
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
                            const pkgIcon = getTechIcon(pkg.name);
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                                className="p-4 bg-white rounded-2xl border border-slate-100 hover:bg-purple-50/30 hover:border-purple-200 transition-all group shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-inner flex items-center justify-center p-1.5 border border-slate-100">
                                      {pkgIcon.image ? (
                                        <img src={pkgIcon.image} className="w-full h-full object-contain" />
                                      ) : (
                                        <span className="text-[10px] font-black text-slate-400">{pkg.name[0].toUpperCase()}</span>
                                      )}
                                    </div>
                                    <h4 className="font-black text-slate-800 text-[13px] tracking-tight truncate max-w-[120px]">{pkg.name}</h4>
                                  </div>
                                  <Badge className="bg-purple-50 text-purple-600 border-none font-mono text-[9px] px-2 py-0.5 rounded-md">
                                    v{pkg.version}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{formatBytes(pkg.size)}</span>
                                  <button
                                    onClick={() => deletePackage(manager, pkg.name)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors no-hover"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  )
}

export default SystemPackagesView
