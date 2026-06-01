import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Zap, Package, Shield, ArrowRight, Sparkles } from 'lucide-react'

const GREETINGS = ['Hello.', 'Bonjour.', 'Hola.', 'Ciao.', 'नमस्ते.', 'வணக்கம்.', 'こんにちは.', '你好.', 'سلام.', 'Welcome.']

const SLIDES = [
  {
    id: 'welcome',
    icon: Zap,
    image: '',
    title: 'Welcome to Peeak.',
    highlight: 'Peeak',
    description: 'The fastest, smartest way to manage your project dependencies, system packages, and frameworks.',
    aurora: ['#4c1d95', '#7c3aed', '#2563eb'] // Deep Purples & Blues
  },
  {
    id: 'analyze',
    icon: Package,
    image: '',
    title: 'Analyze Instantly.',
    highlight: 'Instantly',
    description: 'Scan your entire workspace in milliseconds. Discover abandoned packages and heavy dependencies before they slow you down.',
    aurora: ['#1e3a8a', '#3b82f6', '#06b6d4'] // Ocean Blues & Cyans
  },
  {
    id: 'secure',
    icon: Shield,
    image: '',
    title: 'Secure by Default.',
    highlight: 'Default',
    description: 'Identify vulnerabilities and outdated frameworks safely. Keep your systems running smoothly with zero effort.',
    aurora: ['#064e3b', '#10b981', '#34d399'] // Emeralds & Greens
  }
]

export function OnboardingModal({ open, onComplete }) {
  const [greetingIndex, setGreetingIndex] = useState(-1)
  const [showMainContent, setShowMainContent] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Cinematic greeting sequence
  useEffect(() => {
    if (!open) {
      setGreetingIndex(-1)
      setShowMainContent(false)
      setCurrentSlide(0)
      return
    }

    if (greetingIndex === -1 && !showMainContent) {
      const timer = setTimeout(() => {
        setGreetingIndex(0)
      }, 1000) // 1 second delay before "Hello."
      return () => clearTimeout(timer)
    } else if (greetingIndex >= 0 && greetingIndex < GREETINGS.length - 1 && !showMainContent) {
      const timer = setTimeout(() => {
        setGreetingIndex(prev => prev + 1)
      }, 800) // Change greeting every 800ms
      return () => clearTimeout(timer)
    } else if (greetingIndex === GREETINGS.length - 1 && !showMainContent) {
      // Sequence finished, hold Welcome for 2000ms
      const timer = setTimeout(() => {
        setShowMainContent(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [greetingIndex, open, showMainContent])

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => {
    onComplete()
  }

  if (!open) return null

  // Z-Axis Spatial Animation Variants
  const spatialVariants = {
    enter: {
      scale: 0.7,
      opacity: 0,
      filter: 'blur(30px)',
      z: -500
    },
    center: {
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      z: 0
    },
    exit: {
      scale: 1.5,
      opacity: 0,
      filter: 'blur(20px)',
      z: 500
    }
  }

  // Calculate circular progress percentage
  const progress = ((currentSlide + 1) / SLIDES.length) * 100
  const circleRadius = 24
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circleCircumference - (progress / 100) * circleCircumference

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] overflow-hidden bg-black font-sans perspective-1000">

        {/* Apple-style Cinematic Greetings */}
        <AnimatePresence mode="wait">
          {!showMainContent && greetingIndex >= 0 && (
            <motion.div
              key={greetingIndex}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center bg-black z-[250]"
            >
              <h1 
                className="text-6xl md:text-8xl font-black text-white tracking-tighter"
                style={{ fontFamily: 'inherit, "Segoe UI", "Nirmala UI", "Microsoft YaHei", "Yu Gothic UI", "Meiryo", sans-serif' }}
              >
                {GREETINGS[greetingIndex]}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JAW-DROPPING SPATIAL Z-AXIS SLIDES */}
        <AnimatePresence>
          {showMainContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >

              {/* FLUID AURORA BOREALIS BACKGROUND */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`aurora-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                  >
                    {/* Orb 1 */}
                    <motion.div
                      animate={{
                        x: [0, 100, -100, 0],
                        y: [0, -100, 100, 0],
                        scale: [1, 1.2, 0.8, 1]
                      }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[140px] mix-blend-screen"
                      style={{ backgroundColor: SLIDES[currentSlide].aurora[0] }}
                    />
                    {/* Orb 2 */}
                    <motion.div
                      animate={{
                        x: [0, -150, 100, 0],
                        y: [0, 150, -50, 0],
                        scale: [1, 1.5, 0.9, 1]
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute bottom-[10%] right-[10%] w-[60vw] h-[60vw] rounded-full blur-[160px] mix-blend-screen"
                      style={{ backgroundColor: SLIDES[currentSlide].aurora[1] }}
                    />
                    {/* Orb 3 */}
                    <motion.div
                      animate={{
                        x: [0, 50, -150, 0],
                        y: [0, 100, -100, 0],
                        scale: [1, 0.8, 1.3, 1]
                      }}
                      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                      className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] rounded-full blur-[120px] mix-blend-screen"
                      style={{ backgroundColor: SLIDES[currentSlide].aurora[2] }}
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Noise overlay for premium texture */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
              </div>

              {/* Dark Vignette Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70 pointer-events-none z-[5]" />

              {/* SPATIAL SLIDE CONTENT */}
              <div className="relative z-10 w-full flex-1 flex items-center justify-center preserve-3d perspective-1000">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    variants={spatialVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
                    className="flex flex-col items-center justify-center w-full max-w-5xl px-6"
                  >

                    {/* Holographic Icon / Image Showcase */}
                    <motion.div
                      whileHover={{ scale: 1.05, rotateY: 15, rotateX: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="relative group cursor-pointer mb-8"
                    >
                      <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {SLIDES[currentSlide].image ? (
                        <img
                          src={SLIDES[currentSlide].image}
                          alt={SLIDES[currentSlide].title}
                          className="w-full max-w-[200px] md:max-w-[280px] h-auto object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.2)] relative z-10"
                        />
                      ) : (
                        <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.05)] flex items-center justify-center relative z-10 overflow-hidden">
                          {/* Inner glass reflection */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                          {React.createElement(SLIDES[currentSlide].icon, { className: "w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" })}
                        </div>
                      )}
                    </motion.div>

                    {/* Typography */}
                    <div className="text-center">
                      <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight mb-4 drop-shadow-2xl"
                      >
                        {SLIDES[currentSlide].title.split(SLIDES[currentSlide].highlight)[0]}
                        <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                          {SLIDES[currentSlide].highlight}
                        </span>
                        {SLIDES[currentSlide].title.split(SLIDES[currentSlide].highlight)[1]}
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-lg md:text-xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto"
                      >
                        {SLIDES[currentSlide].description}
                      </motion.p>
                    </div>

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* FLOATING NEXT BUTTON / DIVE IN */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-20 flex items-center justify-end"
              >
                {currentSlide < SLIDES.length - 1 ? (
                  <div className="relative flex items-center justify-center group cursor-pointer" onClick={nextSlide}>

                    {/* Outer SVG Progress Circle */}
                    <svg className="w-16 h-16 transform -rotate-90 pointer-events-none overflow-visible" viewBox="0 0 60 60">
                      {/* Background Track */}
                      <circle
                        cx="30" cy="30" r={circleRadius}
                        className="stroke-white/10"
                        strokeWidth="2" fill="none"
                      />
                      {/* Animated Progress Fill */}
                      <motion.circle
                        cx="30" cy="30" r={circleRadius}
                        className="stroke-white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circleCircumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        style={{ strokeDasharray: circleCircumference }}
                      />
                    </svg>

                    {/* Inner Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-shadow duration-500"
                    >
                      <ArrowRight className="w-5 h-5 text-black" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextSlide}
                    className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold uppercase tracking-wide text-sm shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all duration-300"
                  >
                    Dive In!
                    <Sparkles className="w-4 h-4 text-purple-600 group-hover:rotate-12 transition-transform" />
                  </motion.button>
                )}
              </motion.div>

              {/* Skip Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={() => onComplete()}
                className="absolute top-10 right-10 z-20 text-xs font-bold text-white/30 hover:text-white transition-colors tracking-widest uppercase"
              >
                Skip
              </motion.button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AnimatePresence>
  )
}
