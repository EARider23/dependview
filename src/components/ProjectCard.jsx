import React, { useRef, useCallback } from 'react'
import { Folder, HardDrive, FolderMinus, Calendar, ArrowRight, Zap, ExternalLink, Activity, Layout, FolderUp } from 'lucide-react'
import { isTauri, mockConvertFileSrc } from '../lib/browserMock'
import { getTechIcon } from '../assets/iconLinks'
import { Badge } from './ui/badge'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

const _isTauri = isTauri()
let convertFileSrc = mockConvertFileSrc
if (_isTauri) {
    import('@tauri-apps/api/core').then(m => { convertFileSrc = m.convertFileSrc })
}

export function ProjectCard({ project, onClick, onRemove, viewMode = 'grid', isTop = false }) {
    const techStack = project.technologies || []
    const normPath = (p) => (p || '').replace(/\\/g, '/')
    const folderName = normPath(project.path).split('/').pop()
    const cardRef = useRef(null)
    const logoRef = useRef(null)

    // GSAP hover micro-animation on card
    const handleMouseEnter = useCallback(() => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                boxShadow: '0 24px 56px rgba(147, 51, 234, 0.1), 0 4px 16px rgba(0, 0, 0, 0.04)',
                duration: 0.4,
                ease: 'power2.out',
            })
        }
        if (logoRef.current) {
            gsap.to(logoRef.current, {
                scale: 1.08,
                duration: 0.3,
                ease: 'back.out(1.7)',
            })
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                boxShadow: '0 8px 32px rgba(147, 51, 234, 0.04), 0 2px 8px rgba(0, 0, 0, 0.03)',
                duration: 0.4,
                ease: 'power2.out',
            })
        }
        if (logoRef.current) {
            gsap.to(logoRef.current, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out',
            })
        }
    }, [])

    if (viewMode === 'list') {
        return (
            <div
                ref={cardRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={onClick}
                className="group relative rounded-[1.5rem] glass-card shimmer-hover hover:bg-white/60 transition-all duration-300 cursor-pointer overflow-hidden flex items-center gap-4 p-3"
            >
                <div className="relative shrink-0">
                    <div ref={logoRef} className="w-12 h-12 rounded-[1rem] bg-[#FFC107] shadow-md flex items-center justify-center text-white border-2 border-white/40 overflow-hidden group-hover:scale-105 transition-transform">
                        {project.logo ? (
                            <img src={convertFileSrc(project.logo)} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="font-black text-xl">
                                {project.name?.charAt(0).toUpperCase() || 'P'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="truncate flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-base text-purple-600 truncate tracking-tight">
                                {project.name}
                            </h3>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-full">
                                {project.technologies?.slice(0, 1).join(' • ') || 'WORKSPACE'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Package Manager Tag */}
                            <div className="flex items-center gap-1 text-gray-500 bg-white/40 px-2 py-0.5 rounded-md border border-white/50 shadow-sm">
                                <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">{project.manager || 'npm'}</span>
                            </div>

                            {/* Folder Path & Open Button */}
                            <div className="flex items-center gap-1 text-gray-500 bg-white/40 pl-2 pr-0.5 py-0.5 rounded-md border border-white/50 shadow-sm max-w-[150px]">
                                <Folder className="w-3 h-3 text-purple-400 shrink-0" />
                                <span className="text-[9px] font-mono truncate" title={normPath(project.path)}>
                                    {folderName || '...'}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); /* TODO Implement open project location */ }}
                                    className="w-5 h-5 ml-1 rounded bg-white hover:bg-purple-50 flex items-center justify-center text-purple-500 hover:text-purple-600 transition-colors shadow-sm shrink-0 border border-purple-100/30"
                                    title="Open Location"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 px-2">
                        <button
                            title="Remove Project"
                            onClick={(e) => { e.stopPropagation(); onRemove && onRemove(project.path); }}
                            className="w-8 h-8 rounded-lg bg-white/40 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 no-hover"
                        >
                            <FolderMinus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (viewMode === 'stack') {
        return (
            <div className={`w-full h-full rounded-[2.5rem] flex flex-col p-5 relative group overflow-hidden transition-all duration-500 bg-white/95 backdrop-blur-2xl border-2 shimmer-hover ${isTop ? 'shadow-[0_30px_60px_-15px_rgba(147,51,234,0.4)] border-purple-200/80 scale-100 z-10' : 'scale-[0.98] opacity-95 border-purple-100/40 shadow-xl'}`}>
                
                {/* Decorative Background Glows */}
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-400/20 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-yellow-400/10 rounded-full blur-[60px] pointer-events-none" />

                {/* Top Bar: Remove & Date */}
                <div className="flex justify-between items-center w-full z-10 relative px-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove && onRemove(project.path); }}
                        className="w-9 h-9 rounded-xl bg-white/40 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all border border-transparent hover:border-red-100 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 no-hover"
                        title="Remove project from PEEAK"
                    >
                        <FolderMinus className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold bg-white/30 px-2.5 py-1 rounded-lg border border-white/50 backdrop-blur-md shadow-sm">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[8px] uppercase tracking-widest">
                            {project.lastScanned ? new Date(project.lastScanned).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase() : 'NO DATE'}
                        </span>
                    </div>
                </div>

                {/* Center Content: Logo & Title */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 mt-1">
                    <div className="relative mb-4 group-hover:-translate-y-1.5 transition-transform duration-500">
                        <div className="w-28 h-28 rounded-[2rem] bg-[#FFC107] shadow-xl flex items-center justify-center text-white overflow-hidden border-[4px] border-white/60">
                            {project.logo ? (
                                <img src={convertFileSrc(project.logo)} alt={project.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="font-black text-5xl">
                                    {project.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                            )}
                        </div>
                        {/* Status dot */}
                        <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                           <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>

                    <h3 className="font-black text-[1.75rem] text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 tracking-tight mb-2 text-center px-1 leading-tight line-clamp-2 min-h-[60px] flex items-center justify-center">
                        {project.name}
                    </h3>
                    
                    <div className="flex flex-wrap justify-center gap-1.5 mb-2 w-full px-2">
                        {project.technologies && project.technologies.length > 0 ? (
                            project.technologies.slice(0, 3).map((tech, i) => (
                                <span key={i} className="text-[9px] text-purple-600 font-black uppercase tracking-widest bg-purple-50/80 px-3 py-1 rounded-full border border-purple-100/50 shadow-sm backdrop-blur-sm truncate max-w-full">
                                    {tech}
                                </span>
                            ))
                        ) : (
                            <span className="text-[9px] text-purple-600 font-black uppercase tracking-widest bg-purple-50/80 px-3 py-1 rounded-full border border-purple-100/50 shadow-sm backdrop-blur-sm">
                                WORKSPACE
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom Bar: Sleek Unified Pill */}
                <div className="flex items-center justify-between w-full bg-white/70 backdrop-blur-xl rounded-[1.25rem] p-1.5 border border-white shadow-sm relative z-10 mt-auto">
                    
                    {/* Info Group */}
                    <div className="flex items-center gap-2.5 pl-2.5 overflow-hidden">
                        {/* Manager Dot with Pulse */}
                        <div className="flex items-center gap-1.5 shrink-0" title={`Manager: ${project.manager || 'npm'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{project.manager || 'npm'}</span>
                        </div>

                        {/* Subtle Divider */}
                        <div className="w-[1px] h-3 bg-gray-300/50 shrink-0"></div>

                        {/* Path Info */}
                        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                            <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-[10px] font-mono tracking-tight truncate max-w-[90px]" title={normPath(project.path)}>
                                {folderName || '...'}
                            </span>
                        </div>
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); /* TODO Implement open project location */ }}
                            className="w-8 h-8 rounded-[0.8rem] bg-transparent hover:bg-white flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors shrink-0 no-hover"
                            title="Open Location"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <motion.button 
                            onClick={onClick} 
                            className="w-10 h-10 rounded-[0.9rem] bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 no-hover"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
        )
    }

    // Grid View — Glassmorphic Vertical Card with GSAP hover
    return (
        <div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className="group relative w-full rounded-[2.5rem] glass-card shimmer-hover p-6 hover:bg-white/60 transition-all duration-500 cursor-pointer flex flex-col items-center text-center min-h-[300px]"
        >
            {/* Remove Action (Top Right) */}
            <div className="absolute top-5 right-5 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove && onRemove(project.path); }}
                    className="w-8 h-8 rounded-xl bg-white/40 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all border border-transparent hover:border-red-100 flex items-center justify-center shadow-sm no-hover"
                    title="Remove project from PEEAK"
                >
                    <FolderMinus className="w-4 h-4" />
                </button>
            </div>

            {/* Logo Section */}
            <div className="mb-4 mt-2">
                <div ref={logoRef} className="w-20 h-20 rounded-[1.8rem] bg-[#FFC107] shadow-lg flex items-center justify-center overflow-hidden border-4 border-white/60">
                    {project.logo ? (
                        <img src={convertFileSrc(project.logo)} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-white font-black text-3xl">
                            {project.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                    )}
                </div>
            </div>

            {/* Project Info */}
            <div className="flex-1 flex flex-col items-center w-full">
                <h3 className="font-black text-[22px] text-purple-600 tracking-tight leading-tight mb-2 truncate w-full px-2">
                    {project.name}
                </h3>
                
                {/* Tech Stack & Status */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 w-full">
                    <motion.div 
                      className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" 
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                        {project.technologies?.slice(0, 2).join(' • ') || 'WORKSPACE'}
                    </span>
                </div>

                {/* Developer Details */}
                <div className="flex items-center justify-center gap-3 w-full mb-6">
                    {/* Package Manager Tag */}
                    <div className="flex items-center gap-1.5 text-gray-500 bg-white/40 px-2.5 py-1.5 rounded-lg border border-white/50 shadow-sm" title="Package Manager">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{project.manager || 'npm'}</span>
                    </div>

                    {/* Folder Path & Open Button */}
                    <div className="flex items-center gap-1.5 text-gray-500 bg-white/40 pl-2.5 pr-1 py-1 rounded-lg border border-white/50 shadow-sm max-w-[150px]">
                        <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-[10px] font-mono truncate" title={normPath(project.path)}>
                            {folderName || '...'}
                        </span>
                        {/* Simple Open Location Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); /* TODO Implement open project location */ }}
                            className="w-6 h-6 ml-1 rounded-md bg-white hover:bg-purple-50 flex items-center justify-center text-purple-500 hover:text-purple-600 transition-colors shadow-sm shrink-0 border border-purple-100/30"
                            title="Open Location"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Date Footer */}
                <div className="mt-auto w-full flex items-center justify-between pt-1">
                    <div className="bg-purple-50 px-2 py-1 rounded-md border border-purple-100/50">
                        <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">MASTER</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[8px] uppercase tracking-widest">
                            {project.lastScanned ? new Date(project.lastScanned).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase() : 'NO DATE'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
