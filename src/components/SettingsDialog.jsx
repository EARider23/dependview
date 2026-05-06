import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
    Settings, FolderPlus, Trash2, RefreshCw, CheckCircle, HardDrive,
    Download, ShieldCheck, History, Package, Zap, Terminal, Layout,
    Cpu, Activity, Database, Globe, Lock, Share2, Filter, AlertTriangle,
    Search, Gauge, Clock, FileText, ChevronRight
} from 'lucide-react'
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
    } = useMaintenance(projects, showToast || (() => { }))

    const { historyRecords, clearHistory } = useHistory()

    React.useEffect(() => {
        if (isOpen) {
            setLocalSettings({
                ...settings,
                performanceProfile: settings.performanceProfile || 'standard',
                updateChannel: settings.updateChannel || 'stable',
                logLevel: settings.logLevel || 'info',
                deepSearch: settings.deepSearch ?? true,
                autoCleanup: settings.autoCleanup ?? false,
                cleanupDays: settings.cleanupDays || 30
            })
            setUpdateStatus(null)
        }
    }, [isOpen, settings])

    const handleSave = () => {
        onSave(localSettings)
        onOpenChange(false)
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

    const sidebarItems = [
        { id: 'general', label: 'Engine', icon: Cpu, color: 'text-purple-500' },
        { id: 'updates', label: 'Deployment', icon: Globe, color: 'text-emerald-500' },
        { id: 'maintenance', label: 'Health', icon: ShieldCheck, color: 'text-blue-500' },
        { id: 'history', label: 'Ledger', icon: History, color: 'text-orange-500' },
        { id: 'advanced', label: 'Terminal', icon: Terminal, color: 'text-slate-400' },
    ]

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1100px] w-full bg-white border-0 shadow-[0_80px_120px_-20px_rgba(0,0,0,0.25)] rounded-[3rem] p-0 overflow-hidden flex h-[80vh]">

                {/* Tactical Dock (Sidebar) */}
                <div className="w-[280px] bg-slate-50/80 border-r border-slate-100 p-10 flex flex-col relative">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-4 mb-14 relative z-10">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-none mb-1">Command</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">v0.5.0-STABLE</p>
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full group flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id
                                        ? 'bg-white shadow-xl shadow-slate-200/50 text-slate-900 border border-white'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? item.color : 'text-slate-300'}`} />
                                    <span className="font-black text-[11px] uppercase tracking-[0.15em]">{item.label}</span>
                                </div>
                                {activeTab === item.id && <motion.div layoutId="dock-dot" className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-200/50 relative z-10">
                        <div className="bg-white/50 p-4 rounded-2xl border border-white flex items-center gap-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-40" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                            </div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Engine Active</span>
                        </div>
                    </div>
                </div>

                {/* Tactical Workspace (Content) */}
                <div className="flex-1 bg-white p-14 overflow-y-auto relative scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div key="general" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12">
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Engine Identity</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Global Core Configuration</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {[
                                                { id: 'stealth', icon: Lock, label: 'Stealth' },
                                                { id: 'standard', icon: Layout, label: 'Standard' },
                                                { id: 'turbo', icon: Zap, label: 'Turbo' }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setLocalSettings(prev => ({ ...prev, performanceProfile: p.id }))}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${localSettings.performanceProfile === p.id
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200'
                                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-purple-200 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <Switch
                                                    checked={localSettings.autoScan || false}
                                                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, autoScan: checked }))}
                                                />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tight">Active Indexing</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Monitor workspaces for delta changes in real-time</p>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <Database className="w-5 h-5" />
                                                </div>
                                                <Switch
                                                    checked={localSettings.deepSearch || false}
                                                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, deepSearch: checked }))}
                                                />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tight">Deep Inspection</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Recursive analysis of nested sub-dependencies</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Workspace Protocol</h3>
                                        <Button onClick={addCustomPath} className="bg-slate-100 hover:bg-slate-200 text-slate-600 h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all">
                                            <FolderPlus className="w-4 h-4 mr-2" /> Add Repository
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {(localSettings.customScanPaths || []).length === 0 ? (
                                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center text-slate-300">
                                                <Search className="w-10 h-10 mb-3 opacity-20" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em]">No Active Workspaces Found</span>
                                            </div>
                                        ) : (
                                            localSettings.customScanPaths.map((path, i) => (
                                                <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:shadow-slate-200/30 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                            <HardDrive className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-600 font-mono">{path}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removePath(path)}
                                                        className="w-8 h-8 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'updates' && (
                            <motion.div key="updates" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-10">
                                <section>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sync Intelligence</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Global Registry Synchronization</p>

                                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-purple-500/20">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-purple-300">
                                                        Current: v0.5.0
                                                    </div>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                </div>
                                                <h4 className="text-4xl font-black tracking-tight mb-4">Latest Protocol Active</h4>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">System integrity verified. No pending updates found in the stable channel.</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setCheckingUpdates(true)
                                                    setUpdateStatus('checking')
                                                    setTimeout(() => {
                                                        setCheckingUpdates(false)
                                                        setUpdateStatus('latest')
                                                        if (onCheckUpdates) onCheckUpdates()
                                                    }, 2000)
                                                }}
                                                disabled={checkingUpdates}
                                                className="bg-white text-slate-900 hover:bg-purple-50 h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                            >
                                                {checkingUpdates ? <RefreshCw className="w-4 h-4 mr-3 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-3" />}
                                                {checkingUpdates ? 'Syncing...' : 'Sync Now'}
                                            </Button>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Update Channel</h5>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'stable', label: 'Stable', desc: 'Verified Production Builds' },
                                                { id: 'beta', label: 'Beta', desc: 'Pre-release Feature Testing' },
                                                { id: 'canary', label: 'Canary', desc: 'Nightly Unstable Protocols' }
                                            ].map(ch => (
                                                <button
                                                    key={ch.id}
                                                    onClick={() => setLocalSettings(prev => ({ ...prev, updateChannel: ch.id }))}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${localSettings.updateChannel === ch.id
                                                            ? 'bg-white border-purple-200 shadow-sm'
                                                            : 'border-transparent hover:bg-white/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${localSettings.updateChannel === ch.id ? 'text-purple-600' : 'text-slate-600'}`}>{ch.label}</span>
                                                        {localSettings.updateChannel === ch.id && <CheckCircle className="w-3.5 h-3.5 text-purple-600" />}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{ch.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="p-8 bg-white border border-slate-100 rounded-[2rem] flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Globe className="w-4 h-4 text-emerald-500" />
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Global Relay</h5>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Automatically fetch registry metadata in the background every 60 minutes.</p>
                                            </div>
                                            <Switch
                                                checked={localSettings.autoCheckUpdates || false}
                                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, autoCheckUpdates: checked }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'maintenance' && (
                            <motion.div key="maintenance" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Health Guard</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Optimization Engine</p>
                                    </div>
                                    <Button
                                        onClick={runMaintenance}
                                        disabled={isAnalyzing}
                                        className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-3 text-emerald-400" />}
                                        {isAnalyzing ? 'Analyzing System...' : 'Initiate Full Audit'}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[
                                        { id: 'cleanup', icon: Trash2, label: 'Auto-Cleanup', color: 'text-red-500', bg: 'bg-red-50', state: localSettings.autoCleanup },
                                        { id: 'notify', icon: AlertTriangle, label: 'Disk Alerts', color: 'text-amber-500', bg: 'bg-amber-50', state: true },
                                        { id: 'logs', icon: FileText, label: 'Debug Mode', color: 'text-blue-500', bg: 'bg-blue-50', state: false }
                                    ].map(rule => (
                                        <div key={rule.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 ${rule.bg} rounded-xl flex items-center justify-center ${rule.color}`}>
                                                    <rule.icon className="w-5 h-5" />
                                                </div>
                                                <Switch checked={rule.state} onCheckedChange={(val) => {
                                                    if (rule.id === 'cleanup') setLocalSettings(prev => ({ ...prev, autoCleanup: val }))
                                                }} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{rule.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {maintenanceResult ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <Gauge className="w-4 h-4 text-purple-600" /> Storage Consumption
                                                </h4>
                                                <Badge className="bg-slate-900 text-white rounded-lg px-3 py-1 font-mono text-[10px]">
                                                    {formatBytes(maintenanceResult.caches.reduce((s, c) => s + c.size, 0))} Total Bloat
                                                </Badge>
                                            </div>
                                            <div className="space-y-3">
                                                {maintenanceResult.caches.map((cache, i) => (
                                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wider leading-none mb-1">{cache.name}</h5>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatBytes(cache.size)}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleCleanCache(cache.path)} className="px-5 py-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 transition-all">Purge</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="py-24 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                                        <Activity className="w-16 h-16 mb-4 opacity-10" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Audit Data Available</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div key="history" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Audit Ledger</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Timeline of Authorized Changes</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => { }} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">Export JSON</button>
                                        <button onClick={clearHistory} className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Wipe History</button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {historyRecords.length === 0 ? (
                                        <div className="py-32 flex flex-col items-center justify-center text-slate-200">
                                            <Clock className="w-20 h-20 mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Ledger Empty</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[500px] pr-4">
                                            {historyRecords.map((record) => {
                                                const Icon = record.type === 'install' ? Package :
                                                    record.type === 'update' ? RefreshCw : ShieldCheck;

                                                return (
                                                    <div key={record.id} className="mb-3 bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-l-4 border-l-slate-900">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.type === 'install' ? 'bg-blue-50 text-blue-600' :
                                                                record.type === 'update' ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-purple-50 text-purple-600'
                                                            }`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(record.timestamp).toLocaleString()}</span>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            </div>
                                                            <h5 className="font-black text-slate-900 text-sm tracking-tight mb-1">{record.title}</h5>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{record.description}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className="bg-slate-50 text-slate-400 border-0 font-black text-[8px] uppercase tracking-tighter">{record.projectName || 'SYSTEM'}</Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </ScrollArea>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'advanced' && (
                            <motion.div key="advanced" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-10">
                                <section>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Advanced Protocols</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">System Level Overrides</p>

                                    <div className="space-y-6">
                                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                                            <div className="flex items-center gap-4 mb-6">
                                                <Terminal className="w-6 h-6 text-purple-400" />
                                                <h5 className="text-lg font-black uppercase tracking-widest">Debug Verbosity</h5>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['error', 'info', 'debug'].map(lvl => (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => setLocalSettings(prev => ({ ...prev, logLevel: lvl }))}
                                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${localSettings.logLevel === lvl
                                                                ? 'bg-purple-500 text-white border-purple-500 shadow-xl shadow-purple-500/20'
                                                                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col justify-between h-48">
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Share2 className="w-4 h-4 text-blue-500" /> Analytics Relay
                                                    </h5>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Share anonymized diagnostic data to improve engine precision.</p>
                                                </div>
                                                <Switch checked={true} />
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col justify-between h-48">
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Filter className="w-4 h-4 text-orange-500" /> Cache Compression
                                                    </h5>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Enable GZIP compression for localized metadata storage.</p>
                                                </div>
                                                <Switch checked={true} />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tactical Footer */}
                <div className="absolute bottom-10 right-10 flex gap-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-8 h-14 rounded-2xl text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                    >
                        Abort
                    </button>
                    <Button
                        onClick={handleSave}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-200 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <CheckCircle className="w-4 h-4" /> Commit Configuration
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
