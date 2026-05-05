import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Search, 
  Download, 
  RefreshCw, 
  Box, 
  Cpu, 
  Terminal, 
  Binary, 
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { getTechIcon } from '../assets/iconLinks'
import { useSystem } from '../hooks/useSystem'


const FrameworksView = ({ currentProject, showToast }) => {
  const {
    frameworks,
    busy,
    searchQuery,
    setSearchQuery,
    searchResults,
    detectFrameworks,
    searchPackages,
    installPackage
  } = useSystem(showToast)

  // Auto-detect on mount
  React.useEffect(() => {
    if (frameworks.length === 0 && !busy) {
      detectFrameworks()
    }
  }, [])

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
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center">
              Global <span className="text-purple-600 ml-1">Runtimes</span>
            </h2>
            <motion.div
              className="bg-purple-50 px-2 h-5 rounded-md border border-purple-100 hidden sm:flex items-center justify-center ml-3 translate-y-[2px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">Verified Toolchain</span>
            </motion.div>
          </div>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-2">
            Core Development Environments & Compilers
          </p>
        </div>
        
        <Button
          onClick={detectFrameworks}
          disabled={busy}
          size="lg"
          className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 rounded-xl transition-all active:scale-95 font-bold no-hover"
        >
          {busy ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Terminal className="w-4 h-4 mr-2" /> Refresh Runtimes</>
          )}
        </Button>
      </motion.div>


      {/* Framework Bento Grid */}
      {frameworks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {frameworks.map((fw, i) => {
            if (!fw || !fw.name) return null;
            const name = fw.name || 'Unknown';
            const manager = fw.package_manager || 'npm';
            const techInfo = getTechIcon(name.toLowerCase());
            
            return (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:border-indigo-200 transition-all cursor-default relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   <Binary className="w-32 h-32" />
                </div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-50 p-3"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {techInfo.image ? (
                      <img src={techInfo.image} alt={name} className="w-full h-full object-contain" />
                    ) : (
                      <div className={`w-full h-full rounded-xl ${techInfo.color || 'bg-slate-100'} flex items-center justify-center text-white font-black text-xl`}>
                        {techInfo.icon || name.charAt(0)}
                      </div>
                    )}
                  </motion.div>
                  <Badge className="bg-purple-50 text-purple-600 border border-purple-100 px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-widest">
                    {manager.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="relative z-10">
                  <h4 className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-2">{name}</h4>
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      {fw.version?.startsWith('v') ? fw.version : `v${fw.version}`}
                    </span>
                  </div>
                </div>
                
                <div className="pt-6 border-t-2 border-slate-50 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                      <motion.div 
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      Active Runtime
                   </div>
                   <button className="flex items-center gap-1 text-[9px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-widest no-hover group/btn">
                      System Path
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                   </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <motion.div 
          className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 mb-12"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
           <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-6 border border-slate-50">
             <Cpu className="w-8 h-8 text-slate-200" />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">Runtime Detection Required</h3>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Scan your local system to identify runtimes</p>
        </motion.div>
      )}

      {/* Global Registry / Installer Card */}
      <motion.div 
        className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl shadow-indigo-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {/* Subtle Scanline Effect Overlay (Matching ProjectDetails) */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
           <Package className="w-48 h-48 text-white rotate-12" />
        </div>

        {/* Tactical Header (Matching ProjectDetails Storage Insights) */}
        <div className="flex items-center justify-between mb-12 relative px-2">
          <motion.div
            initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.25em] leading-none">External</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] pl-3.5">Global Source</span>
          </motion.div>

          <div className="flex-1 mx-16 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-white/10" />
            </div>
            <div className="relative z-20 bg-slate-900 px-10 py-3 border border-white/10 rounded-full shadow-sm">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-3">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                Global Package Registry
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-end gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.25em] leading-none">Internal</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] pr-3.5">Local Sink</span>
          </motion.div>
        </div>


        <div className="flex gap-4 mb-10 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
                placeholder="Search global registries (NPM, PyPI, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 h-16 bg-white/5 border-white/10 focus:border-white/20 rounded-[1.25rem] font-bold text-base text-white placeholder:text-white/20 transition-all backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={() => searchPackages(frameworks[0]?.package_manager || 'npm')}
            disabled={busy || !searchQuery}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-16 px-10 rounded-[1.25rem] font-black text-[12px] uppercase tracking-[0.15em] no-hover transition-all shadow-lg shadow-indigo-500/20"
          >
            Search Engine
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {searchResults && searchResults.length > 0 ? (
            <motion.div 
              key="results"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {searchResults.map((pkg, i) => (
                <motion.div 
                  key={i} 
                  variants={staggerItem}
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition-all group/res"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-white mb-2 tracking-tight">{pkg.name}</h4>
                      <p className="text-sm text-white/40 mb-6 line-clamp-2 leading-relaxed font-medium">{pkg.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => installPackage(frameworks[0]?.package_manager || 'npm', pkg.name, currentProject)}
                      className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest no-hover shadow-lg"
                    >
                      <Download className="w-4 h-4 mr-2" /> Install
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : searchQuery && !busy && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 relative z-10"
            >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                   <Box className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/20 font-black text-[11px] uppercase tracking-[0.2em]">Searching repositories...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default FrameworksView
