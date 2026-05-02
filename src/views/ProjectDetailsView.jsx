import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, RefreshCw, HardDrive, ShieldCheck, Zap, 
  History, Info, Search, X, Box, Square, Menu, Trash2, ArrowUpCircle, Plus 
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { PackageCard } from '../components/PackageCard'
import { getTechIcon } from '../assets/iconLinks'

import { useProject } from '../hooks/useProject'
import { useRef } from 'react'
import { TrendingUp } from 'lucide-react'

const ProjectDetailsView = ({
  currentProject,
  showToast,
  setViewMode,
  AnimatedCounter,
  formatBytes
}) => {
  const [packageView, setPackageView] = React.useState('grid')
  const {
    scanResult,
    auditResult,
    isLoadingAudit,
    projectTechnologies,
    projectScripts,
    outdatedCount,
    venvPath,
    isScanning,
    busy,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    selectedPackages,
    setSelectedPackages,
    installingPackages,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    topPackages,
    filteredPackages,
    scan,
    handleSearch,
    handleInstall,
    handleUpdate,
    handleDelete,
    handleUpdateSelected,
    handleUpdateAll,
    togglePackage,
    installingPackagesHasPath
  } = useProject(currentProject, showToast)

  const searchInputRef = useRef(null)

  return (
    <motion.div
      key="project"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-20"
    >
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
          <Button
            onClick={() => setViewMode('dashboard')}
            variant="ghost"
            className="group w-12 h-12 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/80 transition-all shadow-xl shadow-black/5 p-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Project Workspace</span>
              <div className="h-px w-8 bg-purple-200" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{currentProject.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={() => scan(currentProject)}
            disabled={busy}
            className="flex-1 md:flex-none h-12 px-6 bg-white/60 backdrop-blur-md text-gray-900 border border-white/40 shadow-xl shadow-black/5 rounded-2xl transition-all active:scale-95 font-bold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${busy ? 'animate-spin' : ''}`} />
            Sync Environment
          </Button>
        </div>
      </div>

      {(() => {
        const totalSize = scanResult?.total_size || 0
        const pkgCount = scanResult?.packages?.length || 0
        const vulnData = auditResult?.vulnerabilities || []
        const totalVulns = vulnData.reduce((acc, v) => acc + (v.count || 0), 0)

        return (
          <>
            {/* Bento Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Packages Metric */}
              <div className="metric-card bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Box size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Inventory</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-gray-900 mb-1">
                    <AnimatedCounter value={pkgCount} />
                  </span>
                  <span className="text-xs font-bold text-gray-400">Total Packages Installed</span>
                </div>
              </div>

              {/* Update Status Metric */}
              <div className="metric-card bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Maintenance</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-4xl font-black mb-1 ${outdatedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <AnimatedCounter value={outdatedCount} />
                  </span>
                  <span className="text-xs font-bold text-gray-400">Updates Pending</span>
                </div>
              </div>

              {/* Security Status Metric */}
              <div className="metric-card bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${totalVulns > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Security</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-4xl font-black mb-1 ${totalVulns > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {totalVulns > 0 ? totalVulns : 'Clean'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">Vulnerabilities Detected</span>
                </div>
              </div>

              {/* Storage Metric */}
              <div className="metric-card bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <HardDrive size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center text-white shadow-lg">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Footprint</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-gray-900 mb-1">
                    <AnimatedCounter value={totalSize} formatter={formatBytes} />
                  </span>
                  <span className="text-xs font-bold text-gray-400">Total Disk Space Consumed</span>
                </div>
              </div>
            </div>

            {/* Quick Injector (Image 1 Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/40 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Zap size={140} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 w-full space-y-6">
                      <div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Quick <span className="text-purple-600">Injector</span></h3>
                        <p className="text-gray-500 font-medium">Inject new capabilities into your codebase instantly.</p>
                      </div>

                      <div className="flex-1 w-full relative">
                        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-lg border border-gray-100">
                          <Input
                            ref={searchInputRef}
                            placeholder="Search & install package (e.g., lodash, axios)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && searchQuery) {
                                handleSearch();
                              }
                            }}
                            className="flex-1 h-12 bg-transparent border-0 focus-visible:ring-0 text-sm font-medium px-4"
                          />
                          <Button
                            onClick={handleSearch}
                            disabled={busy || !searchQuery}
                            className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-200"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                          </Button>
                        </div>

                        {/* Results dropdown with Animation */}
                        <AnimatePresence>
                          {searchResults && searchResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute left-0 right-0 top-full mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 max-h-[400px] overflow-y-auto"
                            >
                              <div className="flex items-center justify-between px-3 mb-3">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Registry Results</span>
                                <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)} className="h-6 w-6 p-0 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {searchResults.map((pkg, i) => (
                                  <div key={i} className="group/item flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-purple-200 hover:bg-purple-50/50 transition-all">
                                    <div className="flex items-center gap-4 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">
                                        {getTechIcon(pkg.name).image ? <img src={getTechIcon(pkg.name).image} className="w-6 h-6 object-contain" /> : '📦'}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">{pkg.name}</h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">v{pkg.version}</span>
                                          {pkg.download_count && <span className="text-[9px] font-bold text-gray-400">{pkg.download_count.toLocaleString()} installs</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleInstall(pkg.name, pkg.version)}
                                      className="h-8 w-8 p-0 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:shadow-md transition-all"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Intelligence Card */}
              <div className="metric-card bg-gray-900 rounded-[2.5rem] p-10 border border-gray-800 shadow-2xl shadow-purple-900/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <History size={140} className="text-purple-500" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Project <span className="text-purple-400">Intel</span></h3>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {projectTechnologies.map(tech => (
                        <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                          {tech.image && <img src={tech.image} className="w-4 h-4 object-contain opacity-80" alt="" />}
                          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{tech.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">Active Scripts</span>
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{Object.keys(projectScripts).length} total</span>
                      </div>
                      <div className="flex -space-x-2">
                        {Object.keys(projectScripts).slice(0, 3).map((s, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-gray-900 flex items-center justify-center text-[10px] font-black text-purple-400">
                            {s[0].toUpperCase()}
                          </div>
                        ))}
                        {Object.keys(projectScripts).length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[8px] font-black text-white/40">
                            +{Object.keys(projectScripts).length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Analytics (Image 1 Style - now moved below) */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-12">
               {/* TOP 5 STORAGE CONSUME PACKAGE (UI same as requested) */}
               <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Storage Analytics</span>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-black px-3 py-1 rounded-xl">
                      Top 5 Consumers
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {topPackages.map((pkg, i) => (
                      <div key={i} className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center font-black text-xs text-gray-400">
                            {i+1}
                          </div>
                          <span className="font-bold text-gray-900 text-xs truncate">{pkg.name}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[14px] font-black text-purple-600">
                            <AnimatedCounter value={pkg.size} formatter={formatBytes} delay={0.4 + (i * 0.1)} />
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(pkg.size / (topPackages[0]?.size || 1)) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="sticky top-6 z-40 mb-12 flex justify-center">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/60 flex items-center gap-2 max-w-full overflow-x-auto">
                <div className="flex items-center gap-1.5 px-4 mr-2 border-r border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${scanResult?.packages?.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engine Online</span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-50/50 rounded-xl border border-gray-100">
                  <Search className="w-3.5 h-3.5 ml-2 text-gray-400" />
                  <Input
                    placeholder="Filter..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="h-8 w-32 md:w-48 bg-transparent border-0 focus-visible:ring-0 text-[11px] font-bold"
                  />
                </div>

                <div className="flex border-l border-gray-100 pl-2 gap-2">
                  <Button
                    variant={sortBy === 'name' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('name')}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Name
                  </Button>
                  <Button
                    variant={sortBy === 'size' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('size')}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Size
                  </Button>
                </div>

                <div className="border-l border-gray-100 pl-2 flex gap-2">
                  <Button
                    size="sm"
                    className="h-9 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 no-hover"
                    onClick={() => handleUpdateAll()}
                    disabled={outdatedCount === 0 || busy}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${busy ? 'animate-spin' : ''}`} />
                    Update All
                  </Button>
                </div>

                {selectedPackages.size > 0 && (
                  <div className="border-l border-gray-100 pl-2 animate-in slide-in-from-right-4">
                    <div className="flex gap-2 p-1 bg-red-50/50 border border-red-100 rounded-xl">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-4 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-[10px] uppercase tracking-widest"
                        onClick={async () => {
                          const toDelete = scanResult?.packages?.filter(p => selectedPackages.has(p.path)) || []
                          if (toDelete.length === 0) return
                          if (!confirm(`Are you sure you want to purge ${toDelete.length} packages?`)) return
                          for (const p of toDelete) await handleDelete(p.name)
                          setSelectedPackages(new Set())
                          showToast(`Deleted ${toDelete.length} package(s)`, 'success')
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Purge ({selectedPackages.size})
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest border-0"
                        onClick={async () => {
                          const toUpdate = scanResult?.packages?.filter(p => selectedPackages.has(p.path)) || []
                          if (toUpdate.length === 0) return
                          await handleUpdateSelected(toUpdate)
                          setSelectedPackages(new Set())
                        }}
                        disabled={Array.from(selectedPackages).some(path => installingPackagesHasPath(path))}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5 mr-2" />
                        Update ({selectedPackages.size})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Title Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-1">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                  <Box className="w-8 h-8 text-purple-600" />
                  Project <span className="text-purple-600">Inventory</span>
                </h3>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] ml-12">Precision Managed Dependencies</p>
              </div>

              <div className="flex border border-white/40 rounded-2xl bg-white/40 backdrop-blur-md p-1 shadow-inner h-12">
                <Button
                  variant={packageView === 'grid' ? 'outline' : 'ghost'}
                  size="icon"
                  onClick={() => setPackageView('grid')}
                  className={`h-10 w-10 rounded-xl transition-all ${packageView === 'grid' ? 'shadow-sm text-purple-600' : 'text-gray-400'}`}
                >
                  <Square className="w-5 h-5" />
                </Button>
                <Button
                  variant={packageView === 'list' ? 'outline' : 'ghost'}
                  size="icon"
                  onClick={() => setPackageView('list')}
                  className={`h-10 w-10 rounded-xl transition-all ${packageView === 'list' ? 'shadow-sm text-purple-600' : 'text-gray-400'}`}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Package Viewport */}
            <div className="min-h-[500px]">
              {filteredPackages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-gray-200">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                    <Box size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-2">No Packages Detected</h4>
                  <p className="text-gray-400 font-medium text-center max-w-xs">Try running a sync or check your project directory for package manifests.</p>
                  <Button onClick={() => scan(currentProject)} variant="outline" className="mt-8 rounded-2xl px-8 h-12 font-black text-[11px] uppercase tracking-widest border-gray-200">
                    <RefreshCw className="w-3 h-3 mr-2" /> Sync Project Now
                  </Button>
                </div>
              ) : (
                (() => {
                  const declaredPackages = filteredPackages.filter(p => p.is_declared)
                  const subDependencies = filteredPackages.filter(p => !p.is_declared)

                  return (
                    <div className="space-y-12">
                      {/* Project Dependencies */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-4 px-1">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Project Dependencies</h4>
                          <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
                          <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-black rounded-lg">
                            {declaredPackages.length}
                          </Badge>
                        </div>

                        {packageView === 'grid' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {declaredPackages.map(pkg => (
                              <PackageCard
                                key={pkg.path}
                                pkg={pkg}
                                venvPath={venvPath}
                                onUpdate={() => handleUpdate(pkg.name)}
                                onDelete={() => handleDelete(pkg.name)}
                                onToggle={() => togglePackage(pkg.path)}
                                isSelected={selectedPackages.has(pkg.path)}
                                isInstalling={installingPackagesHasPath(pkg.path)}
                                progress={installingPackages.get(pkg.name)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {declaredPackages.map(pkg => (
                              <PackageCard
                                key={pkg.path}
                                pkg={pkg}
                                viewMode="list"
                                venvPath={venvPath}
                                onUpdate={() => handleUpdate(pkg.name)}
                                onDelete={() => handleDelete(pkg.name)}
                                onToggle={() => togglePackage(pkg.path)}
                                isSelected={selectedPackages.has(pkg.path)}
                                isInstalling={installingPackagesHasPath(pkg.path)}
                                progress={installingPackages.get(pkg.name)}
                              />
                            ))}
                          </div>
                        )}
                      </section>

                      {/* Sub-Dependencies */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-4 px-1">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Sub Dependencies</h4>
                          <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
                          <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-100 font-black rounded-lg">
                            {subDependencies.length}
                          </Badge>
                        </div>

                        {packageView === 'grid' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {subDependencies.map(pkg => (
                              <PackageCard
                                key={pkg.path}
                                pkg={pkg}
                                venvPath={venvPath}
                                onUpdate={() => handleUpdate(pkg.name)}
                                onDelete={() => handleDelete(pkg.name)}
                                onToggle={() => togglePackage(pkg.path)}
                                isSelected={selectedPackages.has(pkg.path)}
                                isInstalling={installingPackagesHasPath(pkg.path)}
                                progress={installingPackages.get(pkg.name)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {subDependencies.map(pkg => (
                              <PackageCard
                                key={pkg.path}
                                pkg={pkg}
                                viewMode="list"
                                venvPath={venvPath}
                                onUpdate={() => handleUpdate(pkg.name)}
                                onDelete={() => handleDelete(pkg.name)}
                                onToggle={() => togglePackage(pkg.path)}
                                isSelected={selectedPackages.has(pkg.path)}
                                isInstalling={installingPackagesHasPath(pkg.path)}
                                progress={installingPackages.get(pkg.name)}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  )
                })()
              )}
            </div>
          </>
        )
      })()}
    </motion.div>
  )
}

export default ProjectDetailsView
