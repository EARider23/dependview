import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, Download, RefreshCw, Cpu, HardDrive, Trash2, Box } from 'lucide-react'
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
    npm: { label: 'NPM Global', color: 'bg-red-50 text-red-600', border: 'border-red-100', icon: 'N' },
    pip: { label: 'Python (pip)', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100', icon: 'P' },
    cargo: { label: 'Rust (cargo)', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100', icon: 'C' },
    gem: { label: 'Ruby (gem)', color: 'bg-pink-50 text-pink-600', border: 'border-pink-100', icon: 'G' },
    unknown: { label: 'Other', color: 'bg-gray-50 text-gray-600', border: 'border-gray-100', icon: '?' },
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      >
        <div>
          <h2 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">System <span className="text-purple-600">Packages</span></h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Globally installed dependencies across package managers</p>
        </div>
        <Button
          onClick={scanSystemPackages}
          disabled={busy}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/20 px-8 h-12 rounded-xl font-black text-[11px] uppercase tracking-widest no-hover"
        >
          {busy ? (
            <><RefreshCw className="w-4 h-4 mr-3 animate-spin" /> Scanning...</>
          ) : (
            <><Cpu className="w-4 h-4 mr-3" /> Refresh Scan</>
          )}
        </Button>
      </motion.div>

      {/* Stats Area — with stagger + AnimatedCounter */}
      {systemResult && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: 'Total Packages', value: systemResult.packages?.length || 0, isNum: true, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Total Disk Usage', value: formatBytes(systemResult.total_size || 0), isNum: false, icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Managers', value: Object.keys(groupedPackages).length, isNum: true, icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="glass-card rounded-[2rem] p-8 flex flex-col items-center text-center"
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 shadow-sm`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              >
                <stat.icon className="w-7 h-7" />
              </motion.div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <div className={`text-3xl font-black ${stat.color} tracking-tight`}>
                {stat.isNum ? <AnimatedCounter value={stat.value} /> : stat.value}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filter Section */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 22 }}
      >
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <Input
            placeholder="Search system dependencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-white/80 backdrop-blur-md border-gray-100 rounded-2xl text-base font-bold shadow-sm"
          />
        </div>
      </motion.div>

      {/* Package List */}
      {!systemResult && busy ? (
        <div className="text-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-12 h-12 text-purple-200 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Scanning Global Toolchain...</p>
        </div>
      ) : !systemResult ? (
        <div className="text-center py-32 glass-card rounded-[2.5rem]">
          <Cpu className="w-12 h-12 text-purple-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Scanner Offline</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Run system scan to identify global packages</p>
        </div>
      ) : (
        <div className="space-y-12 pb-20">
          {Object.entries(filteredGroups).map(([manager, pkgs]) => {
            const meta = managerLabels[manager] || managerLabels.unknown
            return (
              <motion.div
                key={manager}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                <div className="flex items-center gap-3 mb-6 px-2">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900">{meta.label}</h3>
                  <Badge className={`${meta.color} border-0 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest`}>
                    {pkgs.length} Items
                  </Badge>
                </div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {pkgs.map((pkg, i) => (
                    <motion.div
                      key={i}
                      variants={staggerItem}
                      whileHover={{ y: -2 }}
                      className="glass-card shimmer-hover rounded-2xl p-5 flex items-center justify-between group hover:bg-white/70 transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <motion.div
                          className={`w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center font-black text-xl shadow-inner`}
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          {meta.icon}
                        </motion.div>
                        <div>
                          <h4 className="font-black text-gray-900 leading-none mb-1">{pkg.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest">v{pkg.version}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatBytes(pkg.size)}</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-9 h-9 rounded-lg bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 no-hover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SystemPackagesView
