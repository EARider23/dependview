import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { RefreshCw, Trash2, Info, ArrowUp, Loader2, CheckCircle, MoreVertical, Undo2, Download, X, Package, Layers, ExternalLink, FolderOpen, Terminal, Play } from 'lucide-react'
import { Progress } from './ui/progress'
import { getTechIcon, getPackageIcon, getBestIcon } from '../assets/iconLinks'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

export const PackageCard = memo(({ pkg, selected, onToggle, onUpdate, onDelete, onRevert, hasUpdate, latestVersion, isInstalling, installProgress, installType, lastLog, throughput, viewMode = 'grid', verified = false, versionHistory = [], projectPath, venvPath, openFolder, formatBytes }) => {
    // Status Logic - strictly check for true
    const isDeclared = pkg.is_declared === true
    const isInstalled = pkg.is_installed === true
    const isActive = isDeclared && isInstalled
    const isPending = isDeclared && !isInstalled
    const managerIcon = getTechIcon(pkg.manager)

    const techIconData = getBestIcon(pkg.name)

    // Helper handlers to use stable function references from parent
    const handleToggle = () => onToggle?.(pkg.path);
    const handleUpdate = (e) => { e.stopPropagation(); onUpdate?.(pkg.name); };
    const handleDelete = () => onDelete?.(pkg);
    const handleRevert = (version) => onRevert?.(pkg.name, version);
    const handleOpenFolder = () => openFolder?.(pkg.path);

    // List view - compact horizontal layout (Sleek)
    if (viewMode === 'list') {
        return (
            <div className={`
                relative flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all duration-200 group
                ${selected
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : hasUpdate
                        ? 'border-amber-400 bg-amber-50/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                        : 'border-slate-100 bg-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10'
                }
            `}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                        checked={selected}
                        onCheckedChange={handleToggle}
                        className="h-4 w-4 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />

                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {techIconData?.image ? (
                            <img src={techIconData.image} className="w-full h-full object-contain" />
                        ) : pkg.icon ? (
                            <img src={pkg.icon} className="w-full h-full object-contain" />
                        ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-[14px] text-slate-900 truncate">{pkg.name}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold font-mono text-slate-500">v{pkg.version}</span>
                                {hasUpdate && (
                                    <>
                                        <div className="w-2.5 h-[1px] bg-amber-300" />
                                        <span className="text-[10px] font-bold font-mono text-amber-600 bg-amber-50 px-1.5 rounded-full border border-amber-100">
                                            v{latestVersion}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleOpenFolder}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors group/path"
                        >
                            <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover/path:text-indigo-400" />
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[250px]">{pkg.path}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold font-mono text-slate-800 uppercase tracking-tighter">{formatBytes(pkg.size)}</span>
                        <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-slate-600'}`}>
                                {isActive ? 'Active' : isPending ? 'Pending' : 'Idle'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {(hasUpdate || isPending || isInstalling) && (
                            <div className="mr-1">
                                {isInstalling ? (
                                    <div className="flex flex-col gap-1.5 bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-300/50 min-w-[220px] shadow-sm backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-tighter animate-pulse whitespace-nowrap">
                                                {installType === 'revert' ? 'Reverting' : installType === 'delete' ? 'Uninstalling' : isPending ? 'Installing' : 'Updating'} {installProgress}%
                                            </span>
                                            {throughput && (
                                                <span className="ml-auto text-[8px] font-bold text-amber-600 font-mono">{throughput}</span>
                                            )}
                                        </div>
                                        <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden border border-amber-200/50 p-[1px]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${installProgress}%` }}
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                            />
                                        </div>
                                        {lastLog && (
                                            <span className="text-[7px] font-mono text-amber-700/70 truncate uppercase tracking-tighter">
                                                {lastLog}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleUpdate}
                                        className={`h-7 px-2 ${isPending ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-amber-400 hover:bg-amber-500 text-black'} text-[9px] font-black uppercase rounded-lg border border-slate-500/10 shadow-sm transition-all active:scale-95`}
                                    >
                                        {isPending ? <Download className="w-3 h-3 mr-1" /> : <ArrowUp className="w-3 h-3 mr-1" />} 
                                        {isPending ? 'Install' : 'Update'}
                                    </Button>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                            {managerIcon.image ? (
                                <img src={managerIcon.image} className="w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all duration-300" />
                            ) : (
                                <span className="text-[10px]">{managerIcon.icon}</span>
                            )}
                            <span className="text-[10px] font-black text-slate-600 uppercase">{pkg.manager}</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {versionHistory?.length > 0 && (
                                    <DropdownMenuItem onClick={() => handleRevert()} className="text-indigo-600 font-bold text-[10px]">
                                        <Undo2 className="w-3.5 h-3.5 mr-2" /> REVERT
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 font-bold text-[10px]">
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> UNINSTALL
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        )
    }

    // Grid view - Sleek & Modern (Detail Rich)
    return (
        <div className={`
            relative p-5 rounded-2xl border-2 transition-all duration-300 group
            ${isInstalling ? 'border-indigo-500 bg-indigo-50/30' :
                hasUpdate
                    ? 'border-amber-400 bg-amber-50/30 shadow-[0_8px_30px_rgb(251,191,36,0.15)]'
                    : selected
                        ? 'border-indigo-500 bg-indigo-50/30 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10 active:scale-[0.98]'
            }
        `}>
            {/* Floating Update Indicator - Stacked Above */}
            {hasUpdate && (
                <div className="absolute -top-3 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 z-10">
                    <ArrowUp className="w-4.5 h-4.5 text-black font-black" />
                </div>
            )}

            {/* Top Bar: Controls & Status */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={selected}
                        onCheckedChange={handleToggle}
                        className="h-5 w-5 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 shadow-sm"
                    />
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-300 ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : isPending ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isActive ? 'Active' : isPending ? 'Pending' : 'Idle'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors bg-slate-50 rounded-lg hover:bg-slate-100">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {versionHistory?.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Revert Version</div>
                                    {versionHistory.slice().reverse().map((v, i) => (
                                        <DropdownMenuItem key={i} onClick={() => handleRevert(v)} className="text-indigo-600 text-[11px] font-bold">
                                            <Undo2 className="w-3.5 h-3.5 mr-2" /> Revert to v{v}
                                        </DropdownMenuItem>
                                    ))}
                                    <div className="border-t my-1" />
                                </>
                            )}
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600 text-[11px] font-black">
                                <Trash2 className="w-4 h-4 mr-2" /> UNINSTALL PACKAGE
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Middle: Brand & Identity */}
            <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-2xl border-2 bg-white flex items-center justify-center p-3 shadow-sm group-hover:scale-110 transition-transform duration-500 ${hasUpdate ? 'border-amber-300 shadow-amber-50' : 'border-slate-50'}`}>
                    {techIconData?.image ? (
                        <img src={techIconData.image} className="w-full h-full object-contain" />
                    ) : pkg.icon ? (
                        <img src={pkg.icon} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full rounded-xl flex items-center justify-center bg-slate-50">
                            <Package className="w-7 h-7 text-slate-300" />
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-[16px] text-slate-900 truncate leading-tight mb-1 group-hover:text-purple-600 transition-colors" title={pkg.name}>
                        {pkg.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold font-mono text-slate-700 bg-slate-100 px-1.5 rounded">v{pkg.version}</span>
                        {hasUpdate && (
                            <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                                ↑ v{latestVersion}
                            </span>
                        )}
                    </div>
                </div>
            </div>            {/* Bottom: Metrics & Path */}
            <div className="space-y-3">
                {isInstalling && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-1 space-y-2.5"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shadow-sm border border-amber-200">
                                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest animate-pulse leading-none mb-1">
                                    {installType === 'revert' ? 'Reverting' : installType === 'delete' ? 'Uninstalling' : isPending ? 'Installing' : 'Updating'}
                                </span>
                                {throughput && (
                                    <span className="text-[8px] font-black font-mono text-amber-500 uppercase tracking-widest leading-none">{throughput}</span>
                                )}
                            </div>
                            <span className="ml-auto text-[11px] font-black font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{installProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-amber-50 rounded-full overflow-hidden border border-amber-200 p-[2px] shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${installProgress}%` }}
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                            />
                        </div>
                        {lastLog && (
                            <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Terminal className="w-2.5 h-2.5 text-cyan-400" />
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Registry Feed</span>
                                </div>
                                <p className="text-[8px] font-mono text-slate-300 truncate leading-relaxed">
                                    {lastLog}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-purple-100 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                            {managerIcon.image ? (
                                <img src={managerIcon.image} className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <span className="text-[11px]">{managerIcon.icon}</span>
                            )}
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{pkg.manager}</span>
                        </div>
                        <span className="text-[12px] font-bold font-mono text-slate-900 tabular-nums">{formatBytes(pkg.size)}</span>
                    </div>

                    {(hasUpdate || isPending) && !isInstalling && (
                        <div className="flex-shrink-0">
                            <Button
                                size="sm"
                                onClick={handleUpdate}
                                className={`h-8 px-3 ${isPending ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50' : 'bg-amber-400 hover:bg-amber-500 text-black shadow-amber-200/50'} text-[10px] font-black uppercase rounded-xl shadow-lg border border-slate-500/10 transition-all active:scale-95 group/up`}
                            >
                                {isPending ? <Download className="w-3.5 h-3.5 mr-1 group-hover/up:translate-y-0.5 transition-transform" /> : <ArrowUp className="w-3.5 h-3.5 mr-1 group-hover/up:-translate-y-0.5 transition-transform" />} 
                                {isPending ? 'Install' : 'Update'}
                            </Button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleOpenFolder}
                    className="flex items-center gap-2 px-2 py-1.5 w-full hover:bg-indigo-50 rounded-xl transition-colors group/path text-left"
                >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400 group-hover/path:text-indigo-500" />
                    <span className="text-[10px] font-mono text-slate-600 truncate tracking-tight">{pkg.path}</span>
                </button>
            </div>

        </div>
    )
})



function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '0 B'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
