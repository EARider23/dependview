import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Rocket, Zap, Shield, Gift, Star } from 'lucide-react'

const UPDATES = [
  {
    id: 1,
    version: 'v0.5.0',
    date: 'Just now',
    title: 'Cinematic Onboarding & Reveal',
    description: 'Added a jaw-dropping Apple-style Z-axis onboarding sequence and a smooth dashboard reveal transition.',
    icon: Rocket,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    isCommunityRequest: false,
    tags: ['UI/UX', 'Animation']
  },
  {
    id: 2,
    version: 'v0.4.1',
    date: 'Yesterday',
    title: 'Word-by-word Greeting Sync',
    description: 'Fixed the greeting sync issues to ensure perfectly timed cinematic text blurring.',
    icon: Shield,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    isCommunityRequest: true,
    tags: ['Bugfix', 'Refinement']
  },
  {
    id: 3,
    version: 'v0.4.0',
    date: '2 days ago',
    title: 'New Dashboard View Modes',
    description: 'Introduced Grid, List, and Stack view modes for managing your projects with fluid spring animations.',
    icon: Zap,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    isCommunityRequest: true,
    tags: ['Feature', 'Workflow']
  }
]

export function WhatsNewDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0e0e11] shadow-[0_0_80px_rgba(0,0,0,0.3)] z-[310] flex flex-col border-l border-white/20 dark:border-white/5"
          >
            {/* Header */}
            <div className="px-6 py-8 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                      What's New
                    </h2>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-0.5">
                      Changelog & Updates
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
              <div className="space-y-8 relative">
                
                {/* Vertical Timeline Line */}
                <div className="absolute left-[19px] top-2 bottom-0 w-px bg-gray-200 dark:bg-white/10" />

                {UPDATES.map((update, idx) => (
                  <motion.div 
                    key={update.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx, type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative pl-12 group"
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white dark:border-[#0e0e11] ${update.iconBg} flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                      <update.icon className={`w-4 h-4 ${update.iconColor}`} />
                    </div>

                    {/* Content Card */}
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-5 hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-md">
                            {update.version}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {update.date}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {update.title}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                        {update.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {update.isCommunityRequest && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200 dark:border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Community Request
                          </div>
                        )}
                        {update.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}

              </div>
              
              {/* End of Line Indicator */}
              <div className="mt-8 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
                Peeak stays magically up to date. You are running the latest version.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
