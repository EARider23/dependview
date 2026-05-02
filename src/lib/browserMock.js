/**
 * Browser mock layer for Tauri APIs.
 * When the app runs inside Tauri, all calls pass through to real Tauri APIs.
 * When running in a browser (Chrome), mock implementations are used so the UI is testable.
 */

// Detect if we're inside a Tauri webview
export const isTauri = () => {
  return !!(window.__TAURI__ || window.__TAURI_INTERNALS__)
}

// Demo projects seeded automatically in browser mode
export const DEMO_PROJECTS = [
  { path: 'D:\\Projects\\ecommerce-app', name: 'ecommerce-app', lastScanned: Date.now() },
  { path: 'D:\\Projects\\portfolio-site', name: 'portfolio-site', lastScanned: Date.now() - 86400000 },
  { path: 'D:\\Projects\\api-server', name: 'api-server', lastScanned: Date.now() - 172800000 },
  { path: 'D:\\Projects\\mobile-dashboard', name: 'mobile-dashboard', lastScanned: Date.now() - 259200000 },
]

// Seed demo projects into localStorage if in browser and no projects exist
export const seedDemoProjects = () => {
  if (isTauri()) return
  const saved = localStorage.getItem('projects')
  if (!saved || saved === '[]') {
    localStorage.setItem('projects', JSON.stringify(DEMO_PROJECTS))
    console.log('%c[BROWSER MODE] Seeded 4 demo projects', 'color: #22c55e; font-weight: bold;')
  }
}

// Folder path counter for browser import
let _browserImportCounter = 1

// Generate realistic mock packages for a project
const generateMockPackages = (projectName, projectPath) => {
  // Vary packages based on project name hash for variety
  const hash = projectName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  const allPkgs = [
    { name: 'react', version: '18.3.1', size: 4200000, manager: 'npm', is_declared: true },
    { name: 'react-dom', version: '18.3.1', size: 5100000, manager: 'npm', is_declared: true },
    { name: 'vite', version: '5.4.2', size: 3800000, manager: 'npm', is_declared: true },
    { name: 'tailwindcss', version: '3.4.1', size: 6200000, manager: 'npm', is_declared: true },
    { name: 'axios', version: '1.7.2', size: 890000, manager: 'npm', is_declared: true },
    { name: 'lucide-react', version: '0.395.0', size: 1200000, manager: 'npm', is_declared: true },
    { name: 'typescript', version: '5.5.3', size: 7600000, manager: 'npm', is_declared: true },
    { name: 'framer-motion', version: '11.2.10', size: 2400000, manager: 'npm', is_declared: true },
    { name: 'next', version: '14.2.3', size: 18500000, manager: 'npm', is_declared: true },
    { name: 'express', version: '4.19.2', size: 620000, manager: 'npm', is_declared: true },
    { name: 'lodash', version: '4.17.21', size: 1500000, manager: 'npm', is_declared: false },
    { name: 'postcss', version: '8.4.38', size: 780000, manager: 'npm', is_declared: false },
    { name: 'autoprefixer', version: '10.4.19', size: 420000, manager: 'npm', is_declared: false },
    { name: 'esbuild', version: '0.21.5', size: 9800000, manager: 'npm', is_declared: false },
    { name: 'webpack', version: '5.91.0', size: 12400000, manager: 'npm', is_declared: false },
    { name: 'babel-core', version: '7.24.5', size: 3200000, manager: 'npm', is_declared: false },
  ]

  // Select a subset based on hash
  const count = 8 + (hash % 5)
  const startIdx = hash % 4
  const mockPkgs = allPkgs.slice(startIdx, startIdx + count).map(p => ({
    ...p,
    path: `${projectPath}/node_modules/${p.name}`
  }))

  const total_size = mockPkgs.reduce((s, p) => s + p.size, 0)
  return {
    packages: mockPkgs,
    total_size,
    total_count: mockPkgs.length,
    duplicates: []
  }
}

// Store for scan results per project path
const scanCache = new Map()

// Mock implementation of Tauri's invoke
export const mockInvoke = async (cmd, args = {}) => {
  // Simulate a small network delay
  await new Promise(r => setTimeout(r, 150))

  switch (cmd) {
    case 'pick_folder': {
      // In browser, generate a fake project path instead of using prompt()
      const fakeNames = ['my-saas-app', 'react-dashboard', 'node-api', 'next-blog', 'vue-store', 'landing-page']
      const name = fakeNames[_browserImportCounter % fakeNames.length]
      _browserImportCounter++
      return `D:\\Projects\\${name}`
    }

    case 'scan_project_stream': {
      const folder = args.folder
      const projectName = folder.split(/[\\/]/).pop()
      const result = generateMockPackages(projectName, folder)
      scanCache.set(folder, result)

      // Simulate scan-progress events then scan-complete
      setTimeout(() => {
        const progressEvent = new CustomEvent('mock-scan-complete', {
          detail: { result, project_path: folder }
        })
        window.dispatchEvent(progressEvent)
      }, 600)

      return null
    }

    case 'detect_project_technologies': {
      const path = args.projectPath || ''
      const name = path.split(/[\\/]/).pop() || ''
      // Return different tech stacks based on project name
      if (name.includes('api') || name.includes('server') || name.includes('node')) {
        return ['npm', 'node', 'express', 'typescript']
      }
      if (name.includes('next') || name.includes('blog')) {
        return ['npm', 'react', 'next', 'tailwindcss']
      }
      if (name.includes('vue')) {
        return ['npm', 'vue', 'vite']
      }
      return ['npm', 'react', 'vite', 'tailwindcss']
    }

    case 'get_venv': {
      return null
    }

    case 'check_fast_managers': {
      return { bun: false, uv: false, pnpm: true }
    }

    case 'get_toolchain_info': {
      return {
        node: { version: '20.11.0', path: 'C:\\Program Files\\nodejs\\node.exe' },
        npm: { version: '10.2.3', path: 'C:\\Program Files\\nodejs\\npm.cmd' },
        python: { version: '3.12.1', path: 'C:\\Python312\\python.exe' },
        pnpm: { version: '9.1.0', path: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\pnpm.cmd' }
      }
    }

    case 'scan_system_packages': {
      return {
        packages: [
          { name: 'npm', version: '10.2.3', size: 24000000, manager: 'npm', is_declared: false, path: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\npm' },
          { name: 'yarn', version: '1.22.21', size: 5200000, manager: 'npm', is_declared: false, path: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\yarn' },
          { name: 'typescript', version: '5.5.3', size: 7600000, manager: 'npm', is_declared: false, path: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\typescript' },
          { name: 'pnpm', version: '9.1.0', size: 8900000, manager: 'npm', is_declared: false, path: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\pnpm' },
          { name: 'pip', version: '24.0', size: 3100000, manager: 'pip', is_declared: false, path: 'C:\\Python312\\Lib\\site-packages\\pip' },
        ],
        total_size: 49200000,
        total_count: 5,
        duplicates: [],
        paths: {
          npm: 'C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules',
          pip: 'C:\\Python312\\Lib\\site-packages'
        }
      }
    }

    case 'run_npm_outdated': {
      return {
        'axios': { current: '1.7.2', wanted: '1.7.4', latest: '1.7.4' },
        'lodash': { current: '4.17.21', wanted: '4.17.21', latest: '4.17.21' }
      }
    }

    case 'run_npm_audit': {
      return {
        metadata: {
          vulnerabilities: {
            info: 12,
            low: 5,
            moderate: 2,
            high: 0,
            critical: 0,
            total: 19
          }
        },
        actions: []
      }
    }

    case 'read_package_scripts': {
      return {
        "dev": "vite",
        "build": "vite build",
        "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview",
        "tauri": "tauri"
      }
    }

    case 'run_package_script': {
      console.log(`[MOCK] Running script: ${args.script_name} for project ${args.project_path}`)
      return `Started mock run for ${args.script_name}`
    }

    case 'update_package':
    case 'install_package':
    case 'delete_package':
    case 'delete_project_folder': {
      return true
    }

    case 'open_folder': {
      console.log(`[MOCK] Would open folder: ${args.path}`)
      return true
    }

    case 'search_packages': {
      const q = (args.query || '').toLowerCase()
      return [
        { name: `${q}`, version: '1.0.0', description: `A popular ${q} package for JavaScript` },
        { name: `${q}-utils`, version: '2.3.1', description: `Utility functions for ${q}` },
        { name: `@types/${q}`, version: '0.9.0', description: `TypeScript definitions for ${q}` },
      ]
    }

    case 'get_package_info': {
      return { name: args.packageName, version: '1.0.1', size: 500000, manager: args.manager || 'npm' }
    }

    case 'run_maintenance': {
      return {
        total_savings: 524288000,
        unused_packages: [
          { name: 'moment', project_name: 'ecommerce-app', path: 'D:\\Projects\\ecommerce-app' },
          { name: 'jquery', project_name: 'portfolio-site', path: 'D:\\Projects\\portfolio-site' }
        ],
        caches: [
          { name: 'NPM Cache', path: 'C:\\Users\\USER\\AppData\\Local\\npm-cache', size: 314572800 },
          { name: 'Yarn Cache', path: 'C:\\Users\\USER\\AppData\\Local\\Yarn\\Cache', size: 209715200 }
        ]
      }
    }

    case 'clean_selected_caches':
    case 'create_venv':
      return true

    case 'scan_workspace': {
      return []
    }

    case 'detect_project_technologies': {
      const folder = args.projectPath || ''
      if (folder.includes('ecommerce')) return ['react', 'nextjs', 'tailwind', 'typescript', 'supabase']
      if (folder.includes('portfolio')) return ['react', 'three']
      if (folder.includes('api')) return ['express', 'mongodb', 'firebase']
      if (folder.includes('mobile')) return ['react-native', 'expo']
      return ['react', 'vite']
    }

    case 'read_package_scripts': {
      const folder = args.projectPath || ''
      if (folder.includes('mobile')) return {} // Mock a project with no scripts
      return {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "lint": "eslint ."
      }
    }

    case 'run_package_script': {
      console.log(`[MOCK] Running script: ${args.scriptName} in ${args.projectPath}`)
      return "Script started"
    }

    default: {
      console.warn(`[MOCK] Unhandled invoke command: ${cmd}`, args)
      return null
    }
  }
}

// Mock convertFileSrc — in browser, just return the path as-is
export const mockConvertFileSrc = (path) => {
  return path || ''
}

// Setup mock scan event listeners (replaces Tauri event listeners)
export const setupMockEventListeners = (handlers) => {
  const { onScanComplete } = handlers

  const handleMockScanComplete = (e) => {
    if (onScanComplete) {
      onScanComplete({ payload: e.detail })
    }
  }

  window.addEventListener('mock-scan-complete', handleMockScanComplete)

  // Return cleanup function
  return () => {
    window.removeEventListener('mock-scan-complete', handleMockScanComplete)
  }
}
