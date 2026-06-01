import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Coffee, Twitter, Github, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react'

// You can swap this out with your actual hero image/illustration
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'

const PATCH_LOGS = [
  {
    title: 'Cinematic Onboarding Sequence',
    description: 'A completely redesigned introduction experience featuring Z-axis transitions and spatial design elements.',
    type: 'Feature'
  },
  {
    title: 'Multi-View Project Dashboard',
    description: 'Toggle between List, Grid, and Stack views for ultimate organization and flexibility.',
    type: 'Feature'
  },
  {
    title: 'Word-by-word Greeting Sync',
    description: 'Resolved animation timing issues that caused overlapping text during the initial load sequence.',
    type: 'Fix'
  },
  {
    title: 'Glassmorphism Performance',
    description: 'Optimized backdrop filters across the app to reduce GPU overhead on older machines.',
    type: 'Optimization'
  }
]

export function LaunchModal({ open, onComplete }) {
  const [slide, setSlide] = useState(0)

  if (!open) return null

  const handleNext = () => {
    setSlide(1)
  }

  const handleFinish = () => {
    setSlide(0)
    onComplete()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[400] flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0e0e11] rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
        >
          {/* Close Button */}
          <button
            onClick={handleFinish}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/20 text-white dark:text-white hover:bg-black/10 dark:hover:bg-white/30 transition-colors z-50"
          >
            <X className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {slide === 0 ? (
              <motion.div
                key="slide1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-56 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={HERO_IMAGE_URL}
                    alt="Update Hero"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0e0e11] to-transparent" />
                </div>

                {/* Content Section */}
                <div className="p-8 pt-0 flex flex-col items-center text-center relative z-10 -mt-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3 h-3" />
                    Version 1.0 is here
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                    Welcome to Peeak.
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm">
                    We've poured our hearts into this update. If you enjoy using Peeak and want to support its continued development, consider buying us a coffee or following our journey!
                  </p>

                  <div className="flex flex-col gap-4 w-full max-w-sm mb-8">
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-[#FFDD00] hover:bg-[#FFEA54] text-black rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      <Coffee className="w-5 h-5" />
                      Buy me a coffee
                    </a>

                    <div className="flex items-center justify-center gap-3">
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold hover:gap-3 transition-all"
                  >
                    See what's new in v1.0
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="slide2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-[550px]"
              >
                <div className="p-8 pb-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Update & Patch Logs
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Everything new in this major release.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                  <div className="space-y-6">
                    {PATCH_LOGS.map((log, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="mt-1">
                          {log.type === 'Feature' ? (
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          ) : log.type === 'Optimization' ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Rocket className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {log.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            {log.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex-shrink-0">
                  <button
                    onClick={handleFinish}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 flex items-center justify-center gap-2"
                  >
                    Awesome, let's go!
                    <Rocket className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
