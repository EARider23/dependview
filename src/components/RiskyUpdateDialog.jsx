import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { AlertTriangle } from 'lucide-react'

export function RiskyUpdateDialog({ open, onOpenChange, riskyUpdate, onContinue, onCancel }) {
  if (!riskyUpdate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-yellow-100">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <DialogTitle className="text-xl">Risky Update Warning</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-foreground mb-1">
                {riskyUpdate.packageName}
              </p>
              <p className="text-sm text-gray-600">
                {riskyUpdate.current} → {riskyUpdate.latest}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">⚠️ Warning:</p>
              <p className="text-sm text-gray-600">
                {riskyUpdate.reason}
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Breaking changes may affect your project</li>
                <li>API changes might require code modifications</li>
                <li>Dependencies may also need updates</li>
                <li>Configuration files might need changes</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can revert this update later using the menu (⋮) next to the package if something breaks.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
          >
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
