import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Label } from './ui/label'
import {
    Settings, FolderPlus, Trash2, RefreshCw, CheckCircle, HardDrive,
    ShieldCheck, History, Package, Zap, Terminal,
    Activity, Database, Lock, AlertTriangle,
    Search, Gauge, Clock, FileText, Monitor, Moon, Sun, Code, Link, Github, Boxes, ShieldAlert, X,
    Download, Globe, ExternalLink
} from 'lucide-react'
import { isTauri } from '../lib/browserMock'
import { useMaintenance } from '../hooks/useMaintenance'
import { useHistory } from '../hooks/useHistory'

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
    const [activeTab, setActiveTab] = useState('general')

    const {
        maintenanceResult,
        isAnalyzing,
        runMaintenance,
        handleCleanCache,
        handleCleanAllCaches
    } = useMaintenance(projects, showToast || (() => { }))

    const { historyRecords, clearHistory } = useHistory()

    useEffect(() => {
        if (isOpen) {
            setLocalSettings({
                ...settings,
                theme: settings.theme || 'system',
                defaultEditor: settings.defaultEditor || 'vscode',
                packageManager: settings.packageManager || 'auto',
                saveExact: settings.saveExact ?? false,
                ignoreScripts: settings.ignoreScripts ?? false,
                registryUrl: settings.registryUrl || '',
                ignorePatterns: settings.ignorePatterns || 'node_modules, dist, build, .git',
                autoScan: settings.autoScan ?? true,
                deepSearch: settings.deepSearch ?? true,
                autoCleanup: settings.autoCleanup ?? false,
                diskAlerts: settings.diskAlerts ?? true,
                customScanPaths: settings.customScanPaths || []
            })
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
        { id: 'general', label: 'General', icon: Settings, color: 'text-slate-400' },
        { id: 'package', label: 'Package Control', icon: Boxes, color: 'text-purple-500' },
        { id: 'scanning', label: 'Scanning', icon: Search, color: 'text-emerald-500' },
        { id: 'maintenance', label: 'Health Guard', icon: ShieldCheck, color: 'text-blue-500' },
        { id: 'history', label: 'Audit Ledger', icon: History, color: 'text-orange-500' },
        { id: 'updates', label: 'Updates & About', icon: Download, color: 'text-sky-500' },
        { id: 'integrations', label: 'Integrations', icon: Link, color: 'text-pink-500' },
    ]

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1100px] w-full bg-card border-0 shadow-[0_80px_120px_-20px_rgba(0,0,0,0.5)] rounded-[3rem] p-0 overflow-hidden flex h-[80vh] dark:shadow-[0_80px_120px_-20px_rgba(0,0,0,0.8)]">
                
                {/* Tactical Dock (Sidebar) */}
                <div className="w-[280px] bg-muted/80 border-r border-border p-10 flex flex-col relative z-20 backdrop-blur-xl">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center gap-4 mb-14 relative z-10">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 border border-slate-800">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground leading-none mb-1">Settings</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Config</p>
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full group flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id 
                                    ? 'bg-card shadow-xl shadow-slate-200/50 dark:shadow-black/50 text-foreground border-2 border-transparent dark:border-white/10 ring-1 ring-border' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-card/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? item.color : 'text-slate-400'}`} />
                                    <span className="font-black text-[11px] uppercase tracking-[0.15em]">{item.label}</span>
                                </div>
                                {activeTab === item.id && <motion.div layoutId="dock-dot" className="w-1.5 h-1.5 rounded-full bg-[#1a1a1e] dark:bg-[#ffffff]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Workspace */}
                <div className="flex-1 bg-card p-14 overflow-y-auto relative scrollbar-hide">
                    <AnimatePresence mode="wait">
                        
                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <motion.div key="general" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-20">
                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Appearance</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Interface Theme & Styling</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'system', icon: Monitor, label: 'System' },
                                            { id: 'dark', icon: Moon, label: 'Dark Mode' },
                                            { id: 'light', icon: Sun, label: 'Light Mode' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setLocalSettings(prev => ({ ...prev, theme: t.id }))}
                                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${localSettings.theme === t.id 
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 dark:shadow-black' 
                                                    : 'bg-muted border-transparent text-slate-400 hover:bg-muted/80'
                                                }`}
                                            >
                                                <t.icon className="w-8 h-8" />
                                                <span className="font-black text-[11px] uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Default Editor</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Action for "Open Folder" events</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'vscode', label: 'VS Code', logo: '/editors/Visual Studio Code (VS Code).png' },
                                            { id: 'cursor', label: 'Cursor', logo: '/editors/cursor-ai.png' },
                                            { id: 'windsurf', label: 'Windsurf', logo: '/editors/icons8-windsurf-editor-500.png' },
                                            { id: 'antigravity', label: 'Antigravity', logo: '/editors/Google-Antigravity-Icon-Full-Color.png' },
                                            { id: 'webstorm', label: 'WebStorm', logo: '/editors/intellij_webstorm_macos_bigsur_icon_190053.png' },
                                            { id: 'pycharm', label: 'PyCharm', logo: '/editors/PyCharm.png' },
                                            { id: 'system', label: 'Explorer', logo: '/editors/File_Explorer_Icon.png' }
                                        ].map(editor => (
                                            <button
                                                key={editor.id}
                                                onClick={() => setLocalSettings(prev => ({ ...prev, defaultEditor: editor.id }))}
                                                className={`flex-1 min-w-[120px] p-4 rounded-2xl border transition-all text-center flex flex-col items-center ${localSettings.defaultEditor === editor.id 
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 font-black' 
                                                    : 'bg-muted border-transparent text-slate-400 hover:bg-card hover:border-border font-bold'
                                                }`}
                                            >
                                                <img 
                                                    src={editor.logo} 
                                                    alt={editor.label} 
                                                    className={`w-8 h-8 object-contain mb-3 transition-transform ${localSettings.defaultEditor === editor.id ? 'scale-110' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`} 
                                                />
                                                <span className="text-[10px] uppercase tracking-widest">{editor.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* PACKAGE CONTROL TAB */}
                        {activeTab === 'package' && (
                            <motion.div key="package" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-20">
                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Package Manager</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Engine used for installations & updates</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {['auto', 'npm', 'yarn', 'pnpm', 'bun'].map(pm => (
                                            <button
                                                key={pm}
                                                onClick={() => setLocalSettings(prev => ({ ...prev, packageManager: pm }))}
                                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${localSettings.packageManager === pm
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-black'
                                                    : 'bg-card text-slate-400 border-border hover:border-slate-300'
                                                }`}
                                            >
                                                {pm === 'auto' ? 'Auto-Detect (Smart)' : pm}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Installation Flags</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Security & Versioning Overrides</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted p-6 rounded-3xl border border-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-indigo-500">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <Switch 
                                                    checked={localSettings.saveExact} 
                                                    onCheckedChange={(c) => setLocalSettings(prev => ({...prev, saveExact: c}))} 
                                                />
                                            </div>
                                            <h4 className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">Save Exact Versions</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Pins dependencies to exact versions (removes ^ or ~ from package.json).</p>
                                        </div>

                                        <div className="bg-muted p-6 rounded-3xl border border-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-red-500">
                                                    <ShieldAlert className="w-5 h-5" />
                                                </div>
                                                <Switch 
                                                    checked={localSettings.ignoreScripts} 
                                                    onCheckedChange={(c) => setLocalSettings(prev => ({...prev, ignoreScripts: c}))} 
                                                />
                                            </div>
                                            <h4 className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">Ignore Scripts</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Prevents malicious pre/post-install scripts from running automatically.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Custom Registry</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Enterprise or Private Package Registry</p>
                                    </div>
                                    <div className="bg-muted p-6 rounded-3xl border border-border">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Registry URL (Leave blank for default)</Label>
                                        <Input 
                                            value={localSettings.registryUrl}
                                            onChange={(e) => setLocalSettings(prev => ({...prev, registryUrl: e.target.value}))}
                                            placeholder="https://registry.npmjs.org/"
                                            className="h-14 bg-card border-border rounded-xl font-mono text-sm px-4 focus-visible:ring-purple-500"
                                        />
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SCANNING TAB */}
                        {activeTab === 'scanning' && (
                            <motion.div key="scanning" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-20">
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Workspace Protocol</h3>
                                        <Button onClick={addCustomPath} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all">
                                            <FolderPlus className="w-4 h-4 mr-2" /> Add Repository
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {(localSettings.customScanPaths || []).length === 0 ? (
                                            <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center text-slate-400 dark:text-slate-600">
                                                <Search className="w-10 h-10 mb-3 opacity-30" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em]">No Active Workspaces Found</span>
                                            </div>
                                        ) : (
                                            localSettings.customScanPaths.map((path, i) => (
                                                <div key={i} className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-black/50 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                            <HardDrive className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono">{path}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removePath(path)}
                                                        className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Optimization</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Filters & Indexing Rules</p>
                                    </div>
                                    <div className="bg-muted p-6 rounded-3xl border border-border mb-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Ignore Patterns (Comma Separated)</Label>
                                        <Input 
                                            value={localSettings.ignorePatterns}
                                            onChange={(e) => setLocalSettings(prev => ({...prev, ignorePatterns: e.target.value}))}
                                            placeholder="node_modules, dist, build, .git, .next"
                                            className="h-14 bg-card border-border rounded-xl font-mono text-sm px-4 focus-visible:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/50 p-6 rounded-3xl border border-border hover:border-emerald-200 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <Switch
                                                    checked={localSettings.autoScan || false}
                                                    onCheckedChange={(c) => setLocalSettings(prev => ({ ...prev, autoScan: c }))}
                                                />
                                            </div>
                                            <h4 className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">Active Indexing</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Monitor workspaces for delta changes in real-time</p>
                                        </div>

                                        <div className="bg-muted/50 p-6 rounded-3xl border border-border hover:border-emerald-200 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <Database className="w-5 h-5" />
                                                </div>
                                                <Switch
                                                    checked={localSettings.deepSearch || false}
                                                    onCheckedChange={(c) => setLocalSettings(prev => ({ ...prev, deepSearch: c }))}
                                                />
                                            </div>
                                            <h4 className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">Deep Inspection</h4>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Recursive analysis of nested sub-dependencies</p>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* MAINTENANCE TAB (Kept existing structure) */}
                        {activeTab === 'maintenance' && (
                            <motion.div key="maintenance" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8 pb-20">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Health Guard</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Optimization Engine</p>
                                    </div>
                                    <Button
                                        onClick={runMaintenance}
                                        disabled={isAnalyzing}
                                        className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-200 dark:shadow-black transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-3 text-emerald-400" />}
                                        {isAnalyzing ? 'Analyzing System...' : 'Initiate Full Audit'}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {[
                                        { id: 'cleanup', icon: Trash2, label: 'Auto-Cleanup', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', state: localSettings.autoCleanup },
                                        { id: 'notify', icon: AlertTriangle, label: 'Disk Alerts', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10', state: localSettings.diskAlerts ?? true }
                                    ].map(rule => (
                                        <div key={rule.id} className="bg-muted p-6 rounded-[2rem] border border-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 ${rule.bg} rounded-xl flex items-center justify-center ${rule.color}`}>
                                                    <rule.icon className="w-5 h-5" />
                                                </div>
                                                <Switch checked={rule.state} onCheckedChange={(val) => {
                                                    if (rule.id === 'cleanup') setLocalSettings(prev => ({ ...prev, autoCleanup: val }))
                                                    if (rule.id === 'notify') setLocalSettings(prev => ({ ...prev, diskAlerts: val }))
                                                }} />
                                            </div>
                                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{rule.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {maintenanceResult ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <Gauge className="w-4 h-4 text-purple-600" /> Storage Consumption
                                                </h4>
                                                <Badge className="bg-slate-900 text-white rounded-lg px-3 py-1 font-mono text-[10px]">
                                                    {formatBytes(maintenanceResult.caches.reduce((s, c) => s + c.size, 0))} Total Bloat
                                                </Badge>
                                            </div>
                                            <div className="space-y-3">
                                                {maintenanceResult.caches.map((cache, i) => (
                                                    <div key={i} className="flex items-center justify-between p-5 bg-muted/50 rounded-2xl border border-transparent hover:border-border transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-[11px] font-black text-foreground uppercase tracking-wider leading-none mb-1">{cache.name}</h5>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatBytes(cache.size)}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleCleanCache(cache.path)} className="px-5 py-2 bg-card hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border transition-all">Purge</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="py-24 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                        <Activity className="w-16 h-16 mb-4 opacity-30" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Audit Data Available</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                            <motion.div key="history" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8 pb-20">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Audit Ledger</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Timeline of Authorized Changes</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={clearHistory} className="px-6 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Wipe History</button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {historyRecords.length === 0 ? (
                                        <div className="py-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                            <Clock className="w-20 h-20 mb-4 opacity-30" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Ledger Empty</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[500px] pr-4">
                                            {historyRecords.map((record) => {
                                                const Icon = record.type === 'install' ? Package :
                                                    record.type === 'update' ? RefreshCw : ShieldCheck;

                                                return (
                                                    <div key={record.id} className="mb-3 bg-card border border-border rounded-3xl p-6 flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-black/50 transition-all border-l-4 border-l-slate-900 dark:border-l-slate-100">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.type === 'install' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                                                record.type === 'update' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                                                                    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                            }`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(record.timestamp).toLocaleString()}</span>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            </div>
                                                            <h5 className="font-black text-foreground text-sm tracking-tight mb-1">{record.title}</h5>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{record.description}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className="bg-muted text-slate-400 border-0 font-black text-[8px] uppercase tracking-tighter">{record.projectName || 'SYSTEM'}</Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </ScrollArea>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* UPDATES & ABOUT TAB */}
                        {activeTab === 'updates' && (
                            <motion.div key="updates" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-20">
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-3xl font-black text-foreground tracking-tight">Software Updates</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Keep Peeak at Maximum Power</p>
                                        </div>
                                        <Button
                                            onClick={onCheckUpdates}
                                            className="h-12 px-6 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-sky-200 dark:hover:border-sky-800 transition-all"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" /> Check for Updates
                                        </Button>
                                    </div>
                                    <div className="bg-muted p-6 rounded-3xl border border-border">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-sky-500">
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <Switch 
                                                checked={localSettings.autoDownloadUpdates ?? true} 
                                                onCheckedChange={(c) => setLocalSettings(prev => ({...prev, autoDownloadUpdates: c}))} 
                                            />
                                        </div>
                                        <h4 className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">Auto-Download Updates</h4>
                                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Automatically download and prepare updates in the background.</p>
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">About Peeak</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">System Information</p>
                                    </div>
                                    <div className="bg-muted p-8 rounded-3xl border border-border font-mono text-xs leading-relaxed text-slate-500 dark:text-slate-400 select-text overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <tbody>
                                                <tr><th className="pr-8 py-1 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Peeak Version:</th><td>1.0.0</td></tr>
                                                <tr><th className="pr-8 py-1 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Tauri Core:</th><td>2.0.0</td></tr>
                                                <tr><th className="pr-8 py-1 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">OS:</th><td>Windows_NT x64 10.0.26200</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">Ecosystem</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Links & Distribution</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { name: 'Microsoft Store', desc: 'Leave a 5-star review', icon: Monitor, color: 'text-blue-500', url: '#' },
                                            { name: 'Official Website', desc: 'peeak.app', icon: Globe, color: 'text-indigo-500', url: '#' },
                                            { name: 'GitHub Repo', desc: 'Star us on GitHub', icon: Github, color: 'text-slate-600 dark:text-slate-300', url: '#' },
                                            { name: 'Community', desc: 'Join our Discord', icon: ExternalLink, color: 'text-violet-500', url: '#' },
                                        ].map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-black/50 transition-all group">
                                                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${link.color} group-hover:scale-110 transition-transform`}>
                                                    <link.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h5 className="text-[11px] font-black text-foreground uppercase tracking-widest">{link.name}</h5>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{link.desc}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === 'integrations' && (
                            <motion.div key="integrations" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8 pb-20">
                                <div className="mb-10">
                                    <h3 className="text-3xl font-black text-foreground tracking-tight">Integrations</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Connect External Services</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-muted rounded-[2rem] border border-border flex flex-col relative overflow-hidden group">
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-purple-500/20">Coming Soon</div>
                                        <Github className="w-12 h-12 text-foreground mb-6" />
                                        <h4 className="text-lg font-black text-foreground tracking-tight mb-2">GitHub Sync</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed mb-8 flex-1">Automatically commit package.json changes, track dependency history, and revert workspaces via Git.</p>
                                        <Button disabled className="w-full bg-card text-slate-400 border border-border h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Connect Account</Button>
                                    </div>
                                    <div className="p-8 bg-muted rounded-[2rem] border border-border flex flex-col relative overflow-hidden group">
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Coming Soon</div>
                                        <Database className="w-12 h-12 text-emerald-500 mb-6" />
                                        <h4 className="text-lg font-black text-foreground tracking-tight mb-2">Supabase Relay</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed mb-8 flex-1">Sync your workspace configurations and custom environments across all your devices using Supabase.</p>
                                        <Button disabled className="w-full bg-card text-slate-400 border border-border h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Connect Project</Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tactical Footer */}
                <div className="absolute bottom-0 right-0 left-[280px] p-6 bg-gradient-to-t from-card via-card/90 to-transparent flex justify-end gap-4 pointer-events-none">
                    <div className="pointer-events-auto flex gap-4">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-8 h-14 rounded-2xl bg-card border border-border shadow-sm text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-foreground hover:bg-muted transition-all"
                        >
                            Abort
                        </button>
                        <Button
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <CheckCircle className="w-4 h-4" /> Save Settings
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
