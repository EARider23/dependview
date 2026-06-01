import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Sparkles, X } from 'lucide-react'
import confetti from 'canvas-confetti'

export function TicketResolvedDialog({ ticket, onDismiss }) {
  if (!ticket) return null

  const isBug = ticket.type === 'bug'

  useEffect(() => {
    // Play success sound using Web Audio API (no external files needed!)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        if (isBug) {
          // Bug squash sound (playful pop)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          osc.start()
          osc.stop(ctx.currentTime + 0.1)
        } else {
          // Feature shipped sound (magical chime)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(600, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3)
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          osc.start()
          osc.stop(ctx.currentTime + 0.3)
        }
      }
    } catch (e) {
      console.log('Audio playback prevented or unsupported')
    }

    // Fire Confetti Blast
    const duration = 2500
    const end = Date.now() + duration
    const colors = isBug ? ['#20b757', '#4ade80', '#bbf7d0'] : ['#9845e8', '#c084fc', '#e9d5ff']

    ;(function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 200
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 200
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }())

  }, [isBug])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onDismiss}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden ${isBug ? 'bg-[#e9f7ed] border border-[#ccebdd]' : 'bg-[#f4ebff] border border-[#e5d5fc]'}`}
        >
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors z-10"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            {/* Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${isBug ? 'bg-white text-[#20b757] shadow-[#20b757]/10' : 'bg-white text-[#9845e8] shadow-[#9845e8]/10'}`}
            >
              {isBug ? <CheckCircle2 className="w-10 h-10" strokeWidth={3} /> : <Sparkles className="w-10 h-10" strokeWidth={3} />}
            </motion.div>

            <h2 className="text-[22px] font-black tracking-tight mb-2 text-slate-900">
              {isBug ? 'Bug Squashed! 🐛' : 'Feature Shipped! 🚀'}
            </h2>
            
            <p className="text-slate-600 text-[13px] font-medium mb-6 leading-relaxed">
              Great news! The developer has resolved your {isBug ? 'bug report' : 'feature request'}:
              <br/>
              <span className="inline-block mt-3 text-slate-900 font-bold px-4 py-2 bg-white/70 rounded-xl border border-white/40">
                "{ticket.title}"
              </span>
            </p>

            <button
              onClick={onDismiss}
              className={`w-full py-[14px] rounded-xl text-white font-black uppercase tracking-[0.15em] text-[11px] transition-all shadow-lg ${isBug ? 'bg-[#20b757] hover:bg-[#1ca14d] shadow-[#20b757]/30' : 'bg-[#9845e8] hover:bg-[#8638d1] shadow-[#9845e8]/30'}`}
            >
              Awesome, Thanks!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
