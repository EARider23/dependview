import React from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import frameworkIcon from '../assets/interfaceicons/framework.svg'
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
    installingPackage,
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
              <img src={frameworkIcon} className="w-4 h-4 brightness-0 invert" alt="Framework" />
              {/* <Cpu className="w-4 h-4 text-white" /> */}
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

      <Toaster position="bottom-right" richColors theme="dark" />
    </div>
  )
}

export default FrameworksView
