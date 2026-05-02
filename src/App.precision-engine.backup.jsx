import React, { useState, useEffect, useRef } from 'react'
import { isTauri, mockInvoke, mockConvertFileSrc, setupMockEventListeners, seedDemoProjects } from './lib/browserMock'

// Conditional imports: use real Tauri APIs in Tauri, mocks in browser
const _isTauri = isTauri()
let invoke, convertFileSrc
if (_isTauri) {
  const tauriCore = await import('@tauri-apps/api/core')
  invoke = tauriCore.invoke
  convertFileSrc = tauriCore.convertFileSrc
} else {
  invoke = mockInvoke
  convertFileSrc = mockConvertFileSrc
  console.log('%c[BROWSER MODE] Running with mock data — Tauri APIs not available', 'color: #a855f7; font-weight: bold; font-size: 14px;')
}

let open = async () => null
if (_isTauri) {
  const dialogMod = await import('@tauri-apps/plugin-dialog')
  open = dialogMod.open
}

// In browser mode, seed demo projects so the UI has data to display
seedDemoProjects()
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Toaster, toast as sonnerToast } from 'sonner'
import { FolderOpen, Package, Layers, Search, ArrowLeft, Menu, CheckSquare, Square, Download, ChevronDown, ChevronUp, RefreshCw, HardDrive, Trash2, FolderMinus, X, ShieldCheck, Zap, History, Info, Bell, Settings, Plus, AlertTriangle, Play, Terminal, Shield, ExternalLink, TrendingUp, ArrowUpCircle, Box } from 'lucide-react'
import { SettingsDialog } from './components/SettingsDialog'
import { ProjectCreationStudio } from './components/ProjectCreationStudio'
import { PackageCard } from './components/PackageCard'
import UpdateFailureDialog from './components/UpdateFailureDialog'
import { RiskyUpdateDialog } from './components/RiskyUpdateDialog'
import { ProjectCard } from './components/ProjectCard'
import { ProjectSelectorDialog } from './components/ProjectSelectorDialog'
import { UninstallProjectDialog } from './components/UninstallProjectDialog'
import { ProjectUpdateDialog } from './components/ProjectUpdateDialog'
import { ImportProgressDialog } from './components/ImportProgressDialog'
import { UpdatePromptDialog } from './components/UpdatePromptDialog'
import { getTechIcon } from './assets/iconLinks'
import { ProjectCardStack } from './components/ProjectCardStack'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import './styles.css'

const SOFTWARE_RELEASES = [
  {
    version: 'v0.5.0',
    date: '2026-01-13',
    title: 'Smart Maintenance & Health Hub',
    features: [
      'Smart Maintenance Hub: Recursive unused dependency detection',
      'System Cache Cleaner: One-click cleanup for NPM, PIP, and Cargo',
      'Release Records: Persistent history for projects and software updates',
      'Performance: Faster scan processing and improved memory safety'
    ]
  },
  {
    version: 'v0.4.0',
    date: '2026-01-12',
    title: 'Visual Excellence & Workspace Refinement',
    features: [
      'Enhanced UI: Solid color-coded headers for better visual separation',
      'Smart Logos: Dynamic logo detection and persistence for projects',
      'Workspace Restructuring: Logical grouping of toolchains and frameworks',
      'Installer 2.0: Deep integration with global package managers'
    ]
  },
  {
    version: 'v0.3.0',
    date: '2026-01-10',
    title: 'Core Engine Stability',
    features: [
      'Multi-Manager Support: Seamlessly switch between NPM, UV, and Pip',
      'Dependency Verification: Real-time validation of installed versions',
      'Risk Assessment: Early warning system for breaking dependency updates'
    ]
  }
]

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const AnimatedCounter = ({ value, formatter = (v) => Math.floor(v), duration = 1.2, delay = 0 }) => {
  const textRef = useRef(null);
  const proxy = useRef({ val: 0 });

  useGSAP(() => {
    // Restart from 0 to ensure the animation is visible
    proxy.current.val = 0;

    gsap.to(proxy.current, {
      val: value || 0,
      duration: duration,
      delay: delay,
      ease: "power2.out",
      onUpdate: () => {
        if (textRef.current) {
          textRef.current.innerText = formatter(proxy.current.val);
        }
      }
    });
  }, { dependencies: [value, delay] });

  return <span ref={textRef}>{formatter(0)}</span>;
};


const Top5Packages = ({ topPackages, scanResult, formatBytes, AnimatedCounter }) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (topPackages.length > 0) {
      // Staggered entry for the items
      gsap.fromTo(".top-5-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );

      // Animate the background bars filling up
      gsap.fromTo(".size-bar",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, delay: 0.4, ease: "power3.out", transformOrigin: "left" }
      );
    }
  }, { scope: containerRef, dependencies: [topPackages], revertOnUpdate: true });

  return (
    <div ref={containerRef} className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group mb-10">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <TrendingUp size={100} />
      </div>

      <div className="flex items-center justify-between mb-8 px-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Storage Analytics</span>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-black px-3 py-1 rounded-xl shadow-sm">
          Precision Metrics
        </Badge>
      </div>

      <div className="space-y-4 relative z-10">
        {topPackages.map((pkg, i) => {
          const maxVal = topPackages[0]?.size || 1;
          const percentage = (pkg.size / maxVal) * 100;

          return (
            <div key={i} className="top-5-item opacity-0 relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl p-5 border border-white/60 hover:border-purple-300 transition-all hover:bg-white/80 hover:shadow-2xl group/item">
              {/* Animated Background Bar - Glassmorphic style */}
              <div
                className="size-bar absolute left-0 top-0 bottom-0 bg-purple-500/[0.03] group-hover/item:bg-purple-500/[0.07] transition-all duration-700 rounded-r-2xl"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-lg border border-purple-50 flex items-center justify-center font-black text-xs text-purple-600 shrink-0 group-hover/item:scale-110 transition-transform duration-500">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-gray-900 block truncate pr-4 text-base tracking-tight">{pkg.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Efficiency Rank</span>
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      <span className="text-[9px] text-purple-500 font-black uppercase tracking-widest">{((pkg.size / (scanResult?.total_size || 1)) * 100).toFixed(1)}% Usage</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-gray-900 block tracking-tighter leading-none mb-1">
                    <AnimatedCounter value={pkg.size} formatter={formatBytes} delay={0.4 + (i * 0.1)} />
                  </span>
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-2 border border-white/50">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-1000 delay-500 shadow-[0_0_8px_rgba(147,51,234,0.4)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {topPackages.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/40 backdrop-blur-sm rounded-3xl h-20 w-full animate-pulse border border-white/60 shadow-sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


function App() {
  const [projects, setProjects] = useState([])
  const [projectViewMode, setProjectViewMode] = useState('grid')
  const importPendingRef = React.useRef(null)
  const skipVersionCheckRef = React.useRef(false)
  const [importingProject, setImportingProject] = useState(false)

  // Finalize import after update decision
  const finalizeImport = (newProject) => {
    setProjects(prev => {
      const exists = prev.find(p => p.path === newProject.path)
      if (exists) return prev
      const updated = [newProject, ...prev]
      localStorage.setItem('projects', JSON.stringify(updated))
      return updated
    })

    setCurrentProject(newProject)
    setViewMode('project')
    showToast(`Imported: ${newProject.name}`, 'success')
    setShowImportProgress(false)
    importPendingRef.current = null
    setImportingProject(false)
  }

  // Verify that a package's installed version matches expectedVersion by polling scanResult
  const verifyPackageVersion = async (packageName, expectedVersion, timeout = 20000) => {
    if (!currentProject) return false
    const deadline = Date.now() + timeout

    console.log(`[VERIFY] Starting verification for ${packageName}, expecting v${expectedVersion}`)

    // Trigger a rescan to refresh versions
    try { scan(currentProject) } catch (e) { console.error('rescan failed', e) }

    let attempts = 0
    while (Date.now() < deadline) {
      attempts++
      const p = scanResultRef.current?.packages?.find(x => x.name === packageName)

      if (attempts === 1 || attempts % 5 === 0) {
        console.log(`[VERIFY] Attempt ${attempts} for ${packageName}: found=${!!p}, currentVersion=${p?.version || 'null'}, expected=${expectedVersion}`)
      }

      if (p && p.version && expectedVersion && compareVersions(expectedVersion, p.version) === 0) {
        console.log(`[VERIFY] ✅ ${packageName} verified! Version matches: ${p.version}`)
        return true
      }
      // if p exists and version equals or greater
      if (p && p.version && expectedVersion && compareVersions(p.version, expectedVersion) >= 0) {
        console.log(`[VERIFY] ✅ ${packageName} verified! Version ${p.version} >= ${expectedVersion}`)
        return true
      }
      // wait a bit
      await new Promise(r => setTimeout(r, 1000))
    }
    console.error(`[VERIFY] ❌ ${packageName} verification TIMEOUT after ${attempts} attempts. Last seen version: ${scanResultRef.current?.packages?.find(x => x.name === packageName)?.version || 'not found'}`)
    return false
  }

  // Handle update prompt actions
  const handleImportUpdates = async (packages, frameworks) => {
    setShowUpdatePrompt(false)
    setShowImportProgress(true)
    setImportStage('checking')

    let successCount = 0
    let failedPackages = []

    // Update selected packages
    for (const pkg of packages) {
      try {
        await invoke('update_package', {
          packageManager: pkg.manager,
          packageName: pkg.name,
          projectPath: window.pendingImportProject.path,
          isGlobal: false
        })
        successCount++
      } catch (e) {
        console.error('Update failed for', pkg.name, ':', e)
        failedPackages.push(pkg.name)
      }
    }

    // Show results
    if (failedPackages.length > 0) {
      showToast(`⚠️ Updated ${successCount}/${packages.length} packages. Failed: ${failedPackages.join(', ')}`, 'error')
    } else if (successCount > 0) {
      showToast(`✅ Successfully updated ${successCount} package${successCount > 1 ? 's' : ''}`, 'success')
    }

    // Finalize import
    finalizeImport(window.pendingImportProject)
    delete window.pendingImportProject
  }

  const handleSkipImportUpdates = () => {
    setShowUpdatePrompt(false)
    finalizeImport(window.pendingImportProject)
    delete window.pendingImportProject
  }

  // Remove imported project (only removes from list/localStorage)
  const removeProject = (projectPath) => {
    const confirmed = window.confirm('Remove this project from imported list? This will not delete files on disk.')
    if (!confirmed) return
    const updated = projects.filter(p => p.path !== projectPath)
    setProjects(updated)
    localStorage.setItem('projects', JSON.stringify(updated))
    // If current project was removed, go back to dashboard
    if (currentProject && currentProject.path === projectPath) {
      setCurrentProject(null)
      setViewMode('dashboard')
    }
  }
  const [currentProject, setCurrentProject] = useState(null)
  const [viewMode, setViewMode] = useState('dashboard') // 'dashboard' | 'project' | 'system' | 'frameworks'
  const [scanResult, setScanResult] = useState(null)
  const [projectScripts, setProjectScripts] = useState({})
  const [auditResult, setAuditResult] = useState(null)
  const [outdatedCount, setOutdatedCount] = useState(0)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const scanResultRef = useRef(null)
  const lastScannedPathRef = useRef(null)
  const [frameworks, setFrameworks] = useState([])
  const [fastManagers, setFastManagers] = useState({ bun: false, uv: false, pnpm: false })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [selectedPackages, setSelectedPackages] = useState(new Set())
  const [packageView, setPackageView] = useState('grid') // 'grid' or 'list'
  const [isDeclaredOpen, setIsDeclaredOpen] = useState(true)
  const [isSubDepsOpen, setIsSubDepsOpen] = useState(true)
  const [filter, setFilter] = useState('')
  const [frameworkFilter, setFrameworkFilter] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'size'
  const [installingPackages, setInstallingPackages] = useState(new Map()) // packageName -> progress
  const [autoCheckUpdates, setAutoCheckUpdates] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [pendingInstall, setPendingInstall] = useState(null) // {packageName, packageManager}
  const [updateAvailable, setUpdateAvailable] = useState(new Map()) // packageName -> latestVersion
  const [packageVersionHistory, setPackageVersionHistory] = useState(new Map()) // packageName -> [version1, version2, ...] (oldest to newest)
  const [riskyUpdate, setRiskyUpdate] = useState(null) // {packageName, current, latest, reason}
  const [showRiskyUpdateDialog, setShowRiskyUpdateDialog] = useState(false)
  const [failedUpdates, setFailedUpdates] = useState([])
  const [showFailureDialog, setShowFailureDialog] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifiedPackages, setVerifiedPackages] = useState(new Set())
  const [showUninstallDialog, setShowUninstallDialog] = useState(false)
  const [projectTechnologies, setProjectTechnologies] = useState([])
  const [venvPath, setVenvPath] = useState(null)
  const [creatingVenv, setCreatingVenv] = useState(false)
  const [isMigratingEnv, setIsMigratingEnv] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updateCandidates, setUpdateCandidates] = useState([])
  const [showImportProgress, setShowImportProgress] = useState(false)
  const [importStage, setImportStage] = useState('scanning')
  const [importPackageCount, setImportPackageCount] = useState(0)
  const autoMigrateAttemptedRef = useRef(new Set())
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState({ packages: [], frameworks: [] })
  const [isScanning, setIsScanning] = useState(false)
  const [toolchainInfo, setToolchainInfo] = useState(null)
  const [maintenanceResult, setMaintenanceResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historyRecords, setHistoryRecords] = useState([])
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [appSettings, setAppSettings] = useState({
    customScanPaths: [],
    globalSizeThreshold: 2,
    autoCheckUpdates: false
  })

  const metricsRef = useRef(null)

  useGSAP(() => {
    if (viewMode === 'project' && currentProject) {
      gsap.fromTo(".metric-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.2 }
      );
    }
  }, { scope: metricsRef, dependencies: [viewMode, currentProject] });


  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('peeak_settings')
    if (savedSettings) {
      try {
        setAppSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
  }, [])


  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings)
    localStorage.setItem('peeak_settings', JSON.stringify(newSettings))
    showToast('Settings saved successfully', 'success')
  }

  // Scan custom paths when changed
  useEffect(() => {
    const scanPaths = async () => {
      if (!appSettings.customScanPaths || appSettings.customScanPaths.length === 0) return

      let foundProjects = []

      for (const path of appSettings.customScanPaths) {
        try {
          const projectPaths = await invoke('scan_workspace', { path })
          foundProjects = [...foundProjects, ...projectPaths]
        } catch (e) {
          console.error('Failed to scan workspace', path, e)
        }
      }

      if (foundProjects.length > 0) {
        setProjects(prev => {
          const existing = new Set(prev.map(p => p.path))
          const newProjects = foundProjects
            .filter(p => !existing.has(p))
            .map(p => ({
              path: p,
              name: p.split(/[\\/]/).pop(),
              technologies: ['npm'], // Assume npm initially
              lastScanned: new Date().toISOString()
            }))

          if (newProjects.length > 0) {
            const updated = [...prev, ...newProjects]
            localStorage.setItem('projects', JSON.stringify(updated))
            showToast(`Found ${newProjects.length} new projects`, 'success')
            return updated
          }
          return prev
        })
      }
    }

    scanPaths()
  }, [appSettings.customScanPaths])

  // Load projects on mount
  useEffect(() => {
    const saved = localStorage.getItem('projects')
    if (saved) {
      try {
        setProjects(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e)
        setProjects([])
      }
    }

    // Check for fast managers
    invoke('check_fast_managers').then(setFastManagers).catch(console.error)

    // Load global history
    const savedHistory = localStorage.getItem('peeak_history')
    if (savedHistory) {
      try {
        setHistoryRecords(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to parse history', e)
        setHistoryRecords([])
      }
    }
  }, [])

  const addHistoryRecord = (type, details) => {
    const newRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type, // 'UPDATE', 'INSTALL', 'DELETE', 'CLEANUP'
      ...details
    }

    setHistoryRecords(prev => {
      const updated = [newRecord, ...prev].slice(0, 100) // Keep last 100 records
      localStorage.setItem('peeak_history', JSON.stringify(updated))
      return updated
    })
  }

  // Load version history when project changes
  useEffect(() => {
    if (currentProject) {
      const historyKey = `versionHistory_${currentProject.path}`
      const saved = localStorage.getItem(historyKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const historyMap = new Map(Object.entries(parsed))
          setPackageVersionHistory(historyMap)
          console.log(`[VERSION_HISTORY] Loaded for ${currentProject.name}:`, parsed)
        } catch (e) {
          console.error('Failed to load version history:', e)
          setPackageVersionHistory(new Map())
        }
      } else {
        setPackageVersionHistory(new Map())
      }
    } else {
      setPackageVersionHistory(new Map())
    }
  }, [currentProject])

  // Scan project when selected
  useEffect(() => {
    if (currentProject && viewMode === 'project') {
      if (lastScannedPathRef.current !== currentProject.path) {
        scan(currentProject)
        lastScannedPathRef.current = currentProject.path
      }
    }
    if (viewMode === 'system') {
      invoke('get_toolchain_info').then(setToolchainInfo).catch(console.error)
    }
    if (viewMode === 'history') {
      invoke('get_history').then(setHistoryRecords).catch(console.error)
    }
  }, [currentProject, viewMode])

  // Fetch extra project details (scripts, audit) when entering project view
  useEffect(() => {
    if (currentProject && viewMode === 'project') {
      // Fetch scripts
      invoke('read_package_scripts', { projectPath: currentProject.path })
        .then(setProjectScripts)
        .catch(e => console.error('Failed to load scripts', e))

      // Trigger audit in background
      setIsLoadingAudit(true)
      invoke('run_npm_audit', { projectPath: currentProject.path })
        .then(res => {
          setAuditResult(res)
          setIsLoadingAudit(false)
        })
        .catch(e => {
          console.error('Audit failed', e)
          setIsLoadingAudit(false)
        })

      // Fetch outdated count
      invoke('run_npm_outdated', { projectPath: currentProject.path })
        .then(res => {
          const count = Object.keys(res || {}).length
          setOutdatedCount(count)
        })
        .catch(e => console.error('Outdated check failed', e))
    }
  }, [currentProject, viewMode])

  const showToast = (message, type = 'info') => {
    if (type === 'success') {
      sonnerToast.success(message, { duration: 3500 })
    } else if (type === 'error') {
      sonnerToast.error(message, { duration: 6000 })
    } else {
      sonnerToast.info(message, { duration: 3500 })
    }
  }

  // Save version history to localStorage
  const saveVersionHistory = (historyMap) => {
    if (currentProject) {
      const historyKey = `versionHistory_${currentProject.path}`
      const historyObj = Object.fromEntries(historyMap)
      localStorage.setItem(historyKey, JSON.stringify(historyObj))
      console.log(`[VERSION_HISTORY] Saved for ${currentProject.name}:`, historyObj)
    }
  }

  const pickFolder = async () => {
    try {
      const selected = await invoke('pick_folder')
      if (selected) {
        // Start streaming scan and only add project after scan-complete
        const projectName = selected.split(/[\\\/]/).pop()
        importPendingRef.current = selected
        setImportingProject(true)
        // Show the import progress dialog and start in 'checking' stage
        setShowImportProgress(true)
        setImportStage('checking')
        setImportPackageCount(0)

        // Start streaming scan in background; when scan completes the listener will add the project
        await invoke('scan_project_stream', { folder: selected })
      }
    } catch (e) {
      showToast(`Failed to pick folder: ${e}`, 'error')
      setShowImportProgress(false)
    }
  }

  const scan = async (proj) => {
    setBusy(true)
    setIsScanning(true)
    setScanResult({ packages: [], total_size: 0, total_count: 0, duplicates: [] })
    setProjectScripts({})
    setAuditResult(null)
    setOutdatedCount(0)

    try {
      // Use streaming scan
      await invoke('scan_project_stream', { folder: proj.path })

      // Detect technologies
      const techs = await invoke('detect_project_technologies', { projectPath: proj.path })
      setProjectTechnologies(techs)

      // Check for python venv in the project and show path in UI
      try {
        const v = await invoke('get_venv', { projectPath: proj.path })
        setVenvPath(v || null)
      } catch (e) {
        console.error('get_venv failed', e)
        setVenvPath(null)
      }

      // Update last scanned
      const updated = projects.map(p =>
        p.path === proj.path ? { ...p, lastScanned: Date.now() } : p
      )
      setProjects(updated)
      localStorage.setItem('projects', JSON.stringify(updated))
    } catch (e) {
      showToast(`Scan failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  // Listen for scan events
  useEffect(() => {
    // Shared handler for scan-complete events (used by both Tauri and mock)
    const handleScanComplete = async (event) => {
      const payload = event.payload || {}
      const result = payload.result || payload

      console.log(`[SCAN] scan-complete received: ${result?.packages?.length || 0} packages, path: ${payload.project_path || 'unknown'}`)

      setScanResult(result)
      scanResultRef.current = result
      setBusy(false)
      setIsScanning(false)

      // After scan complete, check for updates (npm only for now)
      checkForUpdates(result)

      // If this scan was started as part of an import, finalize import
      const scannedPath = payload.project_path
      if (scannedPath && importPendingRef.current === scannedPath) {
        try {
          const projectName = scannedPath.split(/\\|\//).pop()
          const newProject = { path: scannedPath, name: projectName, lastScanned: Date.now() }

          setProjects(prev => {
            const exists = prev.find(p => p.path === scannedPath)
            if (exists) return prev
            const updated = [newProject, ...prev]
            localStorage.setItem('projects', JSON.stringify(updated))
            return updated
          })

          setCurrentProject(newProject)
          setViewMode('project')
          showToast(`Imported: ${projectName}`, 'success')

          setShowImportProgress(false)
          importPendingRef.current = null
          setImportingProject(false)

            // Background detection
            ; (async () => {
              try {
                const techs = await invoke('detect_project_technologies', { projectPath: scannedPath }).catch(() => [])
                setProjectTechnologies(techs)
                const v = await invoke('get_venv', { projectPath: scannedPath }).catch(() => null)
                setVenvPath(v || null)
                setProjects(prev => prev.map(p => p.path === scannedPath ? { ...p, lastScanned: Date.now() } : p))
              } catch (e) {
                console.error('background detection failed', e)
              }
            })()

        } catch (e) {
          console.error('finalize import failed', e)
          showToast(`Import failed: ${e}`, 'error')
          importPendingRef.current = null
          setImportingProject(false)
        }
      }
    }

    if (_isTauri) {
      // Tauri: use native event listeners
      import('@tauri-apps/api/event').then(({ listen }) => {
        const unlistenProgress = listen('scan-progress', (event) => {
          const pkg = event.payload.package
          setScanResult(prev => {
            if (!prev) {
              const packages = [pkg]
              const total_size = packages.reduce((s, p) => s + (p.size || 0), 0)
              if (importPendingRef.current) {
                setImportPackageCount(packages.length)
              }
              return { packages, total_size, total_count: packages.length, duplicates: [] }
            }

            const existing = prev.packages || []
            const idx = existing.findIndex(p => p.path === pkg.path)
            let packages
            if (idx >= 0) {
              packages = [...existing]
              packages[idx] = pkg
            } else {
              packages = [...existing, pkg]
            }

            const total_size = packages.reduce((s, p) => s + (p.size || 0), 0)
            const total_count = packages.length

            if (importPendingRef.current) {
              if (!prev || !(prev.packages && prev.packages.length > 0)) {
                setImportStage('scanning')
              }
              setImportPackageCount(total_count)
            }

            return { ...prev, packages, total_size, total_count }
          })
        })

        const unlistenComplete = listen('scan-complete', handleScanComplete)

        const unlistenUpdate = listen('update-log', (event) => {
          const payload = event.payload
          console.log('[UPDATE]', payload.stream, payload.line ?? payload.code ?? payload)
          if (payload.stream === 'exit' && payload.code && payload.code !== 0) {
            showToast('Update failed (see console logs)', 'error')
          }
        })

        const unlistenLogs = listen('pkggui-log', (event) => {
          console.log('[CMD]', event.payload)
        })

        return () => {
          unlistenProgress.then(f => f())
          unlistenComplete.then(f => f())
          unlistenLogs.then(f => f())
          unlistenUpdate && unlistenUpdate.then(f => f())
        }
      })
    } else {
      // Browser: use mock event listeners
      const cleanup = setupMockEventListeners({
        onScanComplete: handleScanComplete
      })
      return cleanup
    }
  }, [])

  // Check for updates for packages - DISABLED to prevent annoying repeated prompts
  // Users can manually click "Check Updates" button instead
  const checkForUpdates = async (scanPayload) => {
    // DISABLED: Automatic update prompts are frustrating during development
    // Users prefer to check updates manually when they're ready
    console.log('checkForUpdates: automatic prompts disabled, use "Check Updates" button')
    return
  }

  // Perform a version scan and populate updateAvailable map (used for manual checks)
  const performVersionCheck = async (payload) => {
    try {
      const scanPayload = payload || scanResult
      if (!scanPayload || !scanPayload.packages) return new Map()
      if (!currentProject) return new Map()

      const updates = new Map()
      const npmPackages = scanPayload.packages.filter(p => p.manager === 'npm')
      // reset verified packages set
      setVerifiedPackages(new Set())
      const verifiedSet = new Set()

      console.log('[VERSION CHECK] Running npm outdated to detect available updates...')

      try {
        // Use npm outdated --json to get accurate update info respecting package.json semver ranges
        const outdatedResult = await invoke('run_npm_outdated', { projectPath: currentProject.path })
        console.log('[VERSION CHECK] npm outdated result:', outdatedResult)

        // outdatedResult is an object where keys are package names
        if (outdatedResult && typeof outdatedResult === 'object') {
          for (const [pkgName, info] of Object.entries(outdatedResult)) {
            // npm outdated returns: { current, wanted, latest, ... }
            if (info.latest && info.current && compareVersions(info.latest, info.current) > 0) {
              updates.set(pkgName, info.latest)
              console.log(`[VERSION CHECK] Update available: ${pkgName} ${info.current} → ${info.latest}`)
            }
          }
        }

        // Mark all checked packages as verified (checked npm outdated)
        for (const pkg of npmPackages) {
          if (!updates.has(pkg.name)) {
            verifiedSet.add(pkg.name)
          }
        }
        setVerifiedPackages(new Set(verifiedSet))

      } catch (e) {
        console.error('[VERSION CHECK] npm outdated failed, falling back to registry checks:', e)

        // Fallback: use registry API if npm outdated fails
        const concurrency = 6
        const pkgsToCheck = npmPackages.slice(0, 200)
        for (let i = 0; i < pkgsToCheck.length; i += concurrency) {
          const batch = pkgsToCheck.slice(i, i + concurrency)
          const promises = batch.map(async (pkg) => {
            try {
              const url = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/latest`
              const response = await fetch(url)
              if (!response.ok) return { pkg, latest: null }
              const data = await response.json()
              return { pkg, latest: data.version || null }
            } catch (e) {
              console.error(`Failed to check ${pkg.name}:`, e)
              return { pkg, latest: null }
            }
          })

          const results = await Promise.all(promises)
          for (const res of results) {
            const pkg = res.pkg
            const latest = res.latest
            if (latest && compareVersions(latest, pkg.version) > 0) {
              updates.set(pkg.name, latest)
            } else if (latest !== null) {
              verifiedSet.add(pkg.name)
            }
          }

          setVerifiedPackages(new Set(verifiedSet))
          await new Promise(r => setTimeout(r, 80))
        }
      }

      if (updates.size > 0) {
        setUpdateAvailable(updates)
        showToast(`${updates.size} package update(s) available`, 'info')
      } else {
        setUpdateAvailable(new Map())
        showToast('No updates found', 'info')
      }

      return updates
    } catch (e) {
      console.error('performVersionCheck failed', e)
      return new Map()
    }
  }

  // Keep verifiedPackages in-sync with current scan results to avoid stale marks
  useEffect(() => {
    if (!scanResult || !scanResult.packages) return
    setVerifiedPackages(prev => {
      const keep = new Set()
      for (const p of scanResult.packages) if (prev.has(p.name)) keep.add(p.name)
      return keep
    })
    // also update ref used by verification polling
    scanResultRef.current = scanResult
  }, [scanResult])

  // Very small semver comparer: returns 1 if a>b, -1 if a<b, 0 if equal
  const compareVersions = (a, b) => {
    const pa = (a || '').split('.').map(x => parseInt(x.replace(/[^0-9]/g, '') || '0'))
    const pb = (b || '').split('.').map(x => parseInt(x.replace(/[^0-9]/g, '') || '0'))
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0
      const nb = pb[i] || 0
      if (na > nb) return 1
      if (na < nb) return -1
    }
    return 0
  }

  // Check if an update is risky (major version bump)
  const isRiskyUpdate = (currentVersion, latestVersion) => {
    const parseVersion = (v) => {
      const cleaned = v.replace(/[^0-9.]/g, '')
      const parts = cleaned.split('.').map(x => parseInt(x) || 0)
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 }
    }

    const current = parseVersion(currentVersion)
    const latest = parseVersion(latestVersion)

    // Major version change is risky
    if (latest.major > current.major) {
      return { isRisky: true, reason: `Major version change (${current.major}.x → ${latest.major}.x) may have breaking changes` }
    }

    return { isRisky: false, reason: null }
  }

  // Handle full environment localization
  const handleLocalizeEnv = async () => {
    if (!currentProject || !scanResult?.packages) return
    setIsMigratingEnv(true)

    if (currentProject.manager === 'pip') {
      showToast('Creating local virtual environment...', 'info')
    } else {
      showToast('Localizing dependencies...', 'info')
    }

    try {
      if (currentProject.manager === 'pip' && !venvPath) {
        await invoke('create_venv', { projectPath: currentProject.path })
        const v = await invoke('get_venv', { projectPath: currentProject.path })
        setVenvPath(v || null)
      }

      const packagesToMigrate = scanResult.packages
      showToast(`Migrating ${packagesToMigrate.length} dependencies...`, 'info')

      let count = 0
      for (const pkg of packagesToMigrate) {
        try {
          await invoke('install_package', {
            packageManager: pkg.manager,
            packageName: pkg.name,
            projectPath: currentProject.path,
            isGlobal: false
          })
          count++
        } catch (err) {
          console.error(`Failed to migrate ${pkg.name}:`, err)
        }
      }

      showToast(`✅ Successfully migrated ${count}/${packagesToMigrate.length} packages`, 'success')
      scan(currentProject)
    } catch (e) {
      showToast(`Failed to localize environment: ${e}`, 'error')
    }
    setIsMigratingEnv(false)
  }

  // Called when the user confirms updates from the dialog
  const handleUpdateSelected = async (list) => {
    if (!currentProject) return
    // Close dialog and clear candidates
    setShowUpdateDialog(false)
    setUpdateCandidates([])
    // Update packages sequentially to show per-card progress and collect results
    const failed = []
    let successCount = 0
    for (const pkg of list) {
      try {
        const ok = await handleUpdate(pkg.name)
        if (ok) successCount++
        else failed.push(pkg.name)
      } catch (e) {
        failed.push(pkg.name)
        console.error('Batch update failed for', pkg.name, e)
      }
    }

    // Show summary
    if (failed.length > 0) {
      showToast(`Updated ${successCount}/${list.length}. Failed: ${failed.join(', ')}`, 'error')
    } else if (successCount > 0) {
      showToast(`✅ Successfully updated ${successCount} package${successCount > 1 ? 's' : ''}`, 'success')
      addHistoryRecord('UPDATE_BATCH', {
        count: successCount,
        projectName: currentProject?.name,
        manager: list?.[0]?.manager || 'npm'
      })
    }

    // After batch updates, mark that next rescan should skip immediate version check
    skipVersionCheckRef.current = true
    // Re-scan project after updates
    scan(currentProject)
  }

  const handleRetryFailed = async (packages) => {
    if (!packages || packages.length === 0) return
    setShowFailureDialog(false)
    for (const name of packages) {
      try {
        await handleUpdate(name)
      } catch (e) {
        console.error('Retry failed for', name, e)
      }
    }
    // clear failed list after retry attempts
    setFailedUpdates([])
  }

  // Periodic version check - runs every 5 minutes
  useEffect(() => {
    if (!scanResult?.packages || scanResult.packages.length === 0) return
    if (!autoCheckUpdates) return

    const checkVersions = async () => {
      // Skip if this was triggered by an update
      if (skipVersionCheckRef.current) {
        console.log('Skipping version check after update')
        skipVersionCheckRef.current = false
        return
      }

      console.log('Checking for package updates...')
      const updates = new Map()

      // Check npm packages
      const npmPackages = scanResult.packages.filter(p => p.manager === 'npm')
      if (npmPackages.length > 0) {
        try {
          // Check each package (in production, batch this)
          for (const pkg of npmPackages.slice(0, 20)) { // Check more packages
            try {
              const response = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`)
              if (response.ok) {
                const data = await response.json()
                // Use compareVersions to check if update is truly available
                if (data.version && compareVersions(data.version, pkg.version) > 0) {
                  updates.set(pkg.name, data.version)
                }
              }
            } catch (e) {
              console.error(`Failed to check ${pkg.name}:`, e)
            }
          }
        } catch (e) {
          console.error('Version check failed:', e)
        }
      }

      if (updates.size > 0) {
        setUpdateAvailable(updates)
        showToast(`${updates.size} package update(s) available`, 'info')
      } else {
        // Clear update available if no updates found
        setUpdateAvailable(new Map())
      }
    }

    // Check immediately
    checkVersions()

    // Then check every 5 minutes
    const interval = setInterval(checkVersions, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [scanResult])



  const handleDelete = async (pkgPath) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return
    try {
      await invoke('delete_package', { path: pkgPath })
      showToast('Package deleted', 'success')
      addHistoryRecord('DELETE', {
        packageName: pkgPath.split(/[\\\/]/).pop(),
        projectName: currentProject?.name,
        manager: scanResult?.packages?.find(p => p.path === pkgPath)?.manager || 'npm'
      })
      // Remove from UI immediately
      setScanResult(prev => ({
        ...prev,
        packages: prev.packages.filter(p => p.path !== pkgPath),
        total_count: prev.total_count - 1
      }))
    } catch (e) {
      showToast(`Delete failed: ${e}`, 'error')
    }
  }

  const togglePackage = (path) => {
    const newSet = new Set(selectedPackages)
    if (newSet.has(path)) newSet.delete(path)
    else newSet.add(path)
    setSelectedPackages(newSet)
  }

  const toggleAll = () => {
    if (!scanResult) return
    if (selectedPackages.size === scanResult.packages.length) {
      setSelectedPackages(new Set())
    } else {
      setSelectedPackages(new Set(scanResult.packages.map(p => p.path)))
    }
  }

  const filteredPackages = React.useMemo(() => {
    let pkgs = scanResult?.packages || []
    if (filter) {
      pkgs = pkgs.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    }
    if (sortBy === 'size') {
      pkgs = [...pkgs].sort((a, b) => b.size - a.size)
    } else {
      pkgs = [...pkgs].sort((a, b) => a.name.localeCompare(b.name))
    }
    return pkgs
  }, [scanResult, filter, sortBy])

  const topPackages = React.useMemo(() => {
    if (!scanResult?.packages) return []
    return [...scanResult.packages].sort((a, b) => b.size - a.size).slice(0, 5)
  }, [scanResult])


  // New installation handler with project selection
  const handleInstallPackage = (packageName, packageManager) => {
    setPendingInstall({ packageName, packageManager })
    setShowProjectSelector(true)
  }

  // Helper: check if any installingPackages contain a package by path
  const installingPackagesHasPath = (pkgPath) => {
    // installingPackages map stores by package name; find package by path
    const pkg = scanResult?.packages?.find(p => p.path === pkgPath)
    if (!pkg) return false
    return installingPackages.has(pkg.name)
  }

  const executeInstall = async (selectedLocation) => {
    if (!pendingInstall) return

    const { packageName, packageManager } = pendingInstall
    const isGlobal = selectedLocation === 'global'
    const projectPath = isGlobal ? null : selectedLocation

    // Start installation with progress tracking
    setInstallingPackages(prev => new Map(prev).set(packageName, 0))
    showToast(`Installing ${packageName}...`, 'info')

    try {
      // Simulate progress (in real scenario, listen to backend events)
      const progressInterval = setInterval(() => {
        setInstallingPackages(prev => {
          const current = prev.get(packageName) || 0
          if (current >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          const newMap = new Map(prev)
          newMap.set(packageName, Math.min(current + 10, 90))
          return newMap
        })
      }, 300)

      await invoke('install_package', {
        packageManager,
        packageName,
        projectPath,
        isGlobal
      })

      clearInterval(progressInterval)
      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.set(packageName, 100)
        return newMap
      })

      setTimeout(() => {
        setInstallingPackages(prev => {
          const newMap = new Map(prev)
          newMap.delete(packageName)
          return newMap
        })
      }, 1000)

      showToast(`${packageName} installed successfully!`, 'success')

      // Rescan if installed to current project
      if (!isGlobal && currentProject && projectPath === currentProject.path) {
        scan(currentProject)
      }
    } catch (e) {
      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.delete(packageName)
        return newMap
      })
      showToast(`Install failed: ${e}`, 'error')
    }

    setPendingInstall(null)
  }

  // Remove project from PEEAK (keep files on disk)
  const handleRemoveProject = () => {
    if (!currentProject) return
    const updatedProjects = projects.filter(p => p.path !== currentProject.path)
    setProjects(updatedProjects)
    localStorage.setItem('peeak_projects', JSON.stringify(updatedProjects))
    setCurrentProject(null)
    setScanResult(null)
    setViewMode('dashboard')
    showToast(`${currentProject.name} removed from PEEAK`, 'success')
  }

  // Uninstall project (delete from disk)
  const handleUninstallProject = async () => {
    if (!currentProject) return

    setBusy(true)
    try {
      await invoke('delete_project_folder', { projectPath: currentProject.path })

      // Remove from projects list
      const updatedProjects = projects.filter(p => p.path !== currentProject.path)
      setProjects(updatedProjects)
      localStorage.setItem('peeak_projects', JSON.stringify(updatedProjects))

      setCurrentProject(null)
      setScanResult(null)
      setViewMode('dashboard')

      showToast(`✅ ${currentProject.name} uninstalled successfully!`, 'success')
    } catch (e) {
      showToast(`❌ Uninstall failed: ${e}`, 'error')
    }
    setBusy(false)
  }

  // Open project folder in explorer
  const handleOpenFolder = async (path) => {
    try {
      await invoke('open_folder', { path })
    } catch (e) {
      showToast(`Failed to open folder: ${e}`, 'error')
    }
  }

  // Set project logo
  const handleSetProjectLogo = async () => {
    if (!currentProject) return
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp']
        }]
      })

      if (selected) {
        setProjects(prev => {
          const updated = prev.map(p =>
            p.path === currentProject.path ? { ...p, logo: selected } : p
          )
          localStorage.setItem('projects', JSON.stringify(updated))
          return updated
        })
        setCurrentProject(prev => ({ ...prev, logo: selected }))
        showToast(`Logo updated: ${selected}`, 'success')
      }
    } catch (e) {
      console.error('Failed to set logo:', e)
      showToast('Failed to select image', 'error')
    }
  }

  const handleUpdate = async (packageName, skipRiskyCheck = false) => {
    if (!currentProject) return

    const currentPkg = scanResult?.packages?.find(p => p.name === packageName)
    const currentVersion = currentPkg?.version || 'unknown'
    const latestVersion = updateAvailable.get(packageName)
    const manager = currentPkg?.manager || 'npm'

    // Determine if this is a major version update
    let isMajorUpdate = false
    if (latestVersion && currentVersion !== 'unknown') {
      const { isRisky } = isRiskyUpdate(currentVersion, latestVersion)
      isMajorUpdate = isRisky
    }

    // Check if update is risky (major version change) and warn user
    if (!skipRiskyCheck && latestVersion && currentVersion !== 'unknown') {
      const { isRisky, reason } = isRiskyUpdate(currentVersion, latestVersion)

      if (isRisky) {
        setRiskyUpdate({
          packageName,
          current: currentVersion,
          latest: latestVersion,
          manager,
          reason
        })
        setShowRiskyUpdateDialog(true)
        return false // Wait for user confirmation
      }
    }

    // Store current version before updating (for revert functionality)
    if (currentVersion !== 'unknown') {
      setPackageVersionHistory(prev => {
        const newMap = new Map(prev)
        const existingVersions = newMap.get(packageName) || []

        // Add current version to chain if not already present
        if (!existingVersions.includes(currentVersion)) {
          const updatedVersions = [...existingVersions, currentVersion]
          newMap.set(packageName, updatedVersions)
          console.log(`[VERSION_HISTORY] Added ${packageName}: ${currentVersion}, chain: [${updatedVersions.join(', ')}]`)
          saveVersionHistory(newMap)
        }
        return newMap
      })
    }

    setInstallingPackages(prev => new Map(prev).set(packageName, 0))
    showToast(`Updating ${packageName}...`, 'info')

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setInstallingPackages(prev => {
          const current = prev.get(packageName) || 0
          if (current >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          const newMap = new Map(prev)
          newMap.set(packageName, Math.min(current + 10, 90))
          return newMap
        })
      }, 300)

      const expectedLatest = latestVersion || null

      console.log(`[UPDATE] Starting update for ${packageName} (manager: ${manager}, current: v${currentVersion}, expected: v${expectedLatest || 'unknown'})`)

      await invoke('update_package', {
        packageManager: manager,
        packageName: packageName,
        projectPath: currentProject.path,
        isGlobal: false
      })

      console.log(`[UPDATE] Update command completed for ${packageName}`)

      clearInterval(progressInterval)
      // mark as complete in UI
      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.set(packageName, 100)
        return newMap
      })

      // Trust npm update exit code - the update completed successfully if no exception was thrown
      console.log(`[UPDATE] ${packageName} updated successfully (trusting npm exit code)`)

      // Remove from update available list
      setUpdateAvailable(prev => {
        const newMap = new Map(prev)
        newMap.delete(packageName)
        return newMap
      })

      showToast(`✅ ${packageName} updated successfully!`, 'success')
      addHistoryRecord('UPDATE', {
        packageName,
        oldVersion: currentVersion,
        newVersion: latestVersion || 'latest',
        projectName: currentProject?.name,
        manager: manager
      })

      // Smart rescan strategy based on update type
      setTimeout(() => {
        setInstallingPackages(prev => {
          const newMap = new Map(prev)
          newMap.delete(packageName)
          return newMap
        })

        skipVersionCheckRef.current = true
        setTimeout(() => { skipVersionCheckRef.current = false }, 5000)

        if (isMajorUpdate) {
          // Major version update: Full project rescan (dependencies tree may have changed)
          console.log(`[UPDATE] Major version update detected for ${packageName}, performing full project rescan...`)
          try { scan(currentProject) } catch (e) { console.error('rescan failed', e) }
        } else {
          // Minor/patch update: Quick single package rescan
          console.log(`[UPDATE] Minor update for ${packageName}, rescanning package only...`)
          // Just update the specific package info in scanResult
          try {
            invoke('get_package_info', {
              projectPath: currentProject.path,
              packageName: packageName,
              manager: manager
            }).then(updatedPkgInfo => {
              if (updatedPkgInfo) {
                setScanResult(prev => {
                  if (!prev) return prev
                  const updatedPackages = prev.packages.map(pkg =>
                    pkg.name === packageName ? { ...pkg, ...updatedPkgInfo } : pkg
                  )
                  return { ...prev, packages: updatedPackages }
                })
                console.log(`[UPDATE] Package ${packageName} info updated in scan result`)
              }
            }).catch(err => {
              // Fallback to full rescan if package info fetch fails
              console.log(`[UPDATE] Package info fetch failed, falling back to full rescan:`, err)
              scan(currentProject)
            })
          } catch (e) {
            console.error('Package info update failed, doing full rescan', e)
            scan(currentProject)
          }
        }
      }, 1500)

      return true

    } catch (e) {
      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.delete(packageName)
        return newMap
      })
      showToast(`❌ Update failed: ${e}`, 'error')
      return false
    }
  }

  // Revert package to specific version from version history
  const handleRevert = async (packageName, targetVersion = null) => {
    const versionChain = packageVersionHistory.get(packageName)

    if (!versionChain || versionChain.length === 0) {
      showToast(`❌ No version history found for ${packageName}`, 'error')
      return false
    }

    // Use the most recent version if no target specified
    const revertToVersion = targetVersion || versionChain[versionChain.length - 1]

    if (!revertToVersion) {
      showToast(`❌ No version specified for revert`, 'error')
      return false
    }

    if (!currentProject) {
      showToast(`❌ No project selected`, 'error')
      return false
    }

    setInstallingPackages(prev => new Map(prev).set(packageName, 0))
    showToast(`Reverting ${packageName} to v${revertToVersion}...`, 'info')

    let progressInterval = null

    try {
      progressInterval = setInterval(() => {
        setInstallingPackages(prev => {
          const current = prev.get(packageName) || 0
          if (current >= 90) {
            return prev
          }
          const newMap = new Map(prev)
          newMap.set(packageName, Math.min(current + 10, 90))
          return newMap
        })
      }, 300)

      const manager = scanResult?.packages?.find(p => p.name === packageName)?.manager || 'npm'
      const currentVersion = scanResult?.packages?.find(p => p.name === packageName)?.version

      console.log(`[REVERT] Reverting ${packageName} from v${currentVersion} to v${revertToVersion} (manager: ${manager})`)

      // Use install with specific version to revert
      await invoke('update_package', {
        packageManager: manager,
        packageName: `${packageName}@${revertToVersion}`,
        projectPath: currentProject.path,
        isGlobal: false
      })

      if (progressInterval) clearInterval(progressInterval)

      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.set(packageName, 100)
        return newMap
      })

      // Update version history: add current version to chain, remove versions after the revert target
      if (currentVersion && currentVersion !== 'unknown') {
        setPackageVersionHistory(prev => {
          const newMap = new Map(prev)
          const chain = [...(newMap.get(packageName) || [])]

          // Add current version if not in chain
          if (!chain.includes(currentVersion)) {
            chain.push(currentVersion)
          }

          // Keep only versions up to and including the revert target
          const targetIndex = chain.indexOf(revertToVersion)
          if (targetIndex !== -1) {
            const updatedChain = chain.slice(0, targetIndex)
            if (updatedChain.length > 0) {
              newMap.set(packageName, updatedChain)
            } else {
              newMap.delete(packageName)
            }
          }

          console.log(`[REVERT] Updated version chain for ${packageName}:`, newMap.get(packageName) || [])
          saveVersionHistory(newMap)
          return newMap
        })
      }

      showToast(`✅ ${packageName} reverted to v${revertToVersion}!`, 'success')
      addHistoryRecord('REVERT', {
        packageName,
        toVersion: revertToVersion,
        projectName: currentProject?.name,
        manager: manager
      })

      // Smart rescan after revert (always quick scan since reverting is minor)
      setTimeout(() => {
        setInstallingPackages(prev => {
          const newMap = new Map(prev)
          newMap.delete(packageName)
          return newMap
        })
        skipVersionCheckRef.current = true
        setTimeout(() => { skipVersionCheckRef.current = false }, 5000)

        // Revert is always a specific version, use quick package info update
        console.log(`[REVERT] Quick rescan for ${packageName}...`)
        try {
          invoke('get_package_info', {
            projectPath: currentProject.path,
            packageName: packageName,
            manager: manager
          }).then(updatedPkgInfo => {
            if (updatedPkgInfo) {
              setScanResult(prev => {
                if (!prev) return prev
                const updatedPackages = prev.packages.map(pkg =>
                  pkg.name === packageName ? { ...pkg, ...updatedPkgInfo } : pkg
                )
                return { ...prev, packages: updatedPackages }
              })
              console.log(`[REVERT] Package ${packageName} info updated`)
            }
          }).catch(err => {
            console.log(`[REVERT] Package info fetch failed, falling back to full rescan:`, err)
            scan(currentProject)
          })
        } catch (e) {
          console.error('Package info update failed, doing full rescan', e)
          scan(currentProject)
        }
      }, 1500)

      return true
    } catch (e) {
      if (progressInterval) clearInterval(progressInterval)

      setInstallingPackages(prev => {
        const newMap = new Map(prev)
        newMap.delete(packageName)
        return newMap
      })

      const errorMsg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e))
      console.error(`[REVERT] Failed to revert ${packageName}:`, errorMsg)
      showToast(`❌ Revert failed: ${errorMsg}`, 'error')
      return false
    }
  }

  const runMaintenance = async () => {
    setIsAnalyzing(true)
    try {
      const result = await invoke('run_maintenance_scan', { projects })
      setMaintenanceResult(result)
      showToast('System health scan complete', 'success')
    } catch (e) {
      showToast(`Maintenance scan failed: ${e}`, 'error')
    }
    setIsAnalyzing(false)
  }

  const handleCleanCache = async (path) => {
    try {
      await invoke('clean_selected_caches', { paths: [path] })
      showToast('Cache cleaned successfully', 'success')
      // Refresh results
      runMaintenance()
    } catch (e) {
      showToast(`Cleanup failed: ${e}`, 'error')
    }
  }

  const handleCleanAllCaches = async () => {
    if (!maintenanceResult) return
    try {
      const paths = maintenanceResult.caches.map(c => c.path)
      await invoke('clean_selected_caches', { paths })
      showToast('All caches cleared', 'success')
      runMaintenance()
    } catch (e) {
      showToast(`Cleanup failed: ${e}`, 'error')
    }
  }


  const getAuditStatus = () => {
    if (isLoadingAudit) return { text: 'Auditing...', color: 'text-gray-400', icon: RefreshCw, spin: true }
    if (!auditResult) return { text: 'No Audit', color: 'text-gray-400', icon: Shield }

    const vulns = auditResult.metadata?.vulnerabilities || {}
    const total = vulns.total || (vulns.info + vulns.low + vulns.moderate + vulns.high + vulns.critical) || 0

    if (total === 0) return { text: 'Secure', color: 'text-green-600', icon: ShieldCheck }
    if (vulns.critical > 0 || (vulns.high && vulns.high > 0)) return { text: `${total} Vulns`, color: 'text-red-600', icon: AlertTriangle }
    return { text: `${total} Vulns`, color: 'text-yellow-600', icon: AlertTriangle }
  }
  const auditStatus = getAuditStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 text-gray-900 font-sans selection:bg-purple-200">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">PEEAK</h1>
            {/* Header nav moved to the top of the main content so it shows on every page */}
          </div>

          <div className="flex items-center gap-4">
            {/* Header Actions */}
            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-white/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('maintenance')}
                className={`w-10 h-10 rounded-xl transition-all duration-300 ${viewMode === 'maintenance' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'}`}
                title="Smart Maintenance"
              >
                <ShieldCheck className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('history')}
                className={`w-10 h-10 rounded-xl transition-all duration-300 ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                title="Release Records"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsDialog(true)}
                className="w-10 h-10 rounded-xl transition-all duration-300 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                title="Global Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            {/* Fast Manager Indicators */}
            <div className="flex gap-2">
              {fastManagers.bun && <Badge variant="outline" className="text-orange-600 border-orange-200/60 bg-orange-50/60 backdrop-blur-sm">⚡ Bun Ready</Badge>}
              {fastManagers.uv && <Badge variant="outline" className="text-blue-600 border-blue-200/60 bg-blue-50/60 backdrop-blur-sm">⚡ uv Ready</Badge>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">


        <div className="mb-8 flex justify-start">
          <nav className="relative flex p-1.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-inner border border-white/40">
            {[
              { id: 'dashboard', label: 'Project Packages', icon: Layers },
              { id: 'system', label: 'System Packages', icon: HardDrive },
              { id: 'frameworks', label: 'Framework', icon: Package }
            ].map((tab) => {
              const isActive = (tab.id === 'dashboard' && (viewMode === 'dashboard' || viewMode === 'project')) || viewMode === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id === 'dashboard' ? 'dashboard' : tab.id)}
                  className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors duration-300 z-10 no-hover ${isActive ? 'text-white' : 'text-gray-500'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <AnimatePresence mode="wait">
          {/* DASHBOARD VIEW */}
          {viewMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                      Precision <span className="text-purple-600">Engine</span>
                    </h2>
                  </div>
                  <p className="text-gray-500 font-medium ml-1">Manage project dependencies with scientific precision.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                  <Button
                    onClick={() => setViewMode('create-project')}
                    size="lg"
                    className="flex-1 md:flex-none h-12 px-6 bg-gray-900 text-white shadow-xl shadow-black/10 border-0 rounded-2xl transition-all active:scale-95 font-bold no-hover"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Create Project
                  </Button>
                  <Button
                    onClick={pickFolder}
                    size="lg"
                    className="flex-1 md:flex-none h-12 px-6 bg-white/60 backdrop-blur-md text-gray-900 border border-white/40 shadow-xl shadow-black/5 rounded-2xl transition-all active:scale-95 font-bold no-hover"
                  >
                    <FolderOpen className="w-5 h-5 mr-2 text-purple-600" /> Import Project
                  </Button>
                  <div className="flex bg-white/40 backdrop-blur-md rounded-2xl p-1.5 shadow-xl shadow-black/5 border border-white/40 relative">
                    {/* The sliding background pill */}
                    <div
                      className="absolute top-1.5 bottom-1.5 w-9 bg-white rounded-xl shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{
                        transform: `translateX(${['grid', 'list', 'stack'].indexOf(projectViewMode) * 100}%)`
                      }}
                    />

                    {['grid', 'list', 'stack'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setProjectViewMode(mode)}
                        className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-300 no-hover ${projectViewMode === mode ? 'text-purple-600' : 'text-gray-400'
                          }`}
                      >
                        {mode === 'grid' && <Square className="w-4 h-4" />}
                        {mode === 'list' && <Menu className="w-4 h-4" />}
                        {mode === 'stack' && <Layers className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 px-4">Managed Inventory</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {projects.length === 0 ? (
                  <div className="relative group overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-1000"></div>

                    <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-2xl relative z-10 flex flex-col items-center">
                      <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 border border-purple-50">
                        <FolderOpen className="w-10 h-10 text-purple-600 animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Engine Offline</h3>
                      <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium leading-relaxed px-6">
                        No projects detected in the precision viewport. Import an existing codebase or create a new one to initialize the engine.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={pickFolder}
                          size="lg"
                          className="h-14 px-10 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-black/20 transition-all hover:scale-105 active:scale-95"
                        >
                          <FolderOpen className="w-5 h-5 mr-3 text-purple-400" /> Initialize Import
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setViewMode('create-project')}
                          className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2" /> New Project Studio
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <AnimatePresence mode="wait">
                      {projectViewMode === 'stack' && (
                        <motion.div
                          key="stack"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.4 }}
                          className="h-[500px] w-full max-w-4xl mx-auto flex items-center justify-center p-8"
                        >
                          <ProjectCardStack
                            projects={projects}
                            onClick={(p) => { setCurrentProject(p); setViewMode('project'); }}
                            onRemove={(path) => removeProject(path)}
                          />
                        </motion.div>
                      )}
                      {projectViewMode === 'grid' && (
                        <motion.div
                          key="grid"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                          {projects.map(p => (
                            <ProjectCard key={p.path} project={p} viewMode="grid" onClick={() => { setCurrentProject(p); setViewMode('project'); }} onRemove={(path) => removeProject(path)} />
                          ))}
                        </motion.div>
                      )}

                      {projectViewMode === 'list' && (
                        <motion.div
                          key="list"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col space-y-4"
                        >
                          {projects.map(p => (
                            <ProjectCard key={p.path} project={p} viewMode="list" onClick={() => { setCurrentProject(p); setViewMode('project'); }} onRemove={(path) => removeProject(path)} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PROJECT DETAILS VIEW */}
          {viewMode === 'project' && currentProject && (
            <motion.div
              key="project"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              ref={metricsRef}
              className="metrics-container"
            >
              <Button
                variant="ghost"
                className="mb-6 pl-0 hover:pl-2 transition-all text-gray-500"
                onClick={() => setViewMode('dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
              </Button>

              {/* Header Content - Bento Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] xl:grid-cols-[1fr_2fr] gap-8 mb-10">

                {/* Left Logo Card - VERTICAL CENTERED */}
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/40 shadow-2xl relative overflow-hidden group h-full flex flex-col items-center justify-center min-h-[350px] transition-all hover:shadow-purple-500/10">
                  {/* Background Decor */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700" />
                  <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                  {/* Actions Corner Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveProject}
                      className="h-9 w-9 bg-white/50 hover:bg-white text-gray-500 hover:text-orange-500 rounded-xl transition-all shadow-sm"
                      title="Remove from PEEAK"
                    >
                      <FolderMinus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowUninstallDialog(true)}
                      className="h-9 w-9 bg-red-50/50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Uninstall Project (Delete Files)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-6 w-full text-center mt-4">
                    {/* Project Logo - Centered Top */}
                    <div className="relative group/logo">
                      <div
                        onClick={handleSetProjectLogo}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-500 overflow-hidden border-2 border-white group-hover/logo:border-purple-400 group-hover/logo:shadow-purple-500/20"
                        title="Click to change project logo"
                      >
                        {currentProject.logo ? (
                          <img
                            src={convertFileSrc(currentProject.logo)}
                            alt={currentProject.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Logo load failed', e);
                              showToast(`Failed to load logo: ${currentProject.logo}`, 'error');
                            }}
                          />
                        ) : (
                          <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 opacity-40 group-hover/logo:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>

                    {/* Project Name & Tech Stack - Centered Below */}
                    <div className="flex flex-col gap-4 min-w-0 w-full">
                      <h1 className="text-4xl xl:text-5xl font-black text-gray-900 tracking-tight break-words leading-[1.1] px-1">
                        {currentProject.name}
                      </h1>

                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {isVerifying && (
                          <Badge className="bg-yellow-100 text-yellow-700 font-bold px-3 border-yellow-200">Verifying...</Badge>
                        )}

                        {/* Technology Stack Icons */}
                        {projectTechnologies.length > 0 && (
                          <div className="flex items-center justify-center -space-x-3 p-1">
                            {projectTechnologies.map((tech, i) => {
                              const { color, icon, name, image } = getTechIcon(tech)
                              return (
                                <div
                                  key={tech}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden p-1.5`}
                                  title={name}
                                  style={{ zIndex: 20 - i }}
                                >
                                  {image ? (
                                    <img src={image} alt={name} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-base">{icon}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="metrics-grid-container flex flex-col gap-6 flex-1 min-w-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Packages - 1x1 */}
                    <div className="metric-card col-span-1 bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-7 border border-white/60 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all group/card min-h-[160px] opacity-0 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                        <Package size={80} />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all duration-500 mb-2 shadow-sm">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Total Packages</span>
                        <div className="text-4xl font-black text-gray-900 group-hover/card:translate-x-1 transition-transform truncate leading-none tracking-tighter">
                          {scanResult ? <AnimatedCounter value={scanResult.total_count} delay={0.4} /> : '...'}
                        </div>
                      </div>
                    </div>

                    {/* Updates Available - 1x1 */}
                    <div className="metric-card col-span-1 bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-7 border border-white/60 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all group/updates min-h-[160px] opacity-0 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/updates:opacity-10 transition-opacity">
                        <RefreshCw size={80} />
                      </div>
                      <div className={`w-12 h-12 rounded-2xl ${outdatedCount > 0 ? 'bg-amber-50 group-hover/updates:bg-amber-500' : 'bg-gray-50 group-hover/updates:bg-gray-900'} flex items-center justify-center shrink-0 group-hover/updates:text-white transition-all duration-500 mb-2 shadow-sm`}>
                        <RefreshCw className={`w-6 h-6 ${outdatedCount > 0 ? 'text-amber-500' : 'text-gray-400'} group-hover/updates:rotate-180 transition-transform duration-700 group-hover/updates:text-white`} />
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Updates</span>
                        <div className={`text-4xl font-black ${outdatedCount > 0 ? 'text-amber-500' : 'text-gray-900'} group-hover/updates:translate-x-1 transition-transform truncate leading-none tracking-tighter`}>
                          <AnimatedCounter value={outdatedCount} delay={0.5} />
                        </div>
                      </div>
                    </div>

                    {/* Security Status - 2x1 (Wide) */}
                    <div className={`metric-card col-span-2 rounded-[2.5rem] p-7 border shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all group/security min-h-[160px] opacity-0 relative overflow-hidden ${auditResult?.metadata?.vulnerabilities?.critical > 0 || auditResult?.metadata?.vulnerabilities?.high > 0 ? 'bg-red-50/80 backdrop-blur-sm border-red-200' : 'bg-white/80 backdrop-blur-sm border-white/60'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/security:opacity-10 transition-opacity">
                        <Shield size={100} />
                      </div>
                      <div className={`w-12 h-12 rounded-2xl ${auditStatus.color.replace('text-', 'bg-').replace('-600', '-500')} flex items-center justify-center shrink-0 text-white shadow-lg transition-all duration-500 mb-2 group-hover/security:scale-110`}>
                        <auditStatus.icon className={`w-6 h-6 ${auditStatus.spin ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex flex-col min-w-0 relative z-10">
                        <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Security Health</span>
                        <div className="flex items-end justify-between gap-4">
                          <div className={`text-4xl xl:text-5xl font-black ${auditStatus.color.replace('text-red-600', 'text-red-500')} group-hover/security:translate-x-1 transition-transform truncate leading-none tracking-tighter`}>
                            {auditStatus.text}
                          </div>
                          {auditResult && auditResult.metadata?.vulnerabilities && (
                            <div className="flex flex-wrap gap-2 mb-1">
                              {auditResult.metadata.vulnerabilities.critical > 0 && <Badge className="bg-red-600 text-white border-0 shadow-lg px-3 h-6 text-[10px] font-black">CRITICAL: {auditResult.metadata.vulnerabilities.critical}</Badge>}
                              {auditResult.metadata.vulnerabilities.high > 0 && <Badge className="bg-orange-600 text-white border-0 shadow-lg px-3 h-6 text-[10px] font-black">HIGH: {auditResult.metadata.vulnerabilities.high}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Size - 1x1 */}
                    <div className="metric-card col-span-1 lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-7 border border-white/60 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all group/storage min-h-[160px] opacity-0 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/storage:opacity-10 transition-opacity">
                        <Layers size={80} />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0 group-hover/storage:bg-pink-500 group-hover/storage:text-white transition-all duration-500 mb-2 shadow-sm">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Disk Size</span>
                        <div className="text-2xl xl:text-3xl font-black text-gray-900 group-hover/storage:translate-x-1 transition-transform leading-none whitespace-nowrap tracking-tighter">
                          {scanResult ? <AnimatedCounter value={scanResult.total_size} formatter={formatBytes} delay={0.7} /> : '...'}
                        </div>
                      </div>
                    </div>

                    {/* Project Environment - 3x1 (Wide) */}
                    <div className="col-span-2 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/40 shadow-xl hover:shadow-2xl transition-all group/env min-h-[160px] flex flex-col justify-between overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <HardDrive size={100} />
                      </div>
                      <div className="flex flex-col gap-5 h-full justify-between relative z-10">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Environment & Workspace</span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {(() => {
                              const normPath = (p) => (p || '').replace(/\\/g, '/');
                              const hasGlobalPackages = scanResult?.packages?.some(pkg => {
                                return !(normPath(pkg.path).includes(normPath(currentProject.path)) || (venvPath && normPath(pkg.path).includes(normPath(venvPath))));
                              });

                              return (
                                <>
                                  {currentProject.manager === 'pip' ? (
                                    venvPath ? (
                                      <Badge className="bg-emerald-500 text-white font-black text-[10px] border-0 shadow-lg px-3 py-1">VIRTUAL ENV ACTIVE</Badge>
                                    ) : (
                                      <Badge className="bg-amber-500 text-white font-black text-[10px] border-0 shadow-lg px-3 py-1">GLOBAL PYTHON</Badge>
                                    )
                                  ) : (
                                    !hasGlobalPackages ? (
                                      <Badge className="bg-emerald-500 text-white font-black text-[10px] border-0 shadow-lg px-3 py-1">ISOLATED WORKSPACE</Badge>
                                    ) : (
                                      <Badge className="bg-amber-500 text-white font-black text-[10px] border-0 shadow-lg px-3 py-1">GLOBAL DEPENDENCIES</Badge>
                                    )
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div
                          onClick={() => handleOpenFolder(currentProject.path)}
                          className="group/path flex items-center justify-between p-4 rounded-2xl bg-gray-900/5 hover:bg-gray-900/10 border border-black/5 cursor-pointer transition-all shadow-inner mt-auto overflow-hidden"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-2.5 bg-white rounded-xl shadow-md text-gray-900 group-hover/path:bg-purple-600 group-hover/path:text-white transition-all shrink-0">
                              <HardDrive className="w-5 h-5 transition-transform group-hover/path:rotate-12" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Project Root</span>
                              <span className="font-bold text-gray-900 truncate text-xs sm:text-sm">
                                {currentProject.path}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 pl-4">
                            <div className="flex flex-col items-end hidden sm:flex">
                              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">Explore</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Filesystem</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover/path:text-purple-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scripts Runner Area - Bento Bottom Item */}
                  <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/40 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Terminal size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-5 px-1 relative z-10">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Project Command Center</span>
                    </div>
                    {Object.keys(projectScripts).length > 0 ? (
                      <div className="flex flex-wrap gap-3 relative z-10">
                        {Object.entries(projectScripts).map(([name, cmd]) => (
                          <Button
                            key={name}
                            variant="outline"
                            size="sm"
                            onClick={() => invoke('run_package_script', { projectPath: currentProject.path, scriptName: name })}
                            className="bg-white hover:bg-gray-900 hover:text-white border-gray-100 hover:border-gray-900 text-gray-900 font-black text-[11px] h-11 px-5 rounded-2xl group transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 tracking-tight uppercase"
                          >
                            <Play className="w-3 h-3 mr-2 group-hover:scale-125 transition-transform fill-current" />
                            {name}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 bg-gray-900/5 rounded-[2rem] border border-dashed border-gray-300 relative z-10">
                        <Package className="w-10 h-10 text-gray-200 mb-3" />
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No executable scripts found</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top 5 Packages */}
              <Top5Packages topPackages={topPackages} scanResult={scanResult} formatBytes={formatBytes} AnimatedCounter={AnimatedCounter} />

              {/* Controls & Search Bar */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 px-1">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-inner">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Sort Engine</span>
                    <div className="flex gap-1">
                      <Button
                        variant={sortBy === 'name' ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('name')}
                        className={`h-8 rounded-xl px-4 text-[11px] font-black uppercase transition-all ${sortBy === 'name' ? 'shadow-sm text-purple-600' : 'text-gray-500'}`}
                      >
                        Alphabetical
                      </Button>
                      <Button
                        variant={sortBy === 'size' ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('size')}
                        className={`h-8 rounded-xl px-4 text-[11px] font-black uppercase transition-all ${sortBy === 'size' ? 'shadow-sm text-purple-600' : 'text-gray-500'}`}
                      >
                        Disk Usage
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative w-full md:w-[400px] group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 w-4 h-4 transition-colors" />
                  <Input
                    placeholder="Search in project packages..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-11 h-12 rounded-2xl bg-white/60 backdrop-blur-md border-white/40 shadow-xl shadow-black/5 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Quick Install Search - Command Center Style */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 mb-10 border border-white/40 shadow-2xl relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                  <Download size={140} />
                </div>

                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Quick Injector</h3>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search and install new dependencies instantly</span>
                    </div>
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSearchResults([]); setSearchQuery(''); }}
                      className="text-[10px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest px-3"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Clear results
                    </Button>
                  )}
                </div>

                <div className="flex gap-3 relative z-10">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 w-5 h-5 transition-colors" />
                    <Input
                      placeholder="Enter package name (e.g. framer-motion, requests)..."
                      className="pl-12 h-14 bg-white/80 border-gray-100 rounded-2xl shadow-inner focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery && currentProject) {
                          setBusy(true)
                          const manager = scanResult?.packages?.[0]?.manager || 'npm'
                          invoke('search_packages', {
                            packageManager: manager,
                            query: searchQuery
                          })
                            .then(results => {
                              if (results && results.length > 0) {
                                setSearchResults(results)
                                showToast(`Found ${results.length} package(s)`, 'success')
                              } else {
                                showToast('No packages found', 'info')
                              }
                            })
                            .catch(e => showToast(`Search failed: ${e}`, 'error'))
                            .finally(() => setBusy(false))
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!searchQuery || !currentProject) return
                      setBusy(true)
                      const manager = scanResult?.packages?.[0]?.manager || 'npm'
                      invoke('search_packages', {
                        packageManager: manager,
                        query: searchQuery
                      })
                        .then(results => {
                          if (results && results.length > 0) {
                            setSearchResults(results)
                            showToast(`Found ${results.length} package(s)`, 'success')
                          } else {
                            showToast('No packages found', 'info')
                          }
                        })
                        .catch(e => showToast(`Search failed: ${e}`, 'error'))
                        .finally(() => setBusy(false))
                    }}
                    disabled={busy || !searchQuery || !currentProject}
                    className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-black/10 font-black transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                  >
                    {busy ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-3" /> Search</>}
                  </Button>
                </div>

                {/* Quick Install Results - Glassmorphic Cards */}
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Injection Candidates ({searchResults.length})</span>
                    </div>
                    {searchResults.slice(0, 5).map((pkg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-5 rounded-3xl bg-white/40 backdrop-blur-md border border-white/40 hover:border-purple-300 hover:bg-white/60 hover:shadow-2xl hover:scale-[1.01] transition-all group relative overflow-hidden"
                      >
                        {/* Status Bar */}
                        {installingPackages.has(pkg.name) && (
                          <div
                            className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all duration-300"
                            style={{ width: `${installingPackages.get(pkg.name)}%` }}
                          />
                        )}

                        <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-lg text-gray-900 truncate">{pkg.name}</h4>
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 rounded-lg font-mono text-purple-600 border-purple-100 bg-purple-50 shrink-0">
                                v{pkg.version}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1 font-medium">{pkg.description}</p>
                          </div>
                        </div>

                        <Button
                          size="lg"
                          onClick={async () => {
                            if (!currentProject) return
                            setInstallingPackages(prev => new Map(prev).set(pkg.name, 0))
                            showToast(`Injecting ${pkg.name}...`, 'info')

                            try {
                              const progressInterval = setInterval(() => {
                                setInstallingPackages(prev => {
                                  const current = prev.get(pkg.name) || 0
                                  if (current >= 90) {
                                    clearInterval(progressInterval)
                                    return prev
                                  }
                                  const newMap = new Map(prev)
                                  newMap.set(pkg.name, Math.min(current + 10, 90))
                                  return newMap
                                })
                              }, 300)

                              const manager = scanResult?.packages?.[0]?.manager || 'npm'
                              await invoke('install_package', {
                                packageManager: manager,
                                packageName: pkg.name,
                                projectPath: currentProject.path,
                                isGlobal: false
                              })

                              clearInterval(progressInterval)
                              setInstallingPackages(prev => {
                                const newMap = new Map(prev)
                                newMap.set(pkg.name, 100)
                                return newMap
                              })

                              setTimeout(() => {
                                setInstallingPackages(prev => {
                                  const newMap = new Map(prev)
                                  newMap.delete(pkg.name)
                                  return newMap
                                })
                                setSearchResults([])
                                setSearchQuery('')
                                scan(currentProject)
                              }, 1000)

                              showToast(`✅ ${pkg.name} successfully injected!`, 'success')
                            } catch (e) {
                              setInstallingPackages(prev => {
                                const newMap = new Map(prev)
                                newMap.delete(pkg.name)
                                return newMap
                              })
                              showToast(`Injection failed: ${e}`, 'error')
                            }
                          }}
                          disabled={installingPackages.has(pkg.name)}
                          className={`ml-4 h-12 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shrink-0 ${installingPackages.has(pkg.name) ? 'bg-purple-100 text-purple-600' : 'bg-gray-900 hover:bg-black text-white shadow-xl shadow-black/10 hover:scale-105 active:scale-95'}`}
                        >
                          {installingPackages.has(pkg.name) ? (
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {installingPackages.get(pkg.name)}%
                            </span>
                          ) : (
                            <><Download className="w-4 h-4 mr-2" /> Inject</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Actions Bar - Floating Style */}
              <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center mb-10 border border-white/60 shadow-2xl gap-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    variant="ghost"
                    onClick={toggleAll}
                    className="h-10 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-black text-[10px] uppercase tracking-widest"
                  >
                    {selectedPackages.size === (scanResult?.packages?.length || 0) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <div className="h-4 w-px bg-gray-200 mx-2 hidden sm:block" />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!scanResult) return
                      await performVersionCheck(scanResult)
                    }}
                    className="h-10 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 transition-all active:scale-95"
                    disabled={busy || installingPackages.size > 0}
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${busy ? 'animate-spin' : ''}`} />
                    Check for Updates
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAutoCheckUpdates(prev => !prev)}
                    className={`h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${autoCheckUpdates ? 'text-purple-600 bg-purple-50' : 'text-gray-400'}`}
                  >
                    <Zap className={`w-3 h-3 mr-2 ${autoCheckUpdates ? 'fill-current' : ''}`} />
                    Auto-Pilot: {autoCheckUpdates ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {selectedPackages.size > 0 && (
                  <div className="flex gap-3 animate-in slide-in-from-right-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20"
                      onClick={async () => {
                        if (!window.confirm(`Delete ${selectedPackages.size} selected package(s)? This will remove them from disk.`)) return
                        const toDelete = scanResult?.packages?.filter(p => selectedPackages.has(p.path)) || []
                        for (const p of toDelete) {
                          try {
                            await invoke('delete_package', { path: p.path })
                          } catch (e) {
                            console.error('delete failed for', p.path, e)
                          }
                        }
                        setScanResult(prev => prev ? { ...prev, packages: prev.packages.filter(p => !selectedPackages.has(p.path)), total_count: (prev.total_count || 0) - toDelete.length } : prev)
                        setSelectedPackages(new Set())
                        showToast(`Deleted ${toDelete.length} package(s)`, 'success')
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Purge ({selectedPackages.size})
                    </Button>
                    <Button
                      size="sm"
                      className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-500/20"
                      onClick={async () => {
                        const toUpdate = scanResult?.packages?.filter(p => selectedPackages.has(p.path)) || []
                        if (toUpdate.length === 0) return
                        await handleUpdateSelected(toUpdate)
                        setSelectedPackages(new Set())
                      }}
                      disabled={Array.from(selectedPackages).some(path => installingPackagesHasPath(path))}
                    >
                      <ArrowUpCircle className="w-3 h-3 mr-2" />
                      Update ({selectedPackages.size})
                    </Button>
                  </div>
                )}
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
                    const manualPackages = filteredPackages.filter(p => !p.is_declared)

                    return (
                      <div className="space-y-12">
                        {declaredPackages.length > 0 && (
                          <div className="space-y-6">
                            <div
                              className="bg-blue-600 rounded-3xl p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all text-white relative overflow-hidden group shadow-xl"
                              onClick={() => setIsDeclaredOpen(!isDeclaredOpen)}
                            >
                              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Package size={80} />
                              </div>
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                                    <Package className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-2xl font-black tracking-tight">Core Dependencies</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">{declaredPackages.length} Manifest Declared Packages</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="h-8 w-px bg-white/20 hidden sm:block" />
                                  {isDeclaredOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                              </div>
                            </div>

                            {isDeclaredOpen && (
                              <div className={packageView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-1 bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-4 border border-white/40 shadow-xl"}>
                                {declaredPackages.map((pkg) => (
                                  <PackageCard
                                    key={pkg.path}
                                    pkg={pkg}
                                    selected={selectedPackages.has(pkg.path)}
                                    onToggle={togglePackage}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                    onRevert={handleRevert}
                                    hasUpdate={updateAvailable.has(pkg.name)}
                                    latestVersion={updateAvailable.get(pkg.name)}
                                    verified={verifiedPackages.has(pkg.name)}
                                    isInstalling={installingPackages.has(pkg.name)}
                                    installProgress={installingPackages.get(pkg.name) || 0}
                                    versionHistory={packageVersionHistory.get(pkg.name) || []}
                                    viewMode={packageView}
                                    projectPath={currentProject.path}
                                    venvPath={venvPath}
                                    onMigratePackage={async (pkgName, pkgManager) => {
                                      try {
                                        showToast(`Migrating ${pkgName}...`, 'info')
                                        if (pkgManager === 'pip' && !venvPath) {
                                          await invoke('create_venv', { projectPath: currentProject.path })
                                          const v = await invoke('get_venv', { projectPath: currentProject.path })
                                          setVenvPath(v || null)
                                        }
                                        await invoke('install_package', {
                                          packageManager: pkgManager,
                                          packageName: pkgName,
                                          projectPath: currentProject.path,
                                          isGlobal: false
                                        })
                                        showToast(`Migrated ${pkgName}`, 'success')
                                        scan(currentProject)
                                      } catch (e) {
                                        showToast(`Failed to migrate ${pkgName}: ${e}`, 'error')
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {manualPackages.length > 0 && (
                          <div className="space-y-6">
                            <div
                              className="bg-emerald-600 rounded-3xl p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all text-white relative overflow-hidden group shadow-xl"
                              onClick={() => setIsSubDepsOpen(!isSubDepsOpen)}
                            >
                              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Layers size={80} />
                              </div>
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                                    <Layers className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-2xl font-black tracking-tight">Sub-dependencies</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">{manualPackages.length} Indirectly Managed Packages</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="h-8 w-px bg-white/20 hidden sm:block" />
                                  {isSubDepsOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                              </div>
                            </div>

                            {isSubDepsOpen && (
                              <div className={packageView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-1 bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-4 border border-white/40 shadow-xl"}>
                                {manualPackages.map((pkg) => (
                                  <PackageCard
                                    key={pkg.path}
                                    pkg={pkg}
                                    selected={selectedPackages.has(pkg.path)}
                                    onToggle={togglePackage}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                    onRevert={handleRevert}
                                    hasUpdate={updateAvailable.has(pkg.name)}
                                    latestVersion={updateAvailable.get(pkg.name)}
                                    verified={verifiedPackages.has(pkg.name)}
                                    isInstalling={installingPackages.has(pkg.name)}
                                    installProgress={installingPackages.get(pkg.name) || 0}
                                    versionHistory={packageVersionHistory.get(pkg.name) || []}
                                    viewMode={packageView}
                                    projectPath={currentProject.path}
                                    venvPath={venvPath}
                                    onMigratePackage={async (pkgName, pkgManager) => {
                                      try {
                                        showToast(`Migrating ${pkgName}...`, 'info')
                                        if (pkgManager === 'pip' && !venvPath) {
                                          await invoke('create_venv', { projectPath: currentProject.path })
                                          const v = await invoke('get_venv', { projectPath: currentProject.path })
                                          setVenvPath(v || null)
                                        }
                                        await invoke('install_package', {
                                          packageManager: pkgManager,
                                          packageName: pkgName,
                                          projectPath: currentProject.path,
                                          isGlobal: false
                                        })
                                        showToast(`Migrated ${pkgName}`, 'success')
                                        scan(currentProject)
                                      } catch (e) {
                                        showToast(`Failed to migrate ${pkgName}: ${e}`, 'error')
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="pb-20"></div>
                      </div>
                    )
                  })()
                )}
              </div>
            </motion.div>
          )}

          {/* SYSTEM PACKAGES VIEW */}
          {viewMode === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">System Workspace</h2>
                  <p className="text-gray-600">Global tools, toolchains and package managers</p>
                </div>
                <Button
                  onClick={async () => {
                    setBusy(true)
                    try {
                      const result = await invoke('scan_system_packages')
                      setScanResult(result)
                      const tools = await invoke('get_toolchain_info')
                      setToolchainInfo(tools)
                      showToast(`System scan complete`, 'success')
                    } catch (e) {
                      showToast(`System scan failed: ${e}`, 'error')
                    }
                    setBusy(false)
                  }}
                  disabled={busy}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                >
                  {busy ? 'Scanning...' : 'Refresh System Data'}
                </Button>
              </div>

              {scanResult && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {/* Dynamic Manager Summaries */}
                    {Object.entries(
                      scanResult.packages.reduce((acc, p) => {
                        if (!acc[p.manager]) acc[p.manager] = { size: 0, count: 0, path: scanResult.paths?.[p.manager] }
                        acc[p.manager].size += p.size
                        acc[p.manager].count += 1
                        return acc
                      }, {})
                    ).map(([manager, data]) => {
                      const tech = getTechIcon(manager)
                      return (
                        <div key={manager} className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg group hover:bg-white/60 transition-all">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 ${tech.color} rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                              {tech.image ? <img src={tech.image} className="w-6 h-6 object-contain" /> : <Package className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 uppercase">{manager} Global</h4>
                              <p className="text-[10px] text-gray-500 truncate max-w-[150px]" title={data.path}>{data.path || 'Path not found'}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <span className={`text-2xl font-black ${tech.textColor || 'text-purple-600'}`}>{formatBytes(data.size)}</span>
                              <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">Disk Usage</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-gray-700">{data.count}</span>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Packages</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Global Packages Inventory</h3>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {scanResult.packages?.map((pkg) => (
                      <PackageCard
                        key={pkg.path}
                        pkg={pkg}
                        selected={selectedPackages.has(pkg.path)}
                        onToggle={togglePackage}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        hasUpdate={updateAvailable.has(pkg.name)}
                        latestVersion={updateAvailable.get(pkg.name)}
                        verified={verifiedPackages.has(pkg.name)}
                        isInstalling={installingPackages.has(pkg.name)}
                        installProgress={installingPackages.get(pkg.name) || 0}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="pb-20"></div>
            </motion.div>
          )}

          {/* SMART MAINTENANCE VIEW */}
          {viewMode === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-purple-900">Smart Maintenance Hub</h2>
                  <p className="text-gray-600">Scan and cleanup your system for peak performance</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={runMaintenance}
                    disabled={isAnalyzing}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                  >
                    {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    {isAnalyzing ? 'Analyzing System...' : 'Refresh Health Report'}
                  </Button>
                  {maintenanceResult && maintenanceResult.caches.length > 0 && (
                    <Button
                      onClick={handleCleanAllCaches}
                      variant="outline"
                      className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> One-Click Cleanup
                    </Button>
                  )}
                </div>
              </div>

              {!maintenanceResult && !isAnalyzing && (
                <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-3xl border-2 border-dashed border-purple-200">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
                    <Zap className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">System Health Unknown</h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Analyze your projects and system state to find space-saving opportunities and dead dependencies.</p>
                  <Button onClick={runMaintenance} size="lg" className="bg-purple-600 text-white">Start Smart Scan</Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-3xl border border-white/20">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
                    <Search className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Running Deep Analysis</h3>
                  <p className="text-gray-500">Inspecting thousands of project files and system caches...</p>
                </div>
              )}

              {maintenanceResult && (
                <>
                  {/* Stats Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <Trash2 size={160} />
                      </div>
                      <h4 className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Potential Savings</h4>
                      <div className="text-5xl font-black mb-2">{formatBytes(maintenanceResult.total_savings)}</div>
                      <p className="text-sm text-blue-100/80">Reclaimable from redundant system caches</p>
                    </div>
                    <div className="bg-pink-600 rounded-3xl p-8 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <Package size={160} />
                      </div>
                      <h4 className="text-pink-100 font-bold uppercase tracking-widest text-xs mb-1">Unused Packages</h4>
                      <div className="text-5xl font-black mb-2">{maintenanceResult.unused_packages.length}</div>
                      <p className="text-sm text-pink-100/80">Bundled but not imported in your code</p>
                    </div>
                    <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <History size={160} />
                      </div>
                      <h4 className="text-purple-100 font-bold uppercase tracking-widest text-xs mb-1">Health Score</h4>
                      <div className="text-5xl font-black mb-2">
                        {maintenanceResult.total_savings > (appSettings.globalSizeThreshold || 2) * 1024 * 1024 * 1024 ? 'CRITICAL' : maintenanceResult.unused_packages.length > 5 ? 'NEEDS ATTENTION' : 'GOOD'}
                      </div>
                      <p className="text-sm text-purple-100/80">Overall project and system hygiene status</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                    {/* Caches List */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-2"><HardDrive className="text-blue-500" /> Redundant Caches</h3>
                        <Badge>{maintenanceResult.caches.length} Found</Badge>
                      </div>
                      <div className="space-y-3">
                        {maintenanceResult.caches.map((cache, i) => (
                          <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 flex items-center justify-between hover:bg-white/80 transition-all group">
                            <div>
                              <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-widest">{cache.name}</h4>
                              <p className="text-[10px] text-gray-500 truncate max-w-[200px]" title={cache.path}>{cache.path}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-black text-gray-900">{formatBytes(cache.size)}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Wasted</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCleanCache(cache.path)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unused Dependencies List */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-2"><History className="text-pink-500" /> Dead Dependencies</h3>
                        <Badge variant="secondary">{maintenanceResult.unused_packages.length} Detected</Badge>
                      </div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-100">
                        {maintenanceResult.unused_packages.length === 0 ? (
                          <div className="text-center py-10 bg-pink-50/50 rounded-2xl border border-pink-100 text-pink-600">
                            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="font-bold">Perfect Hygiene! No unused packages found.</p>
                          </div>
                        ) : (
                          maintenanceResult.unused_packages.map((pkg, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 flex items-center justify-between hover:bg-white/80 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter">{pkg.project_name}</Badge>
                                    <span className="text-[10px] text-gray-400">Not imported in source</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  // This would ideally open the project view or trigger uninstall
                                  setCurrentProject(projects.find(p => p.path === pkg.path));
                                  setViewMode('project');
                                  showToast(`Selected ${pkg.project_name} for cleanup`, 'info');
                                }}
                                className="text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="pb-20"></div>
            </motion.div>
          )}

          {/* RELEASE RECORDS / HISTORY VIEW */}
          {viewMode === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-black mb-3 text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Release Records Hub</h2>
                  <p className="text-gray-600 font-medium text-lg italic">Tracking PEEAK evolution and your workspace history</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Clear all history records?')) {
                      setHistoryRecords([])
                      localStorage.removeItem('peeak_history')
                    }
                  }}
                  className="hover:bg-red-50 hover:text-red-600 border-gray-200 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Logs
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Software Updates */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 shadow-inner">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">PEEAK Updates</h3>
                  </div>

                  <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-blue-100 pb-10">
                    {SOFTWARE_RELEASES.map((release, i) => (
                      <div key={i} className="relative pl-12 group">
                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white bg-blue-600 shadow-md flex items-center justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-white/60 shadow-sm group-hover:shadow-md transition-all border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black">{release.version}</Badge>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{release.date}</span>
                          </div>
                          <h4 className="text-lg font-black text-gray-900 mb-3">{release.title}</h4>
                          <ul className="space-y-2">
                            {release.features.map((f, fi) => (
                              <li key={fi} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-blue-500 font-bold">•</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Project Event Log */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-600 shadow-inner">
                      <History className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Workspace Activity</h3>
                  </div>

                  {historyRecords.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-200">
                      <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No activity recorded yet.</p>
                      <p className="text-[10px] text-gray-300 mt-1 uppercase font-bold tracking-widest">Perform updates or installs to see logs</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyRecords.map((record) => (
                        <div key={record.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 flex items-center justify-between hover:bg-white/80 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${record.type === 'UPDATE' || record.type === 'UPDATE_BATCH' || record.type === 'REVERT' ? 'bg-blue-50 text-blue-600' :
                              record.type === 'INSTALL' ? 'bg-green-50 text-green-600' :
                                record.type === 'DELETE' ? 'bg-red-50 text-red-600' :
                                  'bg-purple-50 text-purple-600'
                              }`}>
                              {record.type === 'UPDATE' || record.type === 'UPDATE_BATCH' ? <RefreshCw className="w-6 h-6" /> :
                                record.type === 'REVERT' ? <ArrowLeft className="w-6 h-6" /> :
                                  record.type === 'INSTALL' ? <Download className="w-6 h-6" /> :
                                    record.type === 'DELETE' ? <Trash2 className="w-6 h-6" /> :
                                      <Zap className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                  {new Date(record.timestamp).toLocaleTimeString()} • {new Date(record.timestamp).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter border-gray-200 text-gray-500">{record.projectName || 'System'}</Badge>
                              </div>
                              <h4 className="font-black text-gray-900">
                                {record.type === 'UPDATE' ? `Updated ${record.packageName}` :
                                  record.type === 'UPDATE_BATCH' ? `Bulk updated ${record.count} packages` :
                                    record.type === 'INSTALL' ? `Installed ${record.packageName}` :
                                      record.type === 'REVERT' ? `Reverted ${record.packageName}` :
                                        record.type === 'DELETE' ? `Removed ${record.packageName}` :
                                          record.type === 'CLEANUP' ? `System cache cleanup` :
                                            'System event'}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {record.type === 'UPDATE' && `From v${record.oldVersion} to v${record.newVersion}`}
                                {record.type === 'REVERT' && `Rolled back to v${record.toVersion}`}
                                {record.type === 'INSTALL' && `Latest version installed via ${record.manager}`}
                                {record.type === 'DELETE' && `Deleted from ${record.projectName}`}
                                {record.type === 'CLEANUP' && `Cleared GBs of redundant files`}
                                {record.type === 'UPDATE_BATCH' && `Performed batch maintenance in ${record.projectName}`}
                              </p>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className={
                              record.type === 'UPDATE' || record.type === 'UPDATE_BATCH' || record.type === 'REVERT' ? 'bg-blue-600' :
                                record.type === 'INSTALL' ? 'bg-green-600' :
                                  record.type === 'DELETE' ? 'bg-red-600' :
                                    'bg-purple-600'
                            }>
                              {record.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pb-20"></div>
            </motion.div>
          )}

          {/* FRAMEWORKS VIEW */}
          {viewMode === 'frameworks' && (
            <motion.div
              key="frameworks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Frameworks & Installer</h2>
                  <p className="text-gray-600">Detect frameworks and install packages</p>
                </div>
                <Button
                  onClick={async () => {
                    setBusy(true)
                    try {
                      const detected = await invoke('detect_frameworks')
                      setFrameworks(detected)
                      showToast(`Detected ${detected.length} framework(s)`, 'success')
                    } catch (e) {
                      showToast(`Detection failed: ${e}`, 'error')
                    }
                    setBusy(false)
                  }}
                  disabled={busy}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                >
                  {busy ? 'Detecting...' : 'Detect Frameworks'}
                </Button>
              </div>

              {/* Custom Location Input */}
              <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20 shadow-lg">
                <div className="flex gap-3 items-center">
                  <Input
                    id="custom-location-input"
                    placeholder="Add custom framework location"
                    className="flex-1 bg-white/60 backdrop-blur-sm border-white/30"
                  />
                  <Button variant="outline" onClick={() => showToast('Custom location feature coming soon', 'info')}>
                    Add Custom Location
                  </Button>
                </div>
              </div>

              {/* Framework Cards */}
              {frameworks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {frameworks.map((fw, i) => {
                    const techInfo = getTechIcon(fw.name.toLowerCase())
                    return (
                      <div key={i} className="bg-white/40 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-white/20 overflow-hidden p-2.5 group-hover:scale-110 transition-transform duration-300">
                            {techInfo.image ? (
                              <img src={techInfo.image} alt={fw.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className={`w-full h-full rounded-xl ${techInfo.color} flex items-center justify-center text-white font-black text-xl`}>
                                {techInfo.icon}
                              </div>
                            )}
                          </div>
                          <Badge className="bg-purple-100/80 text-purple-700 backdrop-blur-sm px-3 py-1">{fw.package_manager.toUpperCase()}</Badge>
                        </div>
                        <h4 className="font-black text-xl mb-1 text-gray-900">{fw.name}</h4>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {fw.version?.startsWith('v') ? fw.version : `v${fw.version}`}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs font-bold text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                            onClick={() => showToast(`Checking updates for ${fw.name}...`, 'info')}
                          >
                            <RefreshCw className="w-3 h-3 mr-2" /> Check Update
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Package Installer */}
              <div className="bg-white/40 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                <h3 className="text-2xl font-bold mb-6">Package Installer</h3>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search for packages (e.g., react, requests)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white/60 backdrop-blur-sm border-white/30"
                  />
                  <Button
                    onClick={() => {
                      if (!searchQuery) return
                      setBusy(true)
                      invoke('search_packages', { packageManager: frameworks[0]?.package_manager || 'npm', query: searchQuery })
                        .then(results => setSearchResults(results))
                        .finally(() => setBusy(false))
                    }}
                    disabled={busy || !searchQuery}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
                </div>

                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((pkg, i) => (
                      <div key={i} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{pkg.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={async () => {
                              setBusy(true)
                              try {
                                await invoke('install_package', {
                                  packageManager: frameworks[0]?.package_manager || 'npm',
                                  packageName: pkg.name,
                                  projectPath: currentProject?.path || null,
                                  isGlobal: !currentProject
                                })
                                showToast(`Installing ${pkg.name}...`, 'success')
                              } catch (e) {
                                showToast(`Install failed: ${e}`, 'error')
                              }
                              setBusy(false)
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Download className="w-3 h-3 mr-1" /> Install
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dialogs & Overlays */}
      <ProjectSelectorDialog
        open={showProjectSelector}
        onOpenChange={setShowProjectSelector}
        projects={projects}
        onSelect={executeInstall}
        onRemove={removeProject}
        packageName={pendingInstall?.packageName || ''}
      />

      <UninstallProjectDialog
        open={showUninstallDialog}
        onOpenChange={setShowUninstallDialog}
        onConfirm={handleUninstallProject}
        project={currentProject}
      />

      {
        isScanning && (
          <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-24 h-24 mb-5 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              <Package className="w-10 h-10 text-purple-600 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Analyzing Dependencies</h3>
            <p className="text-gray-500 font-medium">Please wait while we scan your project files...</p>
            <div className="mt-8 flex gap-2">
              <Badge variant="outline" className="bg-white/50 animate-pulse">Scanning Node Modules</Badge>
              <Badge variant="outline" className="bg-white/50 animate-pulse delay-75">Checking Usage</Badge>
              <Badge variant="outline" className="bg-white/50 animate-pulse delay-150">Calculating Size</Badge>
            </div>
          </div>
        )
      }

      <ProjectUpdateDialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        candidates={updateCandidates}
        onUpdate={handleUpdateSelected}
      />

      <ImportProgressDialog
        open={showImportProgress}
        projectName={importPendingRef.current ? importPendingRef.current.split(/[\\\/]/).pop() : ''}
        stage={importStage}
        packageCount={importPackageCount}
      />

      <UpdateFailureDialog
        open={showFailureDialog}
        onOpenChange={setShowFailureDialog}
        failedPackages={failedUpdates}
        onRetry={handleRetryFailed}
      />

      <RiskyUpdateDialog
        open={showRiskyUpdateDialog}
        onOpenChange={setShowRiskyUpdateDialog}
        riskyUpdate={riskyUpdate}
        onContinue={() => {
          setShowRiskyUpdateDialog(false)
          if (riskyUpdate) {
            handleUpdate(riskyUpdate.packageName, true)
          }
        }}
        onCancel={() => {
          setShowRiskyUpdateDialog(false)
          setRiskyUpdate(null)
        }}
      />

      <UpdatePromptDialog
        open={showUpdatePrompt}
        onOpenChange={setShowUpdatePrompt}
        packageUpdates={pendingUpdates.packages}
        frameworkUpdates={pendingUpdates.frameworks}
        onUpdate={handleImportUpdates}
        onSkip={handleSkipImportUpdates}
      />

      {/* PROJECT CREATION STUDIO */}
      <AnimatePresence>
        {viewMode === 'create-project' && (
          <motion.div
            key="create-project"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <ProjectCreationStudio
              onBack={() => setViewMode('dashboard')}
              onImport={(fullPath) => {
                try {
                  const name = fullPath.split(/[/\\]/).pop() || 'New Project';
                  const newProject = {
                    path: fullPath,
                    name: name,
                    technologies: ['npm'],
                    lastScanned: new Date().toISOString()
                  };

                  setProjects(prev => {
                    const exists = prev.find(p => p.path === fullPath);
                    if (exists) return prev;
                    const updated = [newProject, ...prev];
                    setTimeout(() => localStorage.setItem('projects', JSON.stringify(updated)), 0);
                    return updated;
                  });

                  setCurrentProject(newProject);
                  setViewMode('project');
                  showToast(`Project imported: ${name}`, 'success');
                } catch (err) {
                  console.error("Studio Import Error:", err);
                  showToast("Failed to import project", "error");
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={appSettings}
        onSave={handleSaveSettings}
        onCheckUpdates={() => showToast('You are using the latest version (v0.5.0)', 'success')}
      />
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        dir="auto"
        offset="90px"
        style={{ right: '8px' }}
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            padding: '14px 18px',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  )
}

export default App
