import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, HardDrive, History, Trash2, ArrowLeft, Package, RefreshCw, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import AnimatedCounter from '../components/AnimatedCounter'

import { useMaintenance } from '../hooks/useMaintenance'

const MaintenanceView = ({ 
  projects,
  setCurrentProject,
  setViewMode,
  showToast,
  formatBytes
}) => {
  const {
    maintenanceResult,
    isAnalyzing,
    runMaintenance,
    handleCleanCache,
    handleCleanAllCaches
  } = useMaintenance(projects, showToast)

  return (
    <motion.div
      key="maintenance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">Smart <span className="text-purple-600">Maintenance</span> Hub</h2>
          <p className="text-gray-500 font-medium text-lg italic">Optimize system performance and reclaim storage space</p>
        </div>
        <Button
          onClick={runMaintenance}
          disabled={isAnalyzing}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/20 px-8 h-14 rounded-2xl font-black text-[13px] uppercase tracking-widest no-hover"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 mr-3" /> Start Health Check
            </>
          )}
        </Button>
      </div>

      {!maintenanceResult ? (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 border border-purple-50 relative z-10 group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Diagnostic Engine Ready</h3>
          <p className="text-gray-400 max-w-sm mx-auto font-medium relative z-10">Scan your workspace to find unused dependencies and clear redundant system caches.</p>
        </div>
      ) : (
        <>
          {/* Maintenance Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                <HardDrive className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cache Recoverable</p>
              <div className="text-3xl font-black text-blue-600 flex items-baseline gap-1">
                <AnimatedCounter value={maintenanceResult.caches.reduce((s, c) => s + c.size, 0) / (1024 * 1024)} />
                <span className="text-sm">MB</span>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 shadow-inner">
                <History className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Unused Packages</p>
              <div className="text-3xl font-black text-pink-600">
                <AnimatedCounter value={maintenanceResult.unused_packages.length} />
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 shadow-inner">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Health Score</p>
              <div className="text-3xl font-black text-purple-600">
                <AnimatedCounter value={Math.max(0, 100 - maintenanceResult.unused_packages.length)} />
                <span className="text-sm font-black text-purple-300">/100</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-4">Action Required</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCleanAllCaches}
                className="w-full h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all no-hover"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Full System Purge
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* System Cache Column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><HardDrive className="text-blue-500" /> Toolchain Caches</h3>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-bold">{maintenanceResult.caches.length} Sources</Badge>
              </div>
              <div className="space-y-4">
                {maintenanceResult.caches.map((cache, i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 flex items-center justify-between group hover:bg-white/80 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                        <Package className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-gray-900">{cache.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{formatBytes(cache.size)}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{cache.path}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCleanCache(cache.path)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Unused Dependencies List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight"><History className="text-pink-500" /> Dead Dependencies</h3>
                <Badge variant="secondary" className="bg-pink-50 text-pink-600 font-bold">{maintenanceResult.unused_packages.length} Detected</Badge>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-100">
                {maintenanceResult.unused_packages.length === 0 ? (
                  <div className="text-center py-20 bg-pink-50/50 rounded-[3rem] border border-pink-100 text-pink-600">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-black text-lg">Perfect Hygiene!</p>
                    <p className="text-sm font-medium opacity-70">No unused packages found in your workspace.</p>
                  </div>
                ) : (
                  maintenanceResult.unused_packages.map((pkg, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center justify-between hover:border-pink-200 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-inner group-hover:scale-110 transition-transform">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900">{pkg.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter border-pink-100 text-pink-500">{pkg.project_name}</Badge>
                            <span className="text-[10px] text-gray-400 font-medium italic">Not imported in source</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const found = projects.find(p => p.path === pkg.path);
                          if (found) {
                            setCurrentProject(found);
                            setViewMode('project');
                            showToast(`Selected ${pkg.project_name} for cleanup`, 'info');
                          }
                        }}
                        className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-90"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="pb-20"></div>
    </motion.div>
  )
}

export default MaintenanceView
