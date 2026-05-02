import React from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'

import { Trash2 } from 'lucide-react'

export function ProjectSelectorDialog({ open, onOpenChange, projects, onSelect, packageName, onRemove }) {
    const [selectedProject, setSelectedProject] = React.useState(null)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border border-gray-100 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Select Installation Location</DialogTitle>
                    <DialogDescription>
                        Choose where to install <span className="font-bold text-purple-600">{packageName}</span>
                    </DialogDescription>
                </DialogHeader>

                <RadioGroup value={selectedProject} onValueChange={setSelectedProject} className="gap-4 py-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer">
                        <RadioGroupItem value="global" id="global" />
                        <Label htmlFor="global" className="flex-1 cursor-pointer">
                            <div className="font-bold">Global Installation</div>
                            <div className="text-sm text-gray-500">Install system-wide (available everywhere)</div>
                        </Label>
                    </div>

                    {projects.map((project) => (
                        <div key={project.path} className="flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all">
                            <RadioGroupItem value={project.path} id={project.path} />
                            <Label htmlFor={project.path} className="flex-1 cursor-pointer">
                                <div className="font-bold">{project.name}</div>
                                <div className="text-sm text-gray-500 truncate">{project.path}</div>
                            </Label>
                            <button
                                title="Remove from imported projects"
                                onClick={(e) => { e.stopPropagation(); onRemove && onRemove(project.path); }}
                                className="p-2 rounded-md bg-white/50 hover:bg-red-100 text-gray-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </RadioGroup>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (selectedProject) {
                                onSelect(selectedProject)
                                onOpenChange(false)
                            }
                        }}
                        disabled={!selectedProject}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        Install Here
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
