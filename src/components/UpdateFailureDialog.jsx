import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'

export function UpdateFailureDialog({ open, onOpenChange, failedPackages = [], onRetry }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Update Failed</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">Some packages failed to update.</p>
        </DialogHeader>

        <div className="py-4">
          <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
            {failedPackages.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={() => { onRetry(failedPackages); onOpenChange(false) }} className="bg-purple-600 text-white">Retry</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateFailureDialog
