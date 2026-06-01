import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, Lightbulb, Send, X, Loader2 } from 'lucide-react'

// Generate a random UUID for the device if it doesn't exist
const getDeviceId = () => {
  let deviceId = localStorage.getItem('peeak_device_id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('peeak_device_id', deviceId)
  }
  return deviceId
}

export function FeedbackDialog({ open, onOpenChange, showToast }) {
  const [type, setType] = useState('bug') // 'bug' or 'feature'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set this to your deployed Cloudflare Worker URL
  const JIRA_PROXY_URL = import.meta.env.VITE_JIRA_PROXY_URL || 'YOUR_PROXY_URL'

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title || !description) {
      showToast('Please fill in all fields', 'error')
      return
    }

    setIsSubmitting(true)
    const deviceId = getDeviceId()
    let savedTicketId = crypto.randomUUID() // fallback if mocking

    try {
      if (JIRA_PROXY_URL === 'YOUR_PROXY_URL') {
        await new Promise(resolve => setTimeout(resolve, 1500))
        showToast('Proxy not configured yet, but ticket was saved locally!', 'success')
      } else {
        const response = await fetch(`${JIRA_PROXY_URL}/api/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deviceId,
            type,
            title,
            description
          })
        })

        if (!response.ok) throw new Error('Failed to submit feedback to backend')
        const data = await response.json()
        savedTicketId = data.issueKey || savedTicketId
        showToast('Feedback submitted successfully!', 'success')
      }
      
      const savedTickets = JSON.parse(localStorage.getItem('peeak_user_tickets') || '[]')
      savedTickets.push({
        id: savedTicketId,
        title,
        type,
        status: 'open',
        submittedAt: Date.now()
      })
      localStorage.setItem('peeak_user_tickets', JSON.stringify(savedTickets))

      setTitle('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      showToast('Failed to submit. Please try again later.', 'error')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="mb-8 text-center mt-2">
              <h2 className="text-[24px] font-black tracking-tight text-slate-900">Help us improve</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed px-4">
                Found a bug or have a brilliant idea? Let us know and we'll notify you here when it's shipped!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Modern Segmented Control for Type Selection */}
              <div className="relative flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all z-10 ${
                    type === 'bug' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type === 'bug' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Bug className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-widest">Report Bug</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('feature')}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all z-10 ${
                    type === 'feature' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type === 'feature' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Lightbulb className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-widest">Feature</span>
                  </span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brief Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'bug' ? "e.g. App crashes when I click..." : "e.g. Add a dark mode toggle..."}
                  className="w-full px-5 py-[14px] rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'bug' ? "What exactly happened? Steps to reproduce?" : "How should this new feature work?"}
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-2 flex items-center justify-center gap-2 w-full py-[16px] rounded-2xl text-white font-black uppercase tracking-[0.15em] text-[11px] transition-all shadow-lg ${
                  isSubmitting 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : (type === 'bug' 
                        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25' 
                        : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25')
                }`}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending to developer...</>
                ) : (
                  <><Send className="w-[14px] h-[14px] -ml-1" /> Send to Developer</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
