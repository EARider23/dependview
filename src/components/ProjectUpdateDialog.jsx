import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

export function ProjectUpdateDialog({ open, onOpenChange, candidates = [], onUpdate }) {
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    // Select all by default
    const s = new Set(candidates.map(c => c.name))
    setSelected(s)
  }, [candidates, open])

  const toggle = (name) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const handleUpdate = () => {
    const list = candidates.filter(c => selected.has(c.name))
    onUpdate(list)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white border border-gray-100 shadow-xl">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl font-bold">Project Package Updates</DialogTitle>
            <p className="text-sm text-gray-600">Found packages with newer versions. Select which to update.</p>
          </div>
        </DialogHeader>

        <div className="py-4">
          {candidates.length === 0 && (
            <p className="text-sm text-gray-600">No updates available.</p>
          )}

          <div className="space-y-2 max-h-72 overflow-auto">
            {candidates.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Checkbox checked={selected.has(c.name)} onCheckedChange={() => toggle(c.name)} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-gray-500">Current: {c.currentVersion} • Latest: {c.latestVersion}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{c.manager}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button onClick={handleUpdate} disabled={selected.size === 0}>Update Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
