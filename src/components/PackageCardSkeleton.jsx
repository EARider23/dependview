import React from 'react'

export const PackageCardSkeleton = ({ viewMode = 'grid' }) => {
    if (viewMode === 'list') {
        return (
            <div className="relative flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-slate-50 bg-white/50 animate-pulse">
                <div className="w-4 h-4 rounded bg-slate-200" />
                <div className="w-8 h-8 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-2 w-48 bg-slate-100 rounded" />
                </div>
                <div className="w-16 h-4 bg-slate-100 rounded" />
            </div>
        )
    }

    return (
        <div className="relative p-5 rounded-2xl border-2 border-slate-50 bg-white/50 space-y-5 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="w-4.5 h-4.5 rounded bg-slate-200" />
                <div className="w-16 h-5 rounded-full bg-slate-100" />
            </div>
            
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
            </div>

            <div className="space-y-3">
                <div className="h-10 w-full bg-slate-50 rounded-2xl" />
                <div className="h-3 w-3/4 bg-slate-50 rounded-lg" />
            </div>
        </div>
    )
}
