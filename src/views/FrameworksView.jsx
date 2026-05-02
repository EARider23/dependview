import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, Download, RefreshCw, Box, Cpu } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { getTechIcon } from '../assets/iconLinks'
import { useSystem } from '../hooks/useSystem'

// Stagger variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
}
const staggerItem = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  },
}

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
          <h2 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">Installed <span className="text-purple-600">Frameworks</span></h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Global Runtime & Development Environments</p>
        </div>
        <Button
          onClick={detectFrameworks}
          disabled={busy}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/20 px-8 h-12 rounded-xl font-black text-[12px] uppercase tracking-widest no-hover"
        >
          {busy ? (
            <><RefreshCw className="w-4 h-4 mr-3 animate-spin" /> Detecting...</>
          ) : (
            <><Box className="w-4 h-4 mr-3" /> Detect Runtimes</>
          )}
        </Button>
      </motion.div>

      {/* Framework Grid — with stagger */}
      {frameworks.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {frameworks.map((fw, i) => {
            const techInfo = getTechIcon(fw.name.toLowerCase())
            return (
              <motion.div 
                key={i} 
                variants={staggerItem}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="glass-card shimmer-hover rounded-[2rem] p-6 group hover:bg-white/70 cursor-default"
              >
                <div className="flex justify-between items-start mb-6">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-gray-50 overflow-hidden p-3"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    {techInfo.image ? (
                      <img src={techInfo.image} alt={fw.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className={`w-full h-full rounded-xl ${techInfo.color || 'bg-gray-100'} flex items-center justify-center text-white font-black text-xl`}>
                        {techInfo.icon || fw.name.charAt(0)}
                      </div>
                    )}
                  </motion.div>
                  <Badge className="bg-purple-50 text-purple-600 border border-purple-100/50 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest">
                    {fw.package_manager.toUpperCase()}
                  </Badge>
                </div>
                
                <h4 className="font-black text-2xl mb-1 text-gray-900 tracking-tight">{fw.name}</h4>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest px-2.5 py-1 bg-purple-50 rounded-md border border-purple-100/50">
                    {fw.version?.startsWith('v') ? fw.version : `v${fw.version}`}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                      <motion.div 
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      Detected
                   </div>
                   <button className="text-[9px] font-black text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest no-hover">
                      Runtime Info
                   </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-24 glass-card rounded-[2.5rem] mb-12"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
        >
           <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-6 border border-purple-50 glass-pulse">
             <Cpu className="w-8 h-8 text-purple-600" />
           </div>
           <h3 className="text-xl font-black text-gray-900 mb-2">Framework Viewport</h3>
           <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Run detection to identify system frameworks</p>
        </motion.div>
      )}

      {/* Package Installer / Global Registry */}
      <motion.div 
        className="glass-card rounded-[2.5rem] p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 22 }}
      >
        <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
                <Search className="w-5 h-5" />
            </motion.div>
            <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Global Registry</h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-none">Find and install global utility packages</p>
            </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                placeholder="Search packages (e.g., react, tailwind, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-gray-100 rounded-xl font-bold text-sm"
            />
          </div>
          <Button
            onClick={() => searchPackages(frameworks[0]?.package_manager || 'npm')}
            disabled={busy || !searchQuery}
            className="bg-gray-900 hover:bg-black text-white h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest no-hover"
          >
            Search Registry
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {searchResults && searchResults.length > 0 ? (
            <motion.div 
              key="results"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {searchResults.map((pkg, i) => (
                <motion.div 
                  key={i} 
                  variants={staggerItem}
                  whileHover={{ y: -2 }}
                  className="bg-white/80 rounded-2xl p-5 border border-gray-50 hover:border-purple-200 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-gray-900 mb-1">{pkg.name}</h4>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{pkg.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => installPackage(frameworks[0]?.package_manager || 'npm', pkg.name, currentProject)}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-9 px-4 font-black text-[9px] uppercase tracking-widest no-hover"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" /> Install
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
              className="text-center py-10"
            >
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Type to search the global registry</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default FrameworksView
