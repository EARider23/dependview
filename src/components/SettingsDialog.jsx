import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Settings, FolderPlus, Trash2, RefreshCw, CheckCircle, HardDrive, Download, ShieldCheck, History, Package, Zap, ArrowLeft, Terminal, Layout } from 'lucide-react'
import { isTauri } from '../lib/browserMock'
import { useMaintenance } from '../hooks/useMaintenance'
import { useHistory } from '../hooks/useHistory'
import AnimatedCounter from './AnimatedCounter'

export function SettingsDialog({
    open: isOpen,
    onOpenChange,
    settings,
    onSave,
    onCheckUpdates,
    projects = [],
    showToast,
    formatBytes,
    setCurrentProject,
    setViewMode
}) {
    const [localSettings, setLocalSettings] = useState(settings)
    const [checkingUpdates, setCheckingUpdates] = useState(false)
    const [updateStatus, setUpdateStatus] = useState(null)
    const [activeTab, setActiveTab] = useState('general')

    const {
        maintenanceResult,
        isAnalyzing,
        runMaintenance,
        handleCleanCache,
        handleCleanAllCaches
    } = useMaintenance(projects, showToast || (() => {}))

    const { historyRecords, clearHistory } = useHistory()

    React.useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings)
            setUpdateStatus(null)
            setActiveTab('general')
        }
    }, [isOpen, settings])

    const handleManualUpdateCheck = () => {
        setCheckingUpdates(true)
        setUpdateStatus('checking')
        setTimeout(() => {
            setCheckingUpdates(false)
            setUpdateStatus('latest')
            if (onCheckUpdates) onCheckUpdates()
        }, 2000)
    }

    const addCustomPath = async () => {
        try {
            if (isTauri()) {
                const { open } = await import('@tauri-apps/plugin-dialog')
                const selected = await open({
                    directory: true,
                    multiple: false,
                    title: 'Select Folder to Monitor'
                })
                if (selected) {
                    setLocalSettings(prev => ({
                        ...prev,
                        customScanPaths: [...(prev.customScanPaths || []), selected]
                    }))
                }
            }
        } catch (err) {
            console.error('Failed to pick folder', err)
        }
    }

    const removePath = (pathToRemove) => {
        setLocalSettings(prev => ({
            ...prev,
            customScanPaths: (prev.customScanPaths || []).filter(p => p !== pathToRemove)
        }))
    }

    const handleSave = () => {
        onSave(localSettings)
        onOpenChange(false)
    }

    const sidebarItems = [
        { id: 'general', label: 'General', icon: Layout, color: 'text-purple-600' },
        { id: 'updates', label: 'Updates', icon: RefreshCw, color: 'text-emerald-500' },
        { id: 'maintenance', label: 'Maintenance', icon: ShieldCheck, color: 'text-blue-500' },
        { id: 'history', label: 'History', icon: History, color: 'text-orange-500' },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full bg-white/95 backdrop-blur-2xl border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-0 overflow-hidden">
                <div className="flex h-[75vh] w-full">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50/50 border-r border-gray-100/50 p-8 flex flex-col">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tight">Settings</span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                            {sidebarItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        activeTab === item.id
                                            ? 'bg-white shadow-sm text-gray-900 border border-gray-100/50'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? item.color : ''}`} />
                                    <span className="font-black text-[12px] uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-8 border-t border-gray-100/50">
                            <div className="flex items-center gap-2 px-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Engine v0.5.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'general' && (
                                <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-12">
                                    <section>
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Monitor Paths</h3>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Directory Scan Scope</p>
                                            </div>
                                            <Button onClick={addCustomPath} className="h-10 bg-gray-900 text-white rounded-xl px-6 font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                                                <FolderPlus className="w-4 h-4 mr-2" /> Add Workspace
                                            </Button>
                                        </div>

                                        <div className="bg-gray-100/30 rounded-2xl border border-gray-100 overflow-hidden min-h-[200px]">
                                            {(localSettings.customScanPaths || []).length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center py-16 text-gray-400">
                                                    <Layout className="w-12 h-12 mb-4 opacity-10" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">No Custom Workspaces</span>
                                                </div>
                                            ) : (
                                                <ScrollArea className="h-[300px]">
                                                    <div className="divide-y divide-gray-100/50">
                                                        {localSettings.customScanPaths.map((path, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 hover:bg-white/50 transition-colors group">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-400">
                                                                        <HardDrive className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-gray-600 truncate max-w-md">{path}</span>
                                                                </div>
                                                                <button onClick={() => removePath(path)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8">System Limits</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white/50 p-8 rounded-2xl border border-gray-100 shadow-sm">
                                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">
                                                    Cache Threshold Alert
                                                </Label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        type="number"
                                                        value={localSettings.globalSizeThreshold || 2}
                                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, globalSizeThreshold: parseFloat(e.target.value) }))}
                                                        className="w-24 font-black h-12 text-xl bg-white border-gray-100 rounded-xl px-4"
                                                    />
                                                    <span className="text-lg font-black text-gray-900">GB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'updates' && (
                                <motion.div key="updates" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Software Delivery</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Platform Integrity v0.5.0</p>
                                        </div>
                                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest">Stable Release</Badge>
                                    </div>

                                    <div className="bg-white/50 rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                <RefreshCw className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 text-sm">Background Analysis</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auto-check framework updates</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={localSettings.autoCheckUpdates || false}
                                            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, autoCheckUpdates: checked }))}
                                        />
                                    </div>

                                    <div className="bg-gray-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                                        <div className="relative z-10">
                                            <h4 className="text-3xl font-black tracking-tight mb-2">Check for PEEAK Updates</h4>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Ensure you have the latest dependency intelligence</p>
                                            <Button
                                                onClick={handleManualUpdateCheck}
                                                disabled={checkingUpdates}
                                                className="bg-white text-gray-900 hover:bg-gray-100 h-12 px-10 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-black/20"
                                            >
                                                {checkingUpdates ? <RefreshCw className="w-4 h-4 mr-3 animate-spin" /> : updateStatus === 'latest' ? <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" /> : <Download className="w-4 h-4 mr-3" />}
                                                {checkingUpdates ? 'Connecting...' : updateStatus === 'latest' ? 'Up to Date' : 'Sync Engine'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'maintenance' && (
                                <motion.div key="maintenance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                     <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight text-blue-600">Smart Maintenance</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Optimization Engine</p>
                                        </div>
                                        <Button
                                            onClick={runMaintenance}
                                            disabled={isAnalyzing}
                                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 no-hover"
                                        >
                                            {isAnalyzing ? (
                                                <><RefreshCw className="w-4 h-4 mr-3 animate-spin" /> Analyzing...</>
                                            ) : (
                                                <><ShieldCheck className="w-4 h-4 mr-3" /> Execute Health Check</>
                                            )}
                                        </Button>
                                    </div>

                                    {!maintenanceResult ? (
                                        <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center">
                                            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6 text-blue-200">
                                                <Zap className="w-10 h-10" />
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 mb-2">Diagnostic Engine Ready</h4>
                                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest max-w-xs mx-auto">Identify bloated caches and unused dependencies across your workspaces</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Cache Storage', value: maintenanceResult.caches.reduce((s, c) => s + c.size, 0) / (1024 * 1024), unit: 'MB', color: 'text-blue-600' },
                                                    { label: 'Dead Deps', value: maintenanceResult.unused_packages.length, unit: 'Items', color: 'text-pink-600' },
                                                    { label: 'Actionable', value: maintenanceResult.caches.length, unit: 'Tasks', color: 'text-emerald-600' }
                                                ].map((stat, i) => (
                                                    <div key={i} className="bg-white/80 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
                                                        <div className={`text-3xl font-black ${stat.color} tracking-tighter`}>
                                                            <AnimatedCounter value={stat.value} />
                                                            <span className="text-xs ml-1 uppercase font-bold">{stat.unit}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                        <HardDrive className="w-4 h-4 text-blue-500" /> System Caches
                                                    </h4>
                                                    <button onClick={handleCleanAllCaches} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Purge All</button>
                                                </div>
                                                <div className="space-y-3">
                                                    {maintenanceResult.caches.map((cache, i) => (
                                                        <div key={i} className="bg-white/80 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group hover:border-blue-100 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <Package className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-black text-gray-900 text-sm leading-none mb-1">{cache.name}</h5>
                                                                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none">{formatBytes(cache.size)}</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleCleanCache(cache.path)} className="w-9 h-9 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight text-orange-500">Audit History</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Timeline of System Changes</p>
                                        </div>
                                        <button onClick={clearHistory} disabled={historyRecords.length === 0} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear Ledger</button>
                                    </div>

                                    <div className="bg-gray-100/30 rounded-2xl border border-gray-100 overflow-hidden">
                                        {historyRecords.length === 0 ? (
                                            <div className="py-24 text-center">
                                                <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No audit trails recorded</p>
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[450px]">
                                                <div className="p-2 space-y-2">
                                                    {historyRecords.map((record) => (
                                                        <div key={record.id} className="bg-white/80 rounded-xl p-4 border border-gray-50 flex items-center gap-4 hover:shadow-sm transition-all group">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                                record.type === 'install' ? 'bg-blue-50 text-blue-600' :
                                                                record.type === 'update' ? 'bg-emerald-50 text-emerald-600' :
                                                                record.type === 'maintenance' ? 'bg-purple-50 text-purple-600' :
                                                                'bg-orange-50 text-orange-600'
                                                            }`}>
                                                                {record.type === 'install' && <Package className="w-5 h-5" />}
                                                                {record.type === 'update' && <RefreshCw className="w-5 h-5" />}
                                                                {record.type === 'maintenance' && <Terminal className="w-5 h-5" />}
                                                                {!['install', 'update', 'maintenance'].includes(record.type) && <History className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                        {new Date(record.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                                                                    </span>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                </div>
                                                                <h5 className="font-black text-gray-900 text-sm tracking-tight truncate leading-none mb-1">{record.title}</h5>
                                                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide truncate">{record.description}</p>
                                                            </div>
                                                            <Badge className="bg-gray-50 text-gray-400 border-0 font-black text-[8px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{record.projectName || 'SYSTEM'}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 rounded-b-[2.5rem]">
                    <button onClick={() => onOpenChange(false)} className="px-6 h-11 rounded-xl text-gray-400 font-black text-[11px] uppercase tracking-widest hover:text-gray-900 transition-colors">Cancel</button>
                    <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-purple-200 active:scale-95 transition-all">
                        Commit Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
