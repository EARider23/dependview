import React, { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { RefreshCw, Trash2, Info, ArrowUp, Loader2, CheckCircle, MoreVertical, Undo2, Download, X, Package, Layers, ExternalLink, HardDrive, Terminal, Play } from 'lucide-react'
import { Progress } from './ui/progress'
import { getTechIcon, getPackageIcon } from '../assets/iconLinks'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function PackageCard({ pkg, selected, onToggle, onUpdate, onDelete, onRevert, hasUpdate, latestVersion, isInstalling, installProgress, viewMode = 'grid', verified = false, versionHistory = [], projectPath, venvPath, onMigratePackage }) {
    const [showPathTooltip, setShowPathTooltip] = useState(false)
    const isNpm = pkg.manager === 'npm'
    const isPip = pkg.manager === 'pip'

    const normPath = (p) => (p || '').replace(/\\/g, '/')
    const isIsolated = projectPath ? (normPath(pkg.path).includes(normPath(projectPath)) || (venvPath && normPath(pkg.path).includes(normPath(venvPath)))) : true

    // Get icons
    const managerIcon = getTechIcon(pkg.manager)
    const packageIcon = getPackageIcon(pkg.name)

    // List view - compact horizontal layout
    if (viewMode === 'list') {
        return (
            <div className={`
                relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200
                ${selected
                    ? 'border-purple-400 bg-purple-50 shadow-md'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                }
            `}>
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggle(pkg.path)}
                    className="h-4 w-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 shadow-sm bg-white flex-shrink-0"
                />

                <div className="flex-shrink-0 relative">
                    {pkg.icon ? (
                        <img src={pkg.icon} alt={pkg.name} className="w-8 h-8 rounded object-contain bg-gray-50 p-0.5" />
                    ) : packageIcon && packageIcon.image ? (
                        <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-50 p-0.5">
                            <img src={packageIcon.image} alt={pkg.name} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${isNpm ? 'bg-red-50' : 'bg-blue-50'}`}>
                            {packageIcon ? packageIcon.icon : (isNpm ? '📦' : isPip ? '🐍' : '📚')}
                        </div>
                    )}
                    {isInstalling && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white rounded">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 truncate" title={pkg.name}>
                        {pkg.name}
                    </h3>
                    {verified && (
                        <div className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    )}
                    {isInstalling && viewMode === 'list' && (
                        <div className="ml-2 flex items-center gap-2 w-28">
                            <div className="w-full">
                                <Progress value={installProgress || 0} className="h-2" />
                            </div>
                            <span className="text-xs text-blue-600 font-medium">{installProgress}%</span>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 text-xs text-gray-600 font-medium">
                    {latestVersion ? (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">v{pkg.version}</span>
                            <ArrowUp className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-yellow-700 font-semibold">v{latestVersion}</span>
                        </div>
                    ) : (
                        <>v{pkg.version}</>
                    )}
                </div>

                <div className="flex-shrink-0 text-xs text-gray-600 font-medium min-w-[60px] text-right">
                    {formatBytes(pkg.size)}
                </div>

                <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm ${isNpm ? 'bg-red-100/80 text-red-800' : isPip ? 'bg-blue-100/80 text-blue-800' : 'bg-purple-100/80 text-purple-800'}`}>
                    {managerIcon.image ? (
                        <img src={managerIcon.image} alt={pkg.manager} className="w-3 h-3 object-contain" />
                    ) : (
                        <span className="text-xs">{managerIcon.icon}</span>
                    )}
                    <span className="text-xs font-bold uppercase">{pkg.manager}</span>
                </div>

                <div className="relative flex-shrink-0">
                    <Info
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                        onMouseEnter={() => setShowPathTooltip(true)}
                        onMouseLeave={() => setShowPathTooltip(false)}
                    />
                    {showPathTooltip && (
                        <div className="absolute right-0 bottom-full mb-2 w-96 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 font-mono">
                            {pkg.path}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {hasUpdate && (
                        <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-md"
                            onClick={(e) => { e.stopPropagation(); onUpdate(pkg.name); }}
                            disabled={isInstalling}
                        >
                            {isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowUp className="w-3 h-3 mr-1" /> Update</>}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs hover:bg-gray-100" disabled={isInstalling}>
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {versionHistory && versionHistory.length > 0 && (
                                <>
                                    {versionHistory.slice().reverse().map((version, idx) => (
                                        <DropdownMenuItem key={idx} onClick={() => onRevert(pkg.name, version)} className="text-blue-600">
                                            <Undo2 className="w-3.5 h-3.5 mr-2" /> Revert to v{version}
                                        </DropdownMenuItem>
                                    ))}
                                    <div className="border-t my-1"></div>
                                </>
                            )}
                            <DropdownMenuItem onClick={() => onDelete(pkg.path)} className="text-red-600">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )
    }

    // Grid view - compact card layout (Image 4 Style)
    return (
        <div className={`
      relative p-4 rounded-3xl border transition-all duration-300 group
      ${selected
                ? 'border-purple-400 bg-purple-50/80 backdrop-blur-xl shadow-lg scale-[1.01]'
                : 'border-white/40 bg-white/60 backdrop-blur-xl shadow-sm hover:border-purple-200 hover:shadow-xl hover:scale-[1.01]'
            }
    `}>
            {/* Action Overlay */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggle(pkg.path)}
                    className="h-4 w-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 shadow-sm bg-white"
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Left: Icon (Image 4) */}
                <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-50 flex items-center justify-center p-2.5 overflow-hidden group-hover:scale-105 transition-transform">
                        {pkg.icon ? (
                            <img src={pkg.icon} alt={pkg.name} className="w-full h-full object-contain" />
                        ) : packageIcon && packageIcon.image ? (
                            <img src={packageIcon.image} alt={pkg.name} className="w-full h-full object-contain" />
                        ) : (
                            <div className={`w-full h-full rounded-xl flex items-center justify-center text-xl ${isNpm ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                {packageIcon ? packageIcon.icon : (isNpm ? '📦' : isPip ? '🐍' : '📚')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-black text-[13px] text-gray-900 truncate leading-none" title={pkg.name}>
                            {pkg.name}
                        </h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 text-gray-300 hover:text-gray-900 transition-colors">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {versionHistory?.length > 0 && (
                                    <>
                                        {versionHistory.slice().reverse().map((v, i) => (
                                            <DropdownMenuItem key={i} onClick={() => onRevert(pkg.name, v)} className="text-blue-600">
                                                <Undo2 className="w-3.5 h-3.5 mr-2" /> Revert to v{v}
                                            </DropdownMenuItem>
                                        ))}
                                        <div className="border-t my-1" />
                                    </>
                                )}
                                <DropdownMenuItem onClick={() => onDelete(pkg.path)} className="text-red-600">
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">v{pkg.version}</span>
                        {hasUpdate && (
                            <div className="flex items-center gap-0.5 text-amber-600 font-bold text-[9px] animate-pulse">
                                <ArrowUp className="w-2.5 h-2.5" />
                                <span>v{latestVersion}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded-md ${isNpm ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center p-0.5 border border-white`}>
                                {managerIcon.image ? <img src={managerIcon.image} className="w-full h-full object-contain" /> : <span className="text-[8px]">{managerIcon.icon}</span>}
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{formatBytes(pkg.size)}</span>
                        </div>
                        {isInstalling && (
                            <div className="flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 text-purple-600 animate-spin" />
                                <span className="text-[9px] font-black text-purple-600">{installProgress}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Path Tooltip (Subtle) */}
            <div className="mt-3 pt-3 border-t border-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <Info className="w-3 h-3 text-gray-200" />
                    <span className="font-mono text-[9px] text-gray-300 truncate">{pkg.path}</span>
                </div>
                {hasUpdate && !isInstalling && (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onUpdate(pkg.name); }}
                        className="h-6 px-3 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-purple-200"
                    >
                        Update
                    </Button>
                )}
            </div>
        </div>
    )
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
