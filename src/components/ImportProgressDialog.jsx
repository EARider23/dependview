import React from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Progress } from './ui/progress'
import { Loader2, X } from 'lucide-react'

export function ImportProgressDialog({ open, projectName, stage, packageCount, onOpenChange }) {
  // Order: checking -> scanning -> detecting (verification)
  const stages = [
    { key: 'checking', label: 'Checking project', icon: Loader2 },
    { key: 'scanning', label: 'Scanning packages', icon: Loader2 },
    { key: 'detecting', label: 'Verifying technologies', icon: Loader2 },
  ]

  const currentIndex = stages.findIndex(s => s.key === stage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-none shadow-2xl rounded-[2rem] p-10 outline-none overflow-hidden" hideClose>
        <div className="relative">
          {/* Custom Close Button */}
          <button 
            onClick={() => onOpenChange && onOpenChange(false)}
            className="absolute -top-4 -right-4 w-8 h-8 rounded-xl border border-purple-200 flex items-center justify-center text-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Importing Project</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px] font-mono">{projectName}</p>
          </div>

          <div className="space-y-8 mb-12">
            {stages.map((s, idx) => {
              const Icon = s.icon
              const isActive = idx === currentIndex
              const isDone = idx < currentIndex
              
              return (
                <div key={s.key} className="flex items-center gap-6 group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isDone ? 'bg-purple-50' : isActive ? 'bg-purple-50 shadow-inner' : 'bg-muted'
                  }`}>
                    {isDone ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
                    ) : isActive ? (
                      <Icon className="w-5 h-5 text-purple-600 animate-spin" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-black tracking-tight transition-colors duration-500 ${
                      isActive ? 'text-purple-600' : isDone ? 'text-foreground opacity-60' : 'text-gray-300'
                    }`}>
                      {s.label}
                    </p>
                    {isActive && s.key === 'scanning' && packageCount > 0 && (
                      <p className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest mt-0.5">
                        {packageCount} Packages Detected
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100 border border-gray-50 shadow-inner">
              <div 
                style={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
