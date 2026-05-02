import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { AlertTriangle } from 'lucide-react'

export function UninstallProjectDialog({ open, onOpenChange, project, onConfirm }) {
    const [confirmText, setConfirmText] = useState('')
    const expectedText = `delete ${project?.name}`
    const isValid = confirmText === expectedText

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border border-gray-100 shadow-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-red-600">Uninstall Project</DialogTitle>
                            <DialogDescription className="text-gray-600">
                                This action cannot be undone!
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium mb-2">
                            ⚠️ This will permanently delete:
                        </p>
                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                            <li>• All project files and folders</li>
                            <li>• All installed packages</li>
                            <li>• Project configuration</li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            To uninstall the project <span className="font-bold text-red-600">{project?.name}</span>, type the following:
                        </p>
                        <div className="bg-gray-100 p-2 rounded mb-3 font-mono text-center text-red-600 font-bold select-none">
                            delete {project?.name}
                        </div>
                        <Input
                            placeholder={`Type "delete ${project?.name}" to confirm`}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setConfirmName('')
                            onOpenChange(false)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm()
                            setConfirmText('')
                            onOpenChange(false)
                        }}
                        disabled={!isValid}
                        className="bg-red-600 hover:bg-red-700 font-bold"
                    >
                        Uninstall Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
