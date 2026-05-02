import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { AlertCircle } from 'lucide-react'

export function UpdatePromptDialog({ open, onOpenChange, packageUpdates = [], frameworkUpdates = [], onUpdate, onSkip }) {
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [selectedFrameworks, setSelectedFrameworks] = useState(new Set())

  React.useEffect(() => {
    // Select all by default
    setSelectedPackages(new Set(packageUpdates.map(p => p.name)))
    setSelectedFrameworks(new Set(frameworkUpdates.map(f => f.name)))
  }, [packageUpdates, frameworkUpdates, open])

  const togglePackage = (name) => {
    setSelectedPackages(prev => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const toggleFramework = (name) => {
    setSelectedFrameworks(prev => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const handleUpdate = () => {
    const pkgs = packageUpdates.filter(p => selectedPackages.has(p.name))
    const fws = frameworkUpdates.filter(f => selectedFrameworks.has(f.name))
    onUpdate(pkgs, fws)
  }

  const totalUpdates = packageUpdates.length + frameworkUpdates.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Updates Available</DialogTitle>
              <p className="text-sm text-gray-600">Found {totalUpdates} update(s) for this project</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Package Updates */}
          {packageUpdates.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-900">Package Updates ({packageUpdates.length})</h3>
              <div className="space-y-2 max-h-48 overflow-auto">
                {packageUpdates.map((pkg) => (
                  <div key={pkg.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox checked={selectedPackages.has(pkg.name)} onCheckedChange={() => togglePackage(pkg.name)} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{pkg.name}</div>
                        <div className="text-xs text-gray-500">
                          {pkg.currentVersion} → {pkg.latestVersion}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{pkg.manager}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Framework/SDK Updates */}
          {frameworkUpdates.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-900">Framework/SDK Updates ({frameworkUpdates.length})</h3>
              <div className="space-y-2 max-h-48 overflow-auto">
                {frameworkUpdates.map((fw) => (
                  <div key={fw.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox checked={selectedFrameworks.has(fw.name)} onCheckedChange={() => toggleFramework(fw.name)} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{fw.name}</div>
                        <div className="text-xs text-gray-500">
                          Current: {fw.currentVersion} • Latest: {fw.latestVersion}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{fw.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onSkip}>
            Later
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={selectedPackages.size === 0 && selectedFrameworks.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
