import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ArrowLeft, Layers, Layout, Database, Palette, ChevronRight, Check, Sparkles, Code2, Wand2, Copy, Terminal, TestTube, Boxes, Search, Loader2, Rocket, FolderOpen, PlayCircle, ShoppingCart, LayoutDashboard, Briefcase, Store, Home, ShoppingBag, FolderKanban, Info, Mail, ShieldCheck, UploadCloud, CreditCard, Cloud, DatabaseZap, Box, Smartphone, BrainCircuit, Wrench } from 'lucide-react'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { techIcons, getTechIcon } from '../assets/iconLinks'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
    { id: 'app-type', label: 'Project Type', icon: Rocket },
    { id: 'frontend', label: 'Web/Frontend', icon: Layout },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'backend', label: 'Backend', icon: Database },
    { id: 'database', label: 'Database', icon: Boxes },
    { id: 'aiml', label: 'AI & ML', icon: BrainCircuit },
    { id: 'state', label: 'State', icon: Layers },
    { id: 'styling', label: 'UI/CSS', icon: Palette },
    { id: 'misc', label: 'Tools/Misc', icon: Wrench },
    { id: 'testing', label: 'Testing', icon: TestTube },
]

const TECH_OPTIONS = {
    'app-type': [
        { id: 'blank', name: 'Blank Template', iconKey: 'box', desc: 'Start completely empty', isLucide: true },
        { id: 'ecom', name: 'E-commerce', iconKey: 'shopping-cart', desc: 'Shop, Cart, Checkout flow', isLucide: true },
        { id: 'saas', name: 'SaaS / Dashboard', iconKey: 'layout-dashboard', desc: 'User management & Analytics', isLucide: true },
        { id: 'portfolio', name: 'Portfolio', iconKey: 'briefcase', desc: 'Showcase your work', isLucide: true },
        { id: 'marketplace', name: 'Marketplace', iconKey: 'store', desc: 'Multi-vendor platform', isLucide: true },
        { id: 'blog', name: 'Blog / Content', iconKey: 'info', desc: 'CMS and rich content', isLucide: true },
        { id: 'admin', name: 'Admin Panel', iconKey: 'shield-check', desc: 'Internal tools and metrics', isLucide: true },
    ],
    frontend: [
        { id: 'react', name: 'React', iconKey: 'react', desc: 'Fast React development' },
        { id: 'nextjs', name: 'Next.js', iconKey: 'nextjs', desc: 'Full-stack React framework' },
        { id: 'vue', name: 'Vue', iconKey: 'vue', desc: 'Progressive framework' },
        { id: 'svelte', name: 'Svelte', iconKey: 'svelte', desc: 'Cybernetically enhanced web apps' },
        { id: 'angular', name: 'Angular', iconKey: 'angular', desc: 'Enterprise component framework' },
        { id: 'astro', name: 'Astro', iconKey: 'astro', desc: 'Content-focused framework' },
        { id: 'html', name: 'Vanilla HTML/JS', iconKey: 'html', desc: 'Basic static project' },
    ],
    mobile: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'Web App Only', isLucide: true },
        { id: 'react-native', name: 'React Native', iconKey: 'react-native', desc: 'Native mobile apps with React' },
        { id: 'expo', name: 'Expo', iconKey: 'expo', desc: 'Build React Native faster' },
        { id: 'flutter', name: 'Flutter', iconKey: 'flutter', desc: 'Cross-platform native by Google' },
        { id: 'swift', name: 'Swift (iOS)', iconKey: 'swift', desc: 'Native iOS development' },
        { id: 'kotlin', name: 'Kotlin (Android)', iconKey: 'kotlin', desc: 'Native Android development' },
        { id: 'ionic', name: 'Ionic', iconKey: 'ionic', desc: 'Hybrid mobile apps' },
    ],
    backend: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'Client-side only', isLucide: true },
        { id: 'express', name: 'Express', iconKey: 'express', desc: 'Node.js framework' },
        { id: 'nestjs', name: 'NestJS', iconKey: 'nestjs', desc: 'Progressive Node.js framework' },
        { id: 'go', name: 'Go / Fiber', iconKey: 'go', desc: 'High performance backend' },
        { id: 'fastapi', name: 'FastAPI', iconKey: 'fastapi', desc: 'Modern Python web framework' },
        { id: 'django', name: 'Django', iconKey: 'django', desc: 'The web framework for perfectionists' },
        { id: 'laravel', name: 'Laravel', iconKey: 'laravel', desc: 'PHP web framework' },
        { id: 'spring', name: 'Spring Boot', iconKey: 'spring', desc: 'Java backend framework' },
        { id: 'php', name: 'PHP / Laravel', iconKey: 'php', desc: 'Versatile scripting language' },
        { id: 'ruby', name: 'Ruby on Rails', iconKey: 'ruby', desc: 'Developer happiness focused' },
    ],
    database: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'No database', isLucide: true },
        { id: 'postgres', name: 'PostgreSQL', iconKey: 'postgresql', desc: 'Advanced relational database' },
        { id: 'mongodb', name: 'MongoDB', iconKey: 'mongodb', desc: 'NoSQL document database' },
        { id: 'mysql', name: 'MySQL', iconKey: 'mysql', desc: 'Popular relational database' },
        { id: 'redis', name: 'Redis', iconKey: 'redis', desc: 'In-memory data store' },
        { id: 'sqlite', name: 'SQLite', iconKey: 'sqlite', desc: 'Local embedded database' },
        { id: 'supabase', name: 'Supabase', iconKey: 'supabase', desc: 'Open source Firebase/Postgres' },
        { id: 'firebase', name: 'Firebase', iconKey: 'firebase', desc: 'Google NoSQL Backend' },
        { id: 'mariadb', name: 'MariaDB', iconKey: 'mariadb', desc: 'Reliable relational DB' },
    ],
    aiml: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'No AI features', isLucide: true },
        { id: 'openai', name: 'OpenAI API', iconKey: 'openai', desc: 'GPT models via API' },
        { id: 'huggingface', name: 'Hugging Face', iconKey: 'huggingface', desc: 'Open source models & APIs' },
        { id: 'tensorflow', name: 'TensorFlow', iconKey: 'tensorflow', desc: 'Deep learning framework' },
        { id: 'pytorch', name: 'PyTorch', iconKey: 'pytorch', desc: 'Research-friendly ML framework' },
        { id: 'scikitlearn', name: 'Scikit-learn', iconKey: 'scikitlearn', desc: 'Machine learning library' },
        { id: 'langchain', name: 'LangChain', iconKey: 'langchain', desc: 'LLM Orchestration' },
    ],
    state: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'Built-in Context API', isLucide: true },
        { id: 'redux', name: 'Redux Toolkit', iconKey: 'redux', desc: 'Standard enterprise state' },
        { id: 'zustand', name: 'Zustand', iconKey: 'zustand', desc: 'Lightweight state management', requires: { frontend: ['react', 'nextjs', 'react-native'] } },
        { id: 'jotai', name: 'Jotai', iconKey: 'box', desc: 'Primitive and flexible state', isLucide: true, requires: { frontend: ['react', 'nextjs', 'react-native'] } },
        { id: 'pinia', name: 'Pinia', iconKey: 'vue', desc: 'Vue state management', requires: { frontend: ['vue'] } }
    ],
    pages: [
        { id: 'home', name: 'Home/Landing', iconKey: 'home', desc: 'Main entry page', isLucide: true },
        { id: 'shop', name: 'Shop/Products', iconKey: 'shopping-bag', desc: 'Product listing grid', requires: { 'app-type': ['ecom', 'marketplace'] }, isLucide: true },
        { id: 'cart', name: 'Shopping Cart', iconKey: 'shopping-cart', desc: 'Cart management', requires: { 'app-type': ['ecom', 'marketplace'] }, isLucide: true },
        { id: 'dashboard', name: 'App Dashboard', iconKey: 'layout-dashboard', desc: 'Admin/User panel', requires: { 'app-type': ['saas', 'marketplace', 'admin'] }, isLucide: true },
        { id: 'projects', name: 'Project List', iconKey: 'folder-kanban', desc: 'Portfolio grid', requires: { 'app-type': ['portfolio'] }, isLucide: true },
        { id: 'about', name: 'About Us', iconKey: 'info', desc: 'Company/Bio info', isLucide: true },
        { id: 'contact', name: 'Contact Page', iconKey: 'mail', desc: 'Communication form', isLucide: true },
        { id: 'blog', name: 'Blog Posts', iconKey: 'info', desc: 'Articles and content', requires: { 'app-type': ['blog', 'portfolio'] }, isLucide: true },
    ],
    features: [
        { id: 'auth', name: 'User Auth', iconKey: 'shield-check', desc: 'Login/Register system', isLucide: true },
        { id: 'search', name: 'Advanced Search', iconKey: 'search', desc: 'Search & Filters', isLucide: true },
        { id: 'upload', name: 'File Upload', iconKey: 'upload-cloud', desc: 'Image/File handling', isLucide: true },
        { id: 'payments', name: 'Payments/Stripe', iconKey: 'credit-card', desc: 'Stripe integration', requires: { 'app-type': ['ecom', 'saas', 'marketplace'] }, isLucide: true },
        { id: 'analytics', name: 'Analytics', iconKey: 'layout-dashboard', desc: 'Charts and metrics', isLucide: true },
        { id: 'notifications', name: 'Notifications', iconKey: 'mail', desc: 'Toast & Email alerts', isLucide: true },
    ],
    styling: [
        { id: 'tailwind', name: 'Tailwind', iconKey: 'tailwind', desc: 'Utility CSS' },
        { id: 'shadcn', name: 'shadcn/ui', iconKey: 'shadcn-ui', desc: 'Components', requires: { frontend: ['react', 'nextjs'] } },
        { id: 'mui', name: 'Material UI', iconKey: 'layout-dashboard', desc: 'Google Material Design', isLucide: true },
        { id: 'styled', name: 'Styled Components', iconKey: 'palette', desc: 'CSS-in-JS', isLucide: true },
        { id: 'css', name: 'Vanilla CSS', iconKey: 'css', desc: 'Built-in styling' },
        { id: 'scss', name: 'Sass/SCSS', iconKey: 'palette', desc: 'CSS with superpowers', isLucide: true },
    ],
    testing: [
        { id: 'none', name: 'None', iconKey: 'box', desc: 'No testing configured', isLucide: true },
        { id: 'vitest', name: 'Vitest', iconKey: 'vitest', desc: 'Fast Vite-native testing' },
        { id: 'jest', name: 'Jest', iconKey: 'jest', desc: 'Classic testing framework' },
        { id: 'cypress', name: 'Cypress', iconKey: 'cypress', desc: 'E2E Testing in browser' },
        { id: 'playwright', name: 'Playwright', iconKey: 'playwright', desc: 'Cross-browser E2E' },
    ],
    misc: [
        { id: 'docker', name: 'Docker', iconKey: 'docker', desc: 'Containerization' },
        { id: 'kubernetes', name: 'Kubernetes', iconKey: 'kubernetes', desc: 'Orchestration' },
        { id: 'aws', name: 'AWS', iconKey: 'aws', desc: 'Cloud infrastructure' },
        { id: 'vercel', name: 'Vercel', iconKey: 'vercel', desc: 'Edge deployments' },
        { id: 'netlify', name: 'Netlify', iconKey: 'netlify', desc: 'Web hosting' },
        { id: 'cloudflare', name: 'Cloudflare', iconKey: 'cloudflare', desc: 'Edge compute/CDN' },
        { id: 'stripe', name: 'Stripe', iconKey: 'stripe', desc: 'Payment processing' },
        { id: 'clerk', name: 'Clerk', iconKey: 'clerk', desc: 'Quick auth' },
        { id: 'auth0', name: 'Auth0', iconKey: 'auth0', desc: 'Enterprise auth' },
        { id: 'strapi', name: 'Strapi', iconKey: 'strapi', desc: 'Headless CMS' },
        { id: 'sanity', name: 'Sanity', iconKey: 'sanity', desc: 'Structured content' },
        { id: 'github', name: 'GitHub', iconKey: 'github', desc: 'Version control' },
        { id: 'discord', name: 'Discord', iconKey: 'discord', desc: 'Community integration' },
        { id: 'slack', name: 'Slack', iconKey: 'slack', desc: 'Team communication' },
        { id: 'prisma', name: 'Prisma ORM', iconKey: 'prisma', desc: 'Modern ORM' },
        { id: 'graphql', name: 'GraphQL', iconKey: 'graphql', desc: 'API language' },
    ]
}

const TEMPLATE_CATEGORIES = [
    { id: 'web', label: 'Web' },
    { id: 'backend', label: 'Backend' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'ai', label: 'AI & ML' },
    { id: 'databases', label: 'Databases' },
    { id: 'misc', label: 'Misc' },
    { id: 'edu', label: 'Education' },
    { id: 'mgmt', label: 'Management' }
]

// Mocking the astro icon if it is strictly strings
const getIcon = (key) => techIcons[key] || getTechIcon(key) || null

// Render Lucide icons based on key names
const renderLucideIcon = (iconKey, className = "w-6 h-6") => {
    switch (iconKey) {
        case 'shopping-cart': return <ShoppingCart className={className} />
        case 'layout-dashboard': return <LayoutDashboard className={className} />
        case 'briefcase': return <Briefcase className={className} />
        case 'store': return <Store className={className} />
        case 'home': return <Home className={className} />
        case 'shopping-bag': return <ShoppingBag className={className} />
        case 'folder-kanban': return <FolderKanban className={className} />
        case 'info': return <Info className={className} />
        case 'mail': return <Mail className={className} />
        case 'shield-check': return <ShieldCheck className={className} />
        case 'upload-cloud': return <UploadCloud className={className} />
        case 'credit-card': return <CreditCard className={className} />
        case 'cloud': return <Cloud className={className} />
        case 'database-zap': return <DatabaseZap className={className} />
        case 'box': return <Box className={className} />
        case 'search': return <Search className={className} />
        default: return <Layers className={className} />
    }
}

const TEMPLATES_DATA = {
    web: {
        featured: [
            { id: 'nextjs', name: 'NextJS', iconKey: 'nextjs', desc: 'Vibe code a new full-stack NextJS app with server-side rendering', iconContainerClasses: 'bg-black p-1 rounded-md' },
            { id: 'react', name: 'React + Vite', iconKey: 'react', desc: 'Vibe code a new React app in TypeScript or Javascript, built with Vite' },
            { id: 'vue', name: 'Vue.js', iconKey: 'vue', desc: 'Create a new Vue.js template with TS or JS and Vite' },
            { id: 'angular', name: 'Angular', iconKey: 'angular', desc: 'Vibe code a new Angular app in TypeScript built with ng-cli' },
            { id: 'svelte', name: 'Svelte', iconKey: 'svelte', desc: 'Create a new Svelte app in TypeScript or JavaScript, built with Vite', fallbackLogo: 'S' },
            { id: 'astro', name: 'Astro', iconKey: 'astro', desc: 'Create a new full-stack web app with Astro, great for content sites', fallbackLogo: 'A' },
        ],
        more: [
            { id: 'html', name: 'Vanilla HTML/JS', iconKey: 'html', desc: 'Vibe code a new, simple web app with plain HTML, CSS and JS' },
            { id: 'solid', name: 'SolidJS', iconKey: 'react', desc: 'Create a web app with SolidJS and Vite', fallbackLogo: 'St' },
            { id: 'react-gmaps', name: 'React + Google Maps', iconKey: 'react', desc: 'Add a Google map to a React app with TypeScript.' }
        ]
    },
    backend: {
        featured: [
            { id: 'express', name: 'Express + TS', iconKey: 'express', desc: 'Build a robust Express API server using Node.js and TypeScript' },
            { id: 'nestjs', name: 'NestJS', iconKey: 'nestjs', desc: 'Scalable and progressive Node.js server-side application framework' },
            { id: 'python-fastapi', name: 'FastAPI', iconKey: 'fastapi', desc: 'Very fast, modern Python web framework for building APIs' },
            { id: 'django', name: 'Django', iconKey: 'django', desc: 'High-level Python web framework that encourages rapid development' },
        ],
        more: [
            { id: 'go', name: 'Go Fiber API', iconKey: 'go', desc: 'High-performance Go backend with Fiber framework' },
            { id: 'laravel', name: 'Laravel API', iconKey: 'laravel', desc: 'PHP web application framework with expressive, elegant syntax' },
            { id: 'spring', name: 'Spring Boot', iconKey: 'spring', desc: 'Create enterprise-grade Java backend applications' }
        ]
    },
    mobile: {
        featured: [
            { id: 'react-native', name: 'React Native', iconKey: 'react-native', desc: 'Build native apps for Android and iOS using React' },
            { id: 'expo', name: 'Expo', iconKey: 'expo', desc: 'Make universal native apps with React that run on Android, iOS, and the web' },
            { id: 'flutter', name: 'Flutter', iconKey: 'flutter', desc: 'Cross-platform app development using Dart' },
        ],
        more: [
            { id: 'swift', name: 'SwiftUI (iOS)', iconKey: 'swift', desc: 'Native Apple iOS app development' },
            { id: 'kotlin', name: 'Kotlin (Android)', iconKey: 'kotlin', desc: 'Modern native Android app development' },
            { id: 'ionic', name: 'Ionic', iconKey: 'ionic', desc: 'Build high quality, cross-platform native and web app experiences' }
        ]
    },
    ai: {
        featured: [
            { id: 'openai-chat', name: 'OpenAI Chatbot', iconKey: 'openai', desc: 'Template for a GPT-4 powered conversational interface' },
            { id: 'langchain-agent', name: 'LangChain Agent', iconKey: 'langchain', desc: 'Build autonomous agents and orchestrate LLM workflows' },
            { id: 'hf-inference', name: 'Hugging Face API', iconKey: 'huggingface', desc: 'Integrate open-source machine learning models' }
        ],
        more: [
            { id: 'pytorch-cnn', name: 'PyTorch Vision', iconKey: 'pytorch', desc: 'Computer vision model training template' },
            { id: 'tf-js', name: 'TensorFlow.js', iconKey: 'tensorflow', desc: 'Train and deploy ML models directly in the browser' },
            { id: 'sklearn-predict', name: 'Scikit-learn Analytics', iconKey: 'scikitlearn', desc: 'Data analysis and predictive modeling base' }
        ]
    },
    databases: {
        featured: [
            { id: 'postgres-prisma', name: 'PostgreSQL + Prisma', iconKey: 'postgresql', desc: 'Relational DB setup with Prisma ORM migrations' },
            { id: 'mongodb-mongoose', name: 'MongoDB + Mongoose', iconKey: 'mongodb', desc: 'NoSQL document database setup with Mongoose schemas' },
            { id: 'supabase-starter', name: 'Supabase BaaS', iconKey: 'supabase', desc: 'Open source Firebase alternative with Postgres' }
        ],
        more: [
            { id: 'firebase-auth', name: 'Firebase Stack', iconKey: 'firebase', desc: 'Google backend with Firestore and Authentication' },
            { id: 'redis-cache', name: 'Redis Cache Layer', iconKey: 'redis', desc: 'In-memory data store for caching and pub/sub' },
            { id: 'sqlite-local', name: 'SQLite DB', iconKey: 'sqlite', desc: 'Lightweight local disk-based database setup' }
        ]
    },
    misc: {
        featured: [
            { id: 'docker-compose', name: 'Docker Stack', iconKey: 'docker', desc: 'Containerized multi-service application environment' },
            { id: 'strapi-cms', name: 'Strapi Headless CMS', iconKey: 'strapi', desc: 'Ready-to-use CMS with REST/GraphQL' },
            { id: 'stripe-checkout', name: 'Stripe Payments', iconKey: 'stripe', desc: 'E-commerce checkout flow integration' }
        ],
        more: [
            { id: 'k8s-manifests', name: 'Kubernetes Cluster', iconKey: 'kubernetes', desc: 'Base manifests for deploying scalable apps' },
            { id: 'aws-cdk', name: 'AWS CDK', iconKey: 'aws', desc: 'Infrastructure as Code template for AWS' },
            { id: 'discord-bot', name: 'Discord Bot', iconKey: 'discord', desc: 'Starter for an automated community bot' }
        ]
    },
    edu: {
        featured: [
            { id: 'lms-core', name: 'LMS Core', iconKey: 'nextjs', desc: 'Learning Management System for course delivery', fallbackLogo: 'LMS' },
            { id: 'edu-portal', name: 'School Portal', iconKey: 'react', desc: 'Student and teacher management interface', fallbackLogo: 'ED' },
            { id: 'quiz-app', name: 'Quiz Engine', iconKey: 'svelte', desc: 'Interactive assessment and real-time grading', fallbackLogo: 'Q' }
        ],
        more: [
            { id: 'assignment-tracker', name: 'Assignment Hub', iconKey: 'vue', desc: 'Deadlines and submission tracking' }
        ]
    },
    mgmt: {
        featured: [
            { id: 'crm-dashboard', name: 'CRM Dashboard', iconKey: 'nextjs', desc: 'Customer Relationship Management with analytics' },
            { id: 'hr-portal', name: 'HR Management', iconKey: 'clerk', desc: 'Employee onboarding and records portal' },
            { id: 'inv-manager', name: 'Inventory Stack', iconKey: 'postgresql', desc: 'Stock levels and procurement tracking' }
        ],
        more: [
            { id: 'ticket-system', name: 'Support Tickets', iconKey: 'supabase', desc: 'Help desk and issue resolution workflow' }
        ]
    }
}

const getOrbitalPosition = (index, total, time = 0, radius = 110, speed = 1) => {
    const rotation = (time / 300) * speed * 2 * Math.PI
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2 + rotation
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
    }
}

export function ProjectCreationStudio({ onBack, onImport }) {
    // Top-level View: 'templates' | 'custom-wizard' | 'review-custom' | 'review-template'
    const [view, setView] = useState('templates')
    const [activeSidebarItem, setActiveSidebarItem] = useState('web')

    // Custom Wizard State
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [selections, setSelections] = useState({})
    const [animationTick, setAnimationTick] = useState(0)

    // Template Selection State
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [copied, setCopied] = useState(false)

    // Build state
    const [buildLogs, setBuildLogs] = useState([])
    const [buildProgress, setBuildProgress] = useState(0)
    const [activeFile, setActiveFile] = useState('internal/builder.js')
    const [generatedFiles, setGeneratedFiles] = useState([])
    const [envInputs, setEnvInputs] = useState({})
    const [showEnvForm, setShowEnvForm] = useState(false)

    // Real Creation State
    const [projectName, setProjectName] = useState('my-awesome-app')
    const [envStatus, setEnvStatus] = useState(null) // { type: 'success' | 'error', message: string }
    const [targetFolder, setTargetFolder] = useState('')
    const [isScaffolding, setIsScaffolding] = useState(false)
    const [preferredIde, setPreferredIde] = useState('vscode')

    // Mouse tracking for interactive canvas dotted glow
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    const logsEndRef = useRef(null)

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }, [buildLogs])

    const handleCanvasMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }

    const checkCompatibility = (tech) => {
        if (!tech) return { compatible: true }

        // Check Requirements
        if (tech.requires) {
            for (const [stepId, compatibleIds] of Object.entries(tech.requires)) {
                const selectedForStep = selections[stepId]
                if (selectedForStep && !compatibleIds.includes(selectedForStep.id)) {
                    const requiredName = TECH_OPTIONS[stepId]?.find(t => t.id === compatibleIds[0])?.name || stepId
                    return { compatible: false, reason: `Needs ${requiredName}` }
                }
            }
        }

        // Check Excludes
        if (tech.excludes) {
            for (const [stepId, excludedIds] of Object.entries(tech.excludes)) {
                const selectedForStep = selections[stepId]
                if (selectedForStep && excludedIds.includes(selectedForStep.id)) {
                    return { compatible: false, reason: `Incompatible with ${selectedForStep.name}` }
                }
            }
        }

        return { compatible: true }
    }

    // AI Control Event Listener
    useEffect(() => {
        const unlistenPromise = listen('ai-open-studio', (event) => {
            let payload = {};
            try {
                payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
            } catch (e) {
                console.error("Failed to parse AI configuration payload", e);
                return;
            }

            console.log("AI Agent triggered auto-configuration:", payload);

            // Immediately switch to the custom wizard view
            setView('custom-wizard');

            const newSelections = { ...selections };

            // Process baseArchitecture (e.g. "react") => "frontend"
            if (payload.baseArchitecture) {
                const baseMatch = TECH_OPTIONS.frontend.find(t => t.id === payload.baseArchitecture.toLowerCase());
                if (baseMatch) newSelections.frontend = baseMatch;
            }

            // Note: The AI agent may also define dataStack/supportStack if needed.
            // We map simple examples in a best-effort approach.
            if (payload.dataStack && Array.isArray(payload.dataStack)) {
                // Try mapping to database or backend
                for (const item of payload.dataStack) {
                    const dbMatch = TECH_OPTIONS.database.find(t => t.id === item.toLowerCase());
                    if (dbMatch) newSelections.database = dbMatch;

                    const beMatch = TECH_OPTIONS.backend.find(t => t.id === item.toLowerCase());
                    if (beMatch) newSelections.backend = beMatch;
                }
            }

            if (payload.supportStack && Array.isArray(payload.supportStack)) {
                // Try mapping to styling or state
                for (const item of payload.supportStack) {
                    const styleMatch = TECH_OPTIONS.styling.find(t => t.id === item.toLowerCase());
                    if (styleMatch) newSelections.styling = styleMatch;

                    const stateMatch = TECH_OPTIONS.state.find(t => t.id === item.toLowerCase());
                    if (stateMatch) newSelections.state = stateMatch;

                    const testMatch = TECH_OPTIONS.testing.find(t => t.id === item.toLowerCase());
                    if (testMatch) newSelections.testing = testMatch;
                }
            }

            // Jump to the review screen if we configured enough base items, else stay on the builder
            setSelections(newSelections);

            if (newSelections.frontend) {
                // Fast-forward to the end of the wizard steps if we auto-configured
                setCurrentStepIndex(STEPS.length - 1);
            }
        });

        return () => {
            unlistenPromise.then(f => f());
        };
    }, []);


    const handlePickFolder = async () => {
        try {
            const folder = await invoke('pick_folder')
            if (folder) setTargetFolder(folder)
        } catch (err) {
            console.error("Failed to pick folder:", err)
        }
    }

    const startBuild = async (type = 'template') => {
        if (!targetFolder) {
            alert("Please select a target folder first.")
            return
        }

        setView('building')
        setBuildLogs(['Initializing real workspace creation...'])
        setBuildProgress(5)
        setIsScaffolding(true)

        const isCustom = type === 'custom'

        let command = ''
        let args = []

        if (isCustom) {
            const { frontend } = selections
            if (frontend?.id === 'nextjs') {
                command = 'npx'
                args = ['--yes', 'create-next-app@latest', projectName, '--typescript', '--tailwind', '--eslint', '--app', '--src-dir', '--import-alias', '@/*', '--use-npm']
            } else if (frontend?.id === 'react') {
                command = 'npx'
                args = ['--yes', 'create-vite@latest', projectName, '--template', 'react-ts']
            } else if (frontend?.id === 'vue') {
                command = 'npx'
                args = ['--yes', 'create-vite@latest', projectName, '--template', 'vue-ts']
            } else if (frontend?.id === 'angular') {
                command = 'npx'
                args = ['--yes', '@angular/cli', 'new', projectName, '--routing', '--style', 'css', '--skip-git']
            } else if (frontend?.id === 'svelte') {
                command = 'npx'
                args = ['--yes', 'create-vite@latest', projectName, '--template', 'svelte-ts']
            } else if (frontend?.id === 'astro') {
                command = 'npx'
                args = ['--yes', 'create-astro@latest', projectName, '--template', 'basics', '--no-git', '--no-install']
            } else if (frontend?.id === 'react-native') {
                command = 'npx'
                args = ['--yes', 'create-expo-app@latest', projectName, '--template', 'blank']
            } else {
                command = 'npx'
                args = ['--yes', 'create-vite@latest', projectName, '--template', 'vanilla-ts']
            }
        } else {
            // Template based
            switch (selectedTemplate?.id) {
                case 'angular':
                    command = 'npx'
                    args = ['--yes', '@angular/cli', 'new', projectName, '--routing', '--style', 'css', '--skip-git']
                    break
                case 'nextjs':
                    command = 'npx'
                    args = ['--yes', 'create-next-app@latest', projectName, '--typescript', '--tailwind', '--eslint', '--app', '--src-dir', '--import-alias', '@/*', '--use-npm']
                    break
                case 'astro':
                    command = 'npx'
                    args = ['--yes', 'create-astro@latest', projectName, '--template', 'basics', '--no-git', '--no-install', '--no-typescript']
                    break
                case 'react':
                    command = 'npx'
                    args = ['--yes', 'create-vite@latest', projectName, '--template', 'react-ts']
                    break
                case 'svelte':
                    command = 'npx'
                    args = ['--yes', 'create-vite@latest', projectName, '--template', 'svelte-ts']
                    break
                case 'react-native':
                    command = 'npx'
                    args = ['--yes', 'create-expo-app', projectName, '--template', 'blank']
                    break
                default:
                    command = 'npm'
                    args = ['init', '-y']
            }
        }

        const extraPackages = []
        if (isCustom) {
            const { backend, database, state, styling, testing, frontend, pages, features } = selections
            if (backend?.id === 'express') extraPackages.push('express', 'cors')
            if (backend?.id === 'trpc') extraPackages.push('@trpc/server', '@trpc/client')
            if (backend?.id === 'graphql') extraPackages.push('graphql')
            if (backend?.id === 'supabase') extraPackages.push('@supabase/supabase-js')
            if (backend?.id === 'firebase') extraPackages.push('firebase')

            if (database?.id === 'prisma') extraPackages.push('prisma', '@prisma/client')
            if (database?.id === 'drizzle') extraPackages.push('drizzle-orm', 'drizzle-kit')
            if (database?.id === 'mongoose') extraPackages.push('mongoose')

            if (state?.id === 'redux') extraPackages.push('@reduxjs/toolkit', 'react-redux')
            if (state?.id === 'zustand') extraPackages.push('zustand')
            if (state?.id === 'jotai') extraPackages.push('jotai')
            if (state?.id === 'pinia') extraPackages.push('pinia')
            if (state?.id === 'ngrx') extraPackages.push('@ngrx/store', '@ngrx/effects')

            if (styling?.id === 'tailwind' && frontend?.id !== 'nextjs') extraPackages.push('tailwindcss', 'postcss', 'autoprefixer')
            if (styling?.id === 'nativewind') extraPackages.push('nativewind', 'tailwindcss')
            if (styling?.id === 'shadcn') extraPackages.push('lucide-react', 'clsx', 'tailwind-merge')
            if (styling?.id === 'magic-ui') extraPackages.push('framer-motion', 'clsx', 'tailwind-merge', 'magic-ui')
            if (styling?.id === 'chakra') extraPackages.push('@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion')
            if (styling?.id === 'styled') extraPackages.push('styled-components')

            if (testing?.id === 'vitest') extraPackages.push('vitest')
            if (testing?.id === 'jest') extraPackages.push('jest', '@types/jest')
            if (testing?.id === 'playwright') extraPackages.push('@playwright/test')
            if (testing?.id === 'cypress') extraPackages.push('cypress')

            const selectedPages = Array.isArray(pages) ? pages.filter(p => p.id !== 'none') : []
            if (selectedPages.length > 0 && frontend?.id !== 'nextjs' && frontend?.id !== 'astro' && frontend?.id !== 'angular') {
                extraPackages.push('react-router-dom')
            }
        }

        setBuildLogs(prev => [...prev, `Executing Framework Scaffold: ${command} ${args.join(' ')}`])
        setActiveFile(`scaffolding ${projectName}...`)

        let currentPhase = 'framework'

        // Listen for logs
        const unlisten = await listen('scaffold-log', async (event) => {
            const { stream, line, code } = event.payload

            if (stream === 'stdout' || stream === 'stderr') {
                if (line && line.trim()) {
                    // Strip ANSI escape codes (colors, formatting)
                    const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim()
                    if (cleanLine) {
                        setBuildLogs(prev => [...prev, cleanLine])
                        setActiveFile(cleanLine.slice(0, 60) + (cleanLine.length > 60 ? '...' : ''))
                    }
                }
            } else if (stream === 'exit') {
                if (code !== 0) {
                    setBuildLogs(prev => [...prev, `Build failed during ${currentPhase} with exit code ${code}`])
                    setIsScaffolding(false)
                    unlisten()
                    return
                }

                if (currentPhase === 'framework' && extraPackages.length > 0) {
                    currentPhase = 'dependencies'
                    setBuildLogs(prev => [
                        ...prev,
                        `Framework scaffolded! Initiating next phase...`,
                        `Installing Custom Stack Dependencies: npm install ${extraPackages.join(' ')}`
                    ])
                    setActiveFile(`npm install ${extraPackages[0]}${extraPackages.length > 1 ? ` +${extraPackages.length - 1} more` : ''}`)
                    setBuildProgress(p => Math.max(p, 50))

                    const slash = targetFolder.endsWith('/') || targetFolder.endsWith('\\') ? '' : '/'
                    const fullProjectFolder = `${targetFolder}${slash}${projectName}`

                    try {
                        await invoke('execute_scaffold_command', {
                            command: 'npm',
                            args: ['install', ...extraPackages],
                            folder: fullProjectFolder
                        })
                    } catch (err) {
                        setBuildLogs(prev => [...prev, `Error launching npm install: ${err}`])
                        setIsScaffolding(false)
                        unlisten()
                    }
                } else if (currentPhase === 'dependencies' || (currentPhase === 'framework' && extraPackages.length === 0)) {
                    // PHASE 3: BOILERPLATE GENERATION
                    currentPhase = 'boilerplate'
                    setBuildLogs(prev => [...prev, "Dependencies installed! Wiring up your stack..."])
                    setBuildProgress(90)

                    const slash = targetFolder.endsWith('/') || targetFolder.endsWith('\\') ? '' : '/'
                    const fullProjectFolder = `${targetFolder}${slash}${projectName}`
                    const filesCreated = []

                    try {
                        const { backend, database, state, styling, testing, frontend, pages, features } = selections
                        const isNext = frontend?.id === 'nextjs'
                        const isVue = frontend?.id === 'vue'
                        const isAngular = frontend?.id === 'angular'

                        // Collect all templates to write
                        const tasks = []
                        const getPath = (baseName, subDir = '') => {
                            // Normalize slashes for Windows/Tauri
                            if (isNext) {
                                return `src/app/${subDir ? subDir + '/' : ''}${baseName}/page.tsx`
                            }
                            return `src/pages/${baseName}.tsx`
                        }

                        // 1. Backend Wiring
                        if (backend?.id === 'supabase') {
                            tasks.push({ path: 'src/lib/supabase.ts', content: `import { createClient } from '@supabase/supabase-js'\n\nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''\nconst supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''\n\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey)` })
                        }
                        if (backend?.id === 'firebase') {
                            tasks.push({ path: 'src/lib/firebase.ts', content: `import { initializeApp } from 'firebase/app'\n\nconst firebaseConfig = {\n  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,\n  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,\n  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID\n}\n\nexport const app = initializeApp(firebaseConfig)` })
                        }
                        if (backend?.id === 'express') {
                            tasks.push({ path: 'server/index.ts', content: `import express from 'express'\nimport cors from 'cors'\n\nconst app = express()\napp.use(cors())\napp.use(express.json())\n\napp.get('/api/health', (req, res) => res.json({ status: 'ok' }))\n\nconst PORT = process.env.PORT || 4000\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`))` })
                        }

                        // 2. Database Wiring
                        if (database?.id === 'drizzle') {
                            tasks.push({ path: 'src/db/schema.ts', content: `import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'\n\nexport const users = pgTable('users', {\n  id: serial('id').primaryKey(),\n  name: text('name'),\n  createdAt: timestamp('created_at').defaultNow()\n})` })
                        }
                        if (database?.id === 'prisma') {
                            tasks.push({ path: 'prisma/schema.prisma', content: `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel User {\n  id    Int     @id @default(autoincrement())\n  name  String?\n}` })
                        }

                        // 3. State Management
                        if (state?.id === 'redux') {
                            tasks.push({ path: 'src/store/store.ts', content: `import { configureStore } from '@reduxjs/toolkit'\n\nexport const store = configureStore({\n  reducer: {},\n})` })
                        }
                        if (state?.id === 'zustand') {
                            tasks.push({ path: 'src/store/useStore.ts', content: `import { create } from 'zustand'\n\nconst useStore = create((set) => ({\n  count: 0,\n  inc: () => set((state) => ({ count: state.count + 1 })),\n}))\n\nexport default useStore` })
                        }

                        // 4. Styling & UI
                        if (styling?.id === 'tailwind' && !isNext) {
                            tasks.push({ path: 'tailwind.config.js', content: `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}` })
                            tasks.push({ path: 'postcss.config.js', content: `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}` })
                        }
                        if (styling?.id === 'shadcn') {
                            tasks.push({ path: 'components.json', content: `{\n  "$schema": "https://ui.shadcn.com/schema.json",\n  "style": "default",\n  "rsc": ${isNext ? 'true' : 'false'},\n  "tsx": true,\n  "tailwind": {\n    "config": "tailwind.config.js",\n    "css": "src/index.css",\n    "baseColor": "slate",\n    "cssVariables": true\n  },\n  "aliases": {\n    "components": "@/components",\n    "utils": "@/lib/utils"\n  }\n}` })
                        }

                        // 5. Testing
                        if (testing?.id === 'vitest') {
                            tasks.push({ path: 'vitest.config.ts', content: `import { defineConfig } from 'vitest/config'\n\nexport default defineConfig({\n  test: {\n    environment: 'jsdom' \n  },\n})` })
                        }

                        // 6. Project Workbench (Pages & Features)
                        const selectedPages = Array.isArray(pages) ? pages.filter(p => p.id !== 'none') : []
                        const selectedFeatures = Array.isArray(features) ? features : []

                        if (selectedPages.length > 0 && !isNext) {
                            extraPackages.push('react-router-dom')
                        }

                        // Create Auth Service if needed
                        if (selectedFeatures.some(f => f.id === 'auth')) {
                            let authCode = `// Manual Auth Service\nexport const auth = {\n  login: async (email, password) => ({ user: { email }, error: null }),\n  logout: async () => {},\n  getUser: () => ({ email: 'demo@example.com' })\n}`
                            if (backend?.id === 'supabase') {
                                authCode = `import { supabase } from './supabase'\n\nexport const auth = {\n  login: (email, password) => supabase.auth.signInWithPassword({ email, password }),\n  register: (email, password) => supabase.auth.signUp({ email, password }),\n  logout: () => supabase.auth.signOut(),\n  getUser: () => supabase.auth.getUser()\n}`
                            } else if (backend?.id === 'firebase') {
                                authCode = `import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'\nimport { app } from './firebase'\n\nconst firebaseAuth = getAuth(app)\nexport const auth = {\n  login: (email, password) => signInWithEmailAndPassword(firebaseAuth, email, password),\n  logout: () => firebaseAuth.signOut(),\n}`
                            }
                            tasks.push({ path: 'src/lib/auth.ts', content: authCode })

                            // Auth Page UI
                            tasks.push({
                                path: getPath('Auth'),
                                content: `import React from 'react'\n\nexport default function AuthPage() {\n  return (\n    <div className="auth-container p-8">\n      <h1 className="text-2xl font-bold mb-4">Welcome Back</h1>\n      <form className="max-w-xs space-y-4" onSubmit={(e) => { e.preventDefault(); console.log('Login attempt'); }}>\n        <input className="w-full border border-gray-200 p-3 rounded-lg text-sm" type="email" placeholder="Email" />\n        <input className="w-full border border-gray-200 p-3 rounded-lg text-sm" type="password" placeholder="Password" />\n        <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors" type="submit">Continue to Dashboard</button>\n      </form>\n    </div>\n  )\n}`
                            })
                        }

                        // Pages Logic implementation
                        selectedPages.forEach(p => {
                            if (p.id === 'shop') {
                                tasks.push({ path: getPath('Shop'), content: `import React from 'react'\n\nconst PRODUCTS = [\n  { id: 1, name: 'Premium Theme', price: 59, desc: 'Advanced Tailwind UI Kit' },\n  { id: 2, name: 'Developer Kit', price: 129, desc: 'Full-stack boilerplate' }\n]\n\nexport default function Shop() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold mb-6">Store Front</h1>\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n        {PRODUCTS.map(p => (\n          <div key={p.id} className="border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-card">\n            <h3 className="font-bold text-lg mb-1">{p.name}</h3>\n            <p className="text-gray-400 text-sm mb-4">{p.desc}</p>\n            <div className="flex items-center justify-between mt-auto">\n                <span className="text-xl font-bold text-indigo-600">\${p.price}</span>\n                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black transition-colors">Add to Cart</button>\n            </div>\n          </div>\n        ))}\n      </div>\n    </div>\n  )\n}` })
                            } else if (p.id === 'dashboard') {
                                tasks.push({ path: getPath('Dashboard'), content: `import React from 'react'\n\nexport default function Dashboard() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold mb-6">User Analytics</h1>\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">\n          <div className="text-indigo-100 text-xs font-bold mb-1 uppercase tracking-widest">Active Projects</div>\n          <div className="text-3xl font-bold">12</div>\n        </div>\n        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">\n          <div className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-widest">Team Members</div>\n          <div className="text-3xl font-bold text-foreground">4</div>\n        </div>\n        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">\n          <div className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-widest">Storage Used</div>\n          <div className="text-3xl font-bold text-foreground">84%</div>\n        </div>\n      </div>\n    </div>\n  )\n}` })
                            } else if (p.id === 'cart') {
                                tasks.push({ path: 'src/lib/useCart.ts', content: `import { create } from 'zustand'\n\nexport const useCart = create((set) => ({\n  items: [],\n  addItem: (product) => set((state) => ({ items: [...state.items, product] })),\n  clearCart: () => set({ items: [] })\n}))` })
                            } else if (p.id !== 'auth' && p.id !== 'none') {
                                tasks.push({ path: getPath(p.id.charAt(0).toUpperCase() + p.id.slice(1)), content: `import React from 'react'\n\nexport default function ${p.id.charAt(0).toUpperCase() + p.id.slice(1)}Page() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold mb-4">${p.name}</h1>\n      <p className="text-muted-foreground">This is the scaffolding for the ${p.name} view.</p>\n    </div>\n  )\n}` })
                            }
                        })

                        // Generate a functional App.tsx or Layout.tsx
                        const entryPath = isNext ? 'src/app/layout.tsx' : 'src/App.tsx'
                        let appContent = `import React from 'react'\n`

                        if (!isNext) {
                            if (selectedPages.length > 0) Object.assign(appContent, appContent += `import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'\n`)
                            selectedPages.forEach(p => {
                                const componentName = p.id.charAt(0).toUpperCase() + p.id.slice(1)
                                appContent += `import ${componentName} from './pages/${componentName}'\n`
                            })
                        }

                        appContent += `\nexport default function ${isNext ? 'RootLayout' : 'App'}({ children }) {\n  return (\n`

                        // Wrapper for React Router if standard React
                        if (!isNext && selectedPages.length > 0) appContent += `    <BrowserRouter>\n`

                        appContent += `    <div className="min-h-screen bg-[#fcfcfd] text-foreground p-8 max-w-6xl mx-auto font-sans">\n      <header className="mb-12 flex items-center justify-between border-b border-border pb-8">\n        <div className="flex items-center gap-3">\n            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">W</div>\n            <div className="font-bold text-xl tracking-tight">Workbench Project</div>\n        </div>\n        <nav className="flex gap-8 font-semibold text-sm text-gray-400">\n`

                        selectedPages.forEach(p => {
                            const linkTag = isNext ? 'a' : 'Link'
                            const hrefAttr = isNext ? 'href' : 'to'
                            const path = p.id === 'home' ? '/' : `/${p.id.toLowerCase()}`
                            appContent += `          <${linkTag} ${hrefAttr}="${path}" className="hover:text-foreground transition-colors">${p.name}</${linkTag}>\n`
                        })

                        appContent += `        </nav>\n      </header>\n      <main className="bg-card p-2 rounded-3xl border border-border shadow-sm overflow-hidden">\n        <div className="border border-white bg-muted/50 rounded-[22px] min-h-[500px] p-6">\n`

                        // Inject children (Next.js) or Routes (React Router)
                        if (isNext) {
                            appContent += `            {children || <div className="text-center py-24 text-gray-400">Next.js Environment Ready</div>}\n`
                        } else if (selectedPages.length > 0) {
                            appContent += `            <Routes>\n`
                            selectedPages.forEach(p => {
                                const componentName = p.id.charAt(0).toUpperCase() + p.id.slice(1)
                                const path = p.id === 'home' ? '/' : `/${p.id.toLowerCase()}`
                                appContent += `              <Route path="${path}" element={<${componentName} />} />\n`
                            })
                            appContent += `            </Routes>\n`
                        } else {
                            appContent += `            <div className="text-center py-24 text-gray-400">React Environment Ready</div>\n`
                        }

                        appContent += `        </div>\n      </main>\n    </div>\n`
                        if (!isNext && selectedPages.length > 0) appContent += `    </BrowserRouter>\n`
                        appContent += `  )\n}`
                        tasks.push({ path: entryPath, content: appContent })

                        // WRITE FILES IN LOOP WITH LOGGING
                        for (let i = 0; i < tasks.length; i++) {
                            const task = tasks[i]
                            const fullPath = `${fullProjectFolder}/${task.path}`.replace(/\/+/g, '/')

                            setActiveFile(task.path)
                            setBuildLogs(prev => [...prev, `Wiring file [${i + 1}/${tasks.length}]: ${task.path}`])

                            try {
                                await invoke('write_boilerplate_file', {
                                    file_path: fullPath,
                                    content: task.content
                                })
                                filesCreated.push(task.path)
                                // Smooth progress between 90 and 100
                                setBuildProgress(90 + Math.floor((i / tasks.length) * 10))
                            } catch (writeErr) {
                                setBuildLogs(prev => [...prev, `Warning: Failed to write ${task.path}. Skipping...`])
                                console.error(`Failed to write file: ${fullPath}`, writeErr)
                            }
                        }

                        setGeneratedFiles(filesCreated)
                        setIsScaffolding(false)
                        setBuildProgress(100)
                        setBuildLogs(prev => [...prev, "✓ Connection optimization complete!", `✓ Successfully injected ${filesCreated.length} core files.`])

                        // Check if we need env vars
                        const envsNeeded = []
                        if (backend?.id === 'supabase') envsNeeded.push('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
                        if (backend?.id === 'firebase') envsNeeded.push('NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID')
                        if (database?.id === 'drizzle' || database?.id === 'prisma') envsNeeded.push('DATABASE_URL')
                        if (selectedFeatures.some(f => f.id === 'payments')) envsNeeded.push('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET')

                        if (envsNeeded.length > 0) {
                            const initEnv = {}
                            envsNeeded.forEach(e => initEnv[e] = '')
                            setEnvInputs(initEnv)
                            setShowEnvForm(true)
                        }

                        setTimeout(() => setView('success'), 1200)
                        unlisten()
                    } catch (err) {
                        setBuildLogs(prev => [...prev, `Critical Error during wiring: ${err.message || err}`])
                        console.error("Wiring error:", err)
                        setIsScaffolding(false)
                        unlisten()
                    }
                } else {
                    setIsScaffolding(false)
                    setBuildProgress(100)
                    setBuildLogs(prev => [...prev, "Workspace successfully created!"])
                    setTimeout(() => setView('success'), 1200)
                    unlisten()
                }
            } else {
                setBuildLogs(prev => [...prev, line])
                setBuildProgress(p => {
                    if (currentPhase === 'framework') {
                        if (line.toLowerCase().includes('installing') || line.toLowerCase().includes('resolving')) return Math.max(p, 40)
                        return p < 50 ? Math.round(p + (50 - p) * 0.05) : p
                    } else {
                        return p < 95 ? Math.round(p + (100 - p) * 0.03) : p
                    }
                })
            }
        })

        try {
            await invoke('execute_scaffold_command', {
                command,
                args,
                folder: targetFolder
            })
        } catch (err) {
            setBuildLogs(prev => [...prev, `Error: ${err}`])
            setIsScaffolding(false)
            unlisten()
        }
    }

    useEffect(() => {
        let interval;
        if (view === 'custom-wizard') {
            interval = setInterval(() => setAnimationTick(t => t + 1), 50)
        }
        return () => interval && clearInterval(interval)
    }, [view])

    // -- Custom Wizard Handlers --
    const currentCategory = STEPS[currentStepIndex]
    const getSelectedItemsFlat = () => {
        const flat = []
        for (const [key, value] of Object.entries(selections)) {
            if (!value) continue
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (item.id !== 'none') flat.push({ ...item, categoryId: key })
                })
            } else if (value.id !== 'none' && value.id !== 'context') {
                flat.push({ ...value, categoryId: key })
            }
        }
        return flat
    }
    const selectedItemsFlat = getSelectedItemsFlat()

    const isStepComplete = currentCategory?.multi
        ? Array.isArray(selections[currentCategory.id]) && selections[currentCategory.id].length > 0
        : !!selections[currentCategory?.id]

    const handleSelect = (tech) => {
        if (currentCategory.multi) {
            setSelections(prev => {
                const current = prev[currentCategory.id] || []
                const exists = current.find(t => t.id === tech.id)
                if (exists) {
                    return { ...prev, [currentCategory.id]: current.filter(t => t.id !== tech.id) }
                } else {
                    return { ...prev, [currentCategory.id]: [...current, tech] }
                }
            })
        } else {
            setSelections(prev => ({ ...prev, [currentCategory.id]: tech }))
        }
    }

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            setView('review-custom')
        }
    }

    const handleSkip = () => {
        setSelections(prev => ({ ...prev, [currentCategory.id]: { id: 'none', name: 'Skipped', iconKey: null } }))
        handleNext()
    }

    const handleBackStep = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1)
        else setView('templates')
    }

    const generateCustomCommand = () => {
        const { frontend } = selections
        // NEXT.JS: --yes ensures it doesn't prompt for options we already flagged
        if (frontend?.id === 'nextjs') return 'npx --yes create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm'
        // VITE: npm create vite usually needs --yes or -- and template to be non-interactive
        if (frontend?.id === 'react') return 'npm create vite@latest my-app -- --template react-ts'
        if (frontend?.id === 'vue') return 'npm create vite@latest my-app -- --template vue-ts'
        if (frontend?.id === 'angular') return 'npx --yes @angular/cli new my-app --routing --style css --skip-install'
        if (frontend?.id === 'svelte') return 'npm create vite@latest my-app -- --template svelte-ts'
        if (frontend?.id === 'astro') return 'npm create astro@latest my-app -- --template basics --no-install --no-git'
        if (frontend?.id === 'react-native') return 'npx --yes create-expo-app my-app --template blank'
        return 'npm create vite@latest my-app -- --template vanilla-ts'
    }

    const handleTemplateClick = (template) => {
        setSelectedTemplate(template)
        setView('review-template')
    }

    const getTemplateCommand = (tmpl) => {
        switch (tmpl?.id) {
            case 'angular': return 'npx @angular/cli new my-app'
            case 'nextjs': return 'npx create-next-app@latest my-app'
            case 'astro': return 'npm create astro@latest'
            case 'react': return 'npm create vite@latest my-app -- --template react-ts'
            case 'svelte': return 'npm create vite@latest my-app -- --template svelte-ts'
            case 'express': return 'npx express-generator --no-view my-app'
            case 'flutter': return 'flutter create my_app'
            default: return 'npm init -y'
        }
    }

    const activeData = TEMPLATES_DATA[activeSidebarItem] || { featured: [], more: [] }

    return (
        <div className="min-h-screen bg-[#0e0e11] text-gray-200 flex flex-col font-sans selection:bg-[#2b2b36] selection:text-white">
            {/* Topbar */}
            <div className="h-14 border-b border-[#27272a] bg-[#0e0e11] flex items-center justify-between px-4 z-50 sticky top-0 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (view === 'templates') onBack();
                            else setView('templates');
                        }}
                        className="text-gray-400 hover:text-white hover:bg-card/5 rounded-md px-2 h-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {view === 'templates' ? 'Dashboard' : 'Back'}
                    </Button>
                    <div className="h-4 w-px bg-gray-700 max-sm:hidden" />
                    <div className="flex items-center gap-2 max-sm:hidden">
                        <Wand2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-gray-100 text-sm tracking-wide">Project Studio</span>
                    </div>
                </div>

                {view === 'custom-wizard' && (
                    <div className="flex gap-1.5 items-center mr-4">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${idx === currentStepIndex ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)]' :
                                    idx < currentStepIndex ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                        'bg-[#18181b] border-[#27272a] text-muted-foreground'
                                    }`}>
                                    {idx < currentStepIndex ? <Check className="w-3 h-3" /> : idx + 1}
                                </div>
                                {idx < STEPS.length - 1 && <div className="w-3 h-px bg-[#27272a] mx-0.5" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* SIDEBAR (Visible in templates mode) */}
                {view === 'templates' && (
                    <div className="w-64 border-r border-white/5 bg-[#0e0e11]/60 backdrop-blur-xl shrink-0 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto custom-scrollbar z-10 shadow-[5px_0_30px_rgba(0,0,0,0.2)]">
                        <div className="p-5 pb-3">
                            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Templates</h2>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
                                Start a new workspace from one of our hand-crafted starting templates or build your own.
                            </p>
                        </div>

                        {/* Custom / Workspace special prominent button */}
                        <div className="px-3 pb-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setView('custom-wizard')}
                                className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors duration-200 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] group"
                            >
                                <div className="w-8 h-8 rounded-md bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Code2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-indigo-100">Custom Stack</span>
                                    <span className="text-[11px] text-indigo-300/70">Build from scratch wizard</span>
                                </div>
                            </motion.button>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent mx-4 my-2" />

                        {/* Categories Map */}
                        <div className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
                            {TEMPLATE_CATEGORIES.map(cat => {
                                const isActive = activeSidebarItem === cat.id;
                                return (
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.97 }}
                                        key={cat.id}
                                        onClick={() => setActiveSidebarItem(cat.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-white/10 text-white shadow-sm border border-white/5'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                            }`}
                                    >
                                        {cat.label}
                                        {isActive && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative h-[calc(100vh-3.5rem)]">

                    {/* TEMPLATES VIEW */}
                    {view === 'templates' && (
                        <div className="max-w-6xl p-8 lg:p-10 mx-auto animate-in fade-in duration-300">

                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Featured {activeSidebarItem} templates</h3>

                            {activeData.featured.length === 0 ? (
                                <div className="p-8 border border-dashed border-[#27272a] rounded-xl text-center text-muted-foreground bg-[#121214]">
                                    No featured templates available yet for this category.
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: {},
                                        show: { transition: { staggerChildren: 0.05 } }
                                    }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
                                >
                                    {activeData.featured.map(t => {
                                        const icon = getIcon(t.iconKey)
                                        return (
                                            <motion.div
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                                }}
                                                key={t.id}
                                                onClick={() => handleTemplateClick(t)}
                                                className="bg-[#141417]/80 backdrop-blur-md border border-white/5 rounded-xl p-5 cursor-pointer hover:border-indigo-500/50 hover:bg-[#1a1a1f]/90 transition-all duration-300 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.3)] hover:-translate-y-1.5 flex flex-col h-full"
                                            >
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className={`w-12 h-12 rounded-xl bg-[#0e0e11] border border-[#27272a] flex items-center justify-center shrink-0 overflow-hidden shadow-inner ${t.iconContainerClasses || ''}`}>
                                                        {icon?.image ? (
                                                            <img src={icon.image} alt={t.name} className="w-7 h-7 object-contain group-hover:scale-110 transition-transform duration-300" />
                                                        ) : (
                                                            <span className={`text-xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>{t.fallbackLogo || t.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pt-0.5">
                                                        <h4 className="font-bold text-gray-100 text-base">{t.name}</h4>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-sm leading-relaxed mt-auto">{t.desc}</p>
                                            </motion.div>
                                        )
                                    })}
                                </motion.div>
                            )}

                            {activeData.more && activeData.more.length > 0 && (
                                <>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6 border-t border-[#27272a] pt-10">More {activeSidebarItem} templates</h3>
                                    <motion.div
                                        initial="hidden"
                                        animate="show"
                                        variants={{
                                            hidden: {},
                                            show: { transition: { staggerChildren: 0.05 } }
                                        }}
                                        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                                    >
                                        {activeData.more.map(t => {
                                            const icon = getIcon(t.iconKey)
                                            return (
                                                <motion.div
                                                    variants={{
                                                        hidden: { opacity: 0, y: 15 },
                                                        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                                    }}
                                                    key={t.id}
                                                    onClick={() => handleTemplateClick(t)}
                                                    className="bg-[#141417]/80 backdrop-blur-md border border-white/5 rounded-lg p-4 cursor-pointer hover:border-indigo-500/50 hover:bg-[#1a1a1f]/90 transition-all duration-300 flex items-center gap-4 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.2)] hover:-translate-y-1"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-[#0e0e11] border border-[#27272a] flex items-center justify-center shrink-0 shadow-inner">
                                                        {icon?.image ? (
                                                            <img src={icon.image} className="w-5 h-5 object-contain" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-gray-300">{t.fallbackLogo || t.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-200 text-sm mb-1">{t.name}</h4>
                                                        <p className="text-muted-foreground text-xs line-clamp-1">{t.desc}</p>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </motion.div>
                                </>
                            )}
                        </div>
                    )}

                    {/* REVIEW TEMPLATE (when a template is clicked) */}
                    {view === 'review-template' && selectedTemplate && (
                        <div className="max-w-2xl mx-auto py-16 px-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center mb-10">
                                <div className="inline-flex w-20 h-20 rounded-2xl bg-[#141417] border-2 border-[#27272a] mb-6 items-center justify-center shadow-2xl relative">
                                    <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
                                    {getIcon(selectedTemplate.iconKey)?.image ? (
                                        <img src={getIcon(selectedTemplate.iconKey).image} className="w-10 h-10 relative z-10" />
                                    ) : (
                                        <span className="text-3xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent relative z-10">{selectedTemplate.fallbackLogo || selectedTemplate.name[0]}</span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">Launch {selectedTemplate.name}</h2>
                                <p className="text-gray-400 max-w-md mx-auto">{selectedTemplate.desc}</p>
                            </div>

                            <Card className="mb-8 border-[#27272a] bg-[#141417] shadow-xl overflow-hidden rounded-xl">
                                <div className="bg-[#1a1a1f] px-5 py-3.5 flex items-center justify-between border-b border-[#27272a]">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-indigo-400" />
                                        <span className="text-sm text-gray-300 font-mono tracking-tight">Initialization Command</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(getTemplateCommand(selectedTemplate)); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="h-8 text-xs text-gray-400 hover:text-white hover:bg-card/10 px-3">
                                        {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}{copied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <div className="bg-[#0a0a0c] p-6 text-emerald-400 font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap">
                                    {getTemplateCommand(selectedTemplate)}
                                </div>
                            </Card>

                            {/* Project Settings */}
                            <Card className="mb-8 border-[#27272a] bg-[#141417] shadow-xl p-6 rounded-xl">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    Workspace Configuration
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Name</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                                            placeholder="my-awesome-app"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Storage Location</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-[#1a1a1f] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-gray-400 truncate font-mono">
                                                {targetFolder || 'No folder selected'}
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={handlePickFolder}
                                                className="border-[#27272a] bg-[#1a1a1f] hover:bg-[#27272a] text-gray-300 h-10 px-4"
                                            >
                                                Browse
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-center gap-4">
                                <Button
                                    onClick={() => startBuild('template')}
                                    disabled={!targetFolder || !projectName}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 px-8 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Rocket className="w-4 h-4 mr-2" /> Initialize Workspace
                                </Button>
                            </div>
                        </div>
                    )}


                    {/* CUSTOM STACK WIZARD */}
                    {view === 'custom-wizard' && (
                        <div className="flex h-full animate-in fade-in duration-300">
                            {/* Options Panel */}
                            <div className="w-96 border-r border-white/5 bg-[#121214]/80 backdrop-blur-xl flex flex-col relative z-20 shadow-[10px_0_40px_rgba(0,0,0,0.5)] overflow-y-auto">
                                <div className="p-6 pb-2 shrink-0">
                                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 text-[10px] tracking-wider uppercase">Step {currentStepIndex + 1} of {STEPS.length}</Badge>
                                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Select {currentCategory.label}</h2>
                                    <p className="text-gray-400 text-sm">Choose the best foundation for your stack</p>
                                </div>

                                <ScrollArea className="flex-1 px-4 mt-2">
                                    <motion.div
                                        initial="hidden"
                                        animate="show"
                                        variants={{
                                            hidden: {},
                                            show: { transition: { staggerChildren: 0.05 } }
                                        }}
                                        key={currentStepIndex}
                                        className="space-y-2.5 pb-6"
                                    >
                                        {TECH_OPTIONS[currentCategory.id].map(tech => {
                                            const stepSelections = selections[currentCategory.id]
                                            const isSelected = currentCategory.multi
                                                ? Array.isArray(stepSelections) && stepSelections.some(t => t.id === tech.id)
                                                : stepSelections?.id === tech.id

                                            const iconData = getIcon(tech.iconKey)
                                            const cap = checkCompatibility(tech)
                                            const isCompatible = cap.compatible

                                            return (
                                                <motion.div
                                                    variants={{
                                                        hidden: { opacity: 0, x: -20 },
                                                        show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                                    }}
                                                    key={tech.id}
                                                    onClick={() => isCompatible && handleSelect(tech)}
                                                    className={`p-3.5 rounded-xl border flex items-center gap-4 transition-all duration-300 group relative ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_4px_20px_rgba(79,70,229,0.2)] ring-1 ring-indigo-500/50 cursor-pointer scale-[1.02]'
                                                        : !isCompatible
                                                            ? 'border-red-900/20 bg-red-950/5 opacity-40 cursor-not-allowed filter grayscale'
                                                            : 'border-white/5 hover:border-indigo-500/30 bg-[#18181b]/60 hover:bg-[#1a1a1f]/80 backdrop-blur-md cursor-pointer hover:shadow-[0_4px_15px_rgba(79,70,229,0.1)] hover:-translate-y-0.5'
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-[#0e0e11] border border-[#27272a] flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                                        {iconData?.image ? (
                                                            <img src={iconData.image} className={`w-6 h-6 object-contain ${isSelected ? '' : 'opacity-80 group-hover:opacity-100'}`} />
                                                        ) : (
                                                            <span className="text-base font-bold text-muted-foreground">{tech.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-semibold truncate mb-0.5 flex items-center gap-2 ${isSelected ? 'text-indigo-100' : 'text-gray-200'}`}>
                                                            {tech.name}
                                                            {!isCompatible && (
                                                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-red-500/30 text-red-400 bg-red-500/5 uppercase font-bold">
                                                                    {cap.reason}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">{tech.desc}</div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-[#42424a] bg-[#121214]'}`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>

                                                    {!isCompatible && (
                                                        <div className="absolute inset-0 z-10 bg-transparent rounded-xl" title={cap.reason} />
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </motion.div>
                                </ScrollArea>

                                <div className="p-4 border-t border-white/5 bg-[#121214]/90 backdrop-blur-md flex justify-between items-center shrink-0 sticky bottom-0">
                                    <Button variant="ghost" onClick={handleBackStep} className="text-gray-400 hover:text-white hover:bg-card/5 h-9">Back</Button>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-gray-300 hover:bg-card/5 h-9 text-xs">Skip Step</Button>
                                        <Button onClick={handleNext} disabled={!isStepComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 px-5 shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:shadow-none">
                                            {currentStepIndex === STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4 ml-1.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Canvas Area */}
                            <div
                                className="flex-1 bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden group/canvas"
                                onMouseMove={handleCanvasMouseMove}
                                onMouseLeave={() => setMousePos({ x: -1000, y: -1000 })}
                            >
                                {/* Base dim dotted grid */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-40"
                                    style={{
                                        backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
                                        backgroundSize: '24px 24px',
                                        backgroundPosition: '0 0',
                                        WebkitMaskImage: `radial-gradient(circle at center, black 0%, transparent 100%)`,
                                        maskImage: `radial-gradient(circle at center, black 0%, transparent 100%)`,
                                    }}
                                />

                                {/* True Random Twinkling Layer via SVG Pattern */}
                                <style>
                                    {`
                                        @keyframes true-twinkle {
                                            0%, 100% { opacity: 0; }
                                            50% { opacity: 1; }
                                        }
                                        .twinkle-dot {
                                            animation: true-twinkle var(--duration) ease-in-out var(--delay) infinite;
                                        }
                                    `}
                                </style>
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        WebkitMaskImage: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                                        maskImage: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                                        opacity: mousePos.x !== -1000 ? 1 : 0,
                                        transition: 'opacity 0.3s ease',
                                    }}
                                >
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id="random-twinkle" width="240" height="240" patternUnits="userSpaceOnUse">
                                                {Array.from({ length: 100 }).map((_, i) => {
                                                    const x = (i % 10) * 24;
                                                    const y = Math.floor(i / 10) * 24;
                                                    // Pseudo-random deterministic values so it doesn't re-render differently
                                                    const seed = Math.sin(i * 9999) * 10000;
                                                    const rand = seed - Math.floor(seed);
                                                    const delay = rand * 3;
                                                    const duration = 1.5 + (rand * 2);
                                                    return (
                                                        <circle
                                                            key={i}
                                                            cx={x}
                                                            cy={y}
                                                            r="1.5"
                                                            fill="#a5b4fc"
                                                            className="twinkle-dot"
                                                            style={{
                                                                '--delay': `${delay}s`,
                                                                '--duration': `${duration}s`
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#random-twinkle)" />
                                    </svg>
                                </div>



                                {/* Ambient glow */}
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"
                                />

                                {/* Radar circles representing the rings */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="absolute w-[580px] h-[580px] rounded-full border border-indigo-500/10 transition-all duration-1000" />
                                    <div className="absolute w-[440px] h-[440px] rounded-full border border-indigo-500/15 transition-all duration-1000" />
                                    <div className="absolute w-[300px] h-[300px] rounded-full border border-indigo-500/20 transition-all duration-1000" />
                                    <div className="absolute w-[160px] h-[160px] rounded-full border border-indigo-500/30 transition-all duration-1000" />
                                </div>

                                {selectedItemsFlat.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center z-10 p-8 rounded-2xl bg-[#141417]/80 backdrop-blur-md border border-white/5 shadow-2xl"
                                    >
                                        <Layers className="w-12 h-12 mx-auto mb-4 text-indigo-400/50" />
                                        <p className="text-gray-300 font-medium tracking-wide">Workspace Empty</p>
                                        <p className="text-muted-foreground text-sm mt-1">Select technologies to build your stack</p>
                                    </motion.div>
                                ) : (
                                    <div className="relative w-[860px] h-[860px]">
                                        {/* Center Core */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-zinc-900/80 backdrop-blur-xl border border-indigo-500/40 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.3)] z-20">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="w-20 h-20 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent rounded-full flex items-center justify-center absolute inset-0 m-auto"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-16 h-16 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 rounded-full flex items-center justify-center absolute inset-0 m-auto blur-md"
                                            />
                                            <Layers className="w-8 h-8 text-indigo-300 relative z-10" />
                                        </div>

                                        {/* Visible Orbit Rings */}
                                        {[80, 150, 220, 290].map((radius, i) => (
                                            <div
                                                key={`ring-${i}`}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-indigo-400/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.02)] pointer-events-none"
                                                style={{ width: radius * 2, height: radius * 2 }}
                                            />
                                        ))}

                                        {/* Orbiting items organized into rings */}
                                        {(() => {
                                            const categorizeRing = (categoryId) => {
                                                if (['app-type'].includes(categoryId)) return 4; // Outer (Category)
                                                if (['frontend', 'backend'].includes(categoryId)) return 3; // Base Architecture
                                                if (['database', 'state'].includes(categoryId)) return 2; // Data & Logic Ring
                                                return 1; // Support Stack Ring (Styling/Testing)
                                            }

                                            const ringConfigs = {
                                                1: { items: selectedItemsFlat.filter(i => categorizeRing(i.categoryId) === 1), radius: 80, speed: 1.5 },
                                                2: { items: selectedItemsFlat.filter(i => categorizeRing(i.categoryId) === 2), radius: 150, speed: -1.2 },
                                                3: { items: selectedItemsFlat.filter(i => categorizeRing(i.categoryId) === 3), radius: 220, speed: 1.0 },
                                                4: { items: selectedItemsFlat.filter(i => categorizeRing(i.categoryId) === 4), radius: 290, speed: -0.8 },
                                            }

                                            return [1, 2, 3, 4].map(ringNum => {
                                                const config = ringConfigs[ringNum];
                                                return config.items.map((item, index) => {
                                                    const pos = getOrbitalPosition(index, config.items.length, animationTick, config.radius, config.speed)
                                                    const float = Math.sin((animationTick + (index * 40) + (ringNum * 20)) * 0.05) * 6

                                                    // Check if it should render a lucide icon or an image icon
                                                    const iconRender = item.isLucide ?
                                                        renderLucideIcon(item.iconKey, "w-6 h-6 text-gray-400 group-hover:text-indigo-400 transition-colors") :
                                                        (getIcon(item.iconKey)?.image ?
                                                            <img src={getIcon(item.iconKey).image} className="w-8 h-8 object-contain" /> :
                                                            <span className="text-lg font-bold text-muted-foreground">{item.name[0]}</span>
                                                        )

                                                    return (
                                                        <div
                                                            key={`${item.categoryId}-${item.id}`}
                                                            className="absolute top-1/2 left-1/2 z-10"
                                                            style={{
                                                                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y + float}px))`,
                                                            }}
                                                        >
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: ringNum * 0.1 + index * 0.05 }}
                                                                className="relative group"
                                                            >
                                                                <div className="w-14 h-14 rounded-full bg-zinc-900/80 backdrop-blur-xl shadow-2xl border border-indigo-500/20 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-all duration-300 group-hover:border-indigo-400/60 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] z-10 relative">
                                                                    {iconRender}
                                                                </div>

                                                                {/* Tooltip */}
                                                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                                                                    <div className="bg-zinc-900/90 backdrop-blur-xl border border-indigo-500/30 text-indigo-50 text-xs px-3 py-1.5 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.2)] font-medium tracking-wide flex items-center gap-1.5">
                                                                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Ring {ringNum}</span>
                                                                        <div className="w-1 h-1 rounded-full bg-indigo-500/50"></div>
                                                                        {item.name}
                                                                    </div>
                                                                </div>
                                                                {/* Number Badge */}
                                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 border border-indigo-400/40 rounded-full flex items-center justify-center text-indigo-300 text-[10px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20">
                                                                    {STEPS.findIndex(s => s.id === item.categoryId) + 1}
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    )
                                                })
                                            })
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* REVIEW CUSTOM STACK */}
                    {view === 'review-custom' && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl mx-auto py-16 px-6"
                        >
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full font-medium text-sm tracking-wide mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <Check className="w-4 h-4" /> Stack Configured
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">Ready to Build</h2>
                                <p className="text-gray-400">Your custom workspace environment is prepared.</p>
                            </div>

                            {/* Icons Summary Line */}
                            <motion.div
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: {},
                                    show: { transition: { staggerChildren: 0.1 } }
                                }}
                                className="flex flex-wrap justify-center gap-6 mb-12 bg-[#141417]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            >
                                {selectedItemsFlat.map((item, idx) => {
                                    const iconRender = item.isLucide ?
                                        renderLucideIcon(item.iconKey, "w-7 h-7 text-gray-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all") :
                                        (getIcon(item.iconKey)?.image ?
                                            <img src={getIcon(item.iconKey).image} className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" /> :
                                            <span className="font-bold text-muted-foreground text-xl">{item.name[0]}</span>
                                        )

                                    return (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, scale: 0.5 },
                                                show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
                                            }}
                                            key={`${item.categoryId}-${item.id}-${idx}`}
                                            className="text-center flex flex-col items-center group"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-[#0e0e11]/80 backdrop-blur-md border border-white/5 flex items-center justify-center overflow-hidden mb-3 group-hover:border-indigo-500/50 transition-colors shadow-inner group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:-translate-y-1 transform duration-300">
                                                {iconRender}
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase group-hover:text-gray-300 transition-colors">{item.name}</span>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>

                            {/* Command */}
                            <Card className="mb-8 border-white/5 bg-[#141417]/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-xl">
                                <div className="bg-[#1a1a1f]/80 px-5 py-3.5 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-indigo-400" />
                                        <span className="text-sm text-gray-300 font-mono tracking-tight">Initialization Command</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generateCustomCommand()); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-3 transition-colors">
                                        {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}{copied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <div className="bg-[#0a0a0c]/80 p-6 text-emerald-400 font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap">
                                    {generateCustomCommand()}
                                </div>
                            </Card>

                            {/* Project Settings */}
                            <Card className="mb-8 border-white/5 bg-[#141417]/80 backdrop-blur-xl shadow-2xl p-6 rounded-xl">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    Workspace Configuration
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Project Name</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full bg-[#0a0a0c]/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono backdrop-blur-md"
                                            placeholder="my-awesome-app"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Storage Location</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-[#1a1a1f]/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-400 truncate font-mono backdrop-blur-md">
                                                {targetFolder || 'No folder selected'}
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={handlePickFolder}
                                                className="border-white/10 bg-[#1a1a1f]/80 hover:bg-white/5 text-gray-300 h-10 px-4 backdrop-blur-md transition-colors"
                                            >
                                                Browse
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => setView('custom-wizard')} className="border-white/10 bg-zinc-900/50 text-gray-300 hover:bg-white/10 hover:text-white h-11 px-6 backdrop-blur-md transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Review Selections
                                </Button>
                                <Button
                                    onClick={() => startBuild('custom')}
                                    disabled={!targetFolder || !projectName}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 px-8 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Build Custom Workspace <Rocket className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* BUILDING VIEW */}
                    {view === 'building' && (
                        <div className="max-w-3xl mx-auto py-16 px-6 h-full flex flex-col justify-center animate-in fade-in duration-500">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#141417] border-4 border-[#27272a] shadow-[0_0_50px_rgba(79,70,229,0.2)] mb-6 relative">
                                    {buildProgress === 100 ? (
                                        <Check className="w-10 h-10 text-emerald-400 animate-in zoom-in" />
                                    ) : (
                                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                                    )}
                                    {/* Progress Ring Overlay */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(79,70,229,0.2)" strokeWidth="4" />
                                        <circle
                                            cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="4"
                                            strokeDasharray={`${(buildProgress / 100) * 301.59} 301.59`}
                                            className="transition-all duration-500 ease-out"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">Connecting Environment</h2>
                                <p className="text-gray-400">Please do not close this window while we scaffold your project.</p>
                            </div>

                            {/* Terminal Logs */}
                            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                                <div className="bg-[#141417] border-b border-[#27272a] py-3 px-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                    <span className="ml-2 text-xs font-mono text-muted-foreground">{activeFile}</span>
                                </div>
                                <div className="p-6 h-[240px] font-mono text-sm overflow-y-auto">
                                    <div className="space-y-2.5">
                                        {buildLogs.map((log, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="text-gray-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                <span className={i === buildLogs.length - 1 && buildProgress < 100 ? 'text-indigo-300' : 'text-emerald-400/80 break-all'}>{log}</span>
                                            </div>
                                        ))}
                                        {buildProgress < 100 && (
                                            <div className="flex gap-3 mt-2 animate-pulse">
                                                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                                                <span className="text-muted-foreground">...</span>
                                            </div>
                                        )}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                                <div className="border-t border-[#27272a] bg-[#141417] p-4 flex items-center">
                                    <div className="h-1.5 w-full bg-[#0a0a0c] rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${buildProgress}%` }} />
                                    </div>
                                    <span className="ml-4 text-xs font-medium text-gray-400 w-10 text-right">{buildProgress}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS VIEW */}
                    {view === 'success' && (
                        <div className="w-full max-w-5xl mx-auto h-full px-6 flex flex-col justify-center items-center">

                            {/* 1. Tick Mark Popup (Moved Above Text) */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.4 }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 1.6 }}
                                >
                                    <Check className="w-6 h-6" />
                                </motion.div>
                            </motion.div>

                            {/* 2. Typewriter Animation (Moved Below Tick) */}
                            <div className="flex justify-center mb-8">
                                <div className="relative inline-flex items-center">
                                    {/* Invisible text to set natural width and centering */}
                                    <h2 className="text-4xl font-black text-transparent tracking-tight select-none">Project Initialized</h2>

                                    {/* Animated mask revealing the text */}
                                    <motion.div
                                        className="absolute top-0 left-0 h-full overflow-hidden flex items-center"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.0, ease: "linear", delay: 0.2 }}
                                    >
                                        <h2 className="text-4xl font-black text-white tracking-tight whitespace-nowrap">Project Initialized</h2>
                                    </motion.div>

                                    {/* Blinking Cursor riding the text edge */}
                                    <motion.div
                                        className="absolute top-0 h-full flex items-center"
                                        initial={{ left: 0 }}
                                        animate={{ left: "100%" }}
                                        transition={{ duration: 1.0, ease: "linear", delay: 0.2 }}
                                    >
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                            className="text-4xl font-black text-indigo-400"
                                        >
                                            _
                                        </motion.span>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Description Text (Matrix Terminal Style) */}
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 2.0, type: "spring", stiffness: 100, damping: 15 }}
                                className="mb-12 w-full max-w-4xl mx-auto flex justify-center origin-center"
                            >
                                <style>{`
                                    .crt-glitch {
                                        animation: textGlitch 3s infinite;
                                    }
                                    @keyframes textGlitch {
                                        0%, 94%, 98%, 100% { opacity: 1; transform: none; text-shadow: none; filter: none; }
                                        95% { opacity: 0.8; transform: skew(-10deg) translate(-2px, 1px); text-shadow: -2px 0 red, 2px 0 blue; filter: hue-rotate(90deg); }
                                        97% { opacity: 0.9; transform: skew(10deg) translate(2px, -1px); text-shadow: 2px 0 #0f0, -2px 0 #f0f; filter: hue-rotate(-90deg); }
                                    }
                                `}</style>
                                <div className="bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded py-2.5 px-4 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden flex items-center gap-3 w-fit">
                                    {/* Scanline overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none" />

                                    <Terminal className="w-4 h-4 text-emerald-500 shrink-0 opacity-80 crt-glitch" />
                                    <p className="text-emerald-400 text-[13px] font-mono tracking-tight whitespace-nowrap relative z-10 flex items-center crt-glitch">
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 2.6 }}>Your visual components,&nbsp;</motion.span>
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 3.2 }}>backend logic,&nbsp;</motion.span>
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 3.8 }}>and styling engine&nbsp;</motion.span>
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 4.4 }}>have been&nbsp;</motion.span>
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 5.0 }}>successfully interconnected.</motion.span>
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="inline-block w-2 h-3.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] ml-1.5"
                                        />
                                    </p>
                                </div>
                            </motion.div>

                            {/* ENV VAR FORM */}
                            {showEnvForm && (
                                <Card className="mb-8 border-indigo-500/30 bg-indigo-500/5 p-6 rounded-xl text-left max-w-md mx-auto animate-in slide-in-from-top-4">
                                    <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Terminal className="w-4 h-4" /> Finalize Environment
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.keys(envInputs).map(envKey => (
                                            <div key={envKey} className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">{envKey.replace(/_/g, ' ')}</label>
                                                <input
                                                    type="text"
                                                    value={envInputs[envKey]}
                                                    onChange={(e) => setEnvInputs(prev => ({ ...prev, [envKey]: e.target.value }))}
                                                    className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                                                    placeholder={`Enter ${envKey.toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                        <Button
                                            size="sm"
                                            className={`w-full ${envStatus?.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'} hover:opacity-90 text-white mt-2 transition-all`}
                                            onClick={async () => {
                                                if (!projectName) {
                                                    setEnvStatus({ type: 'error', message: 'Project name is required' })
                                                    return
                                                }
                                                try {
                                                    const slash = targetFolder.endsWith('/') || targetFolder.endsWith('\\') ? '' : '/'
                                                    const envPath = `${targetFolder}${slash}${projectName}/.env.local`
                                                    const envContent = Object.entries(envInputs).map(([k, v]) => `${k}=${v}`).join('\n')
                                                    await invoke('write_boilerplate_file', { file_path: envPath, content: envContent })
                                                    setEnvStatus({ type: 'success', message: 'Saved successfully!' })
                                                    setTimeout(() => {
                                                        setShowEnvForm(false)
                                                        setEnvStatus(null)
                                                    }, 1500)
                                                } catch (err) {
                                                    console.error("Failed to save env:", err)
                                                    setEnvStatus({ type: 'error', message: 'Failed to save file' })
                                                }
                                            }}
                                        >
                                            {envStatus ? envStatus.message : 'Save Environment Config'}
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {/* Generated Files Pills */}
                            {generatedFiles.length > 0 && (
                                <div className="mb-10 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                    {generatedFiles.map(f => (
                                        <Badge key={f} variant="outline" className="bg-[#141417] border-[#27272a] text-gray-400 flex items-center gap-1.5 py-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" /> {f}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 5.6 }}
                                className="flex justify-center gap-4 w-full"
                            >
                                <Button variant="outline" onClick={() => { setView('templates'); setBuildLogs([]); setBuildProgress(0); setGeneratedFiles([]); setShowEnvForm(false); }} className="border-white/10 bg-zinc-900/50 text-gray-300 hover:bg-white/10 hover:text-white h-12 px-8 text-base shrink-0 backdrop-blur-md transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Studio
                                </Button>

                                <div className="flex items-center bg-[#141417] border border-[#27272a] rounded-md h-12 p-1 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] w-full max-w-md">
                                    <select
                                        value={preferredIde}
                                        onChange={(e) => setPreferredIde(e.target.value)}
                                        className="bg-transparent text-sm text-gray-300 outline-none border-none px-3 focus:ring-0 cursor-pointer hover:text-white transition-colors w-full"
                                    >
                                        <option value="vscode" className="bg-[#18181b]">VS Code</option>
                                        <option value="cursor" className="bg-[#18181b]">Cursor</option>
                                        <option value="windsurf" className="bg-[#18181b]">Windsurf</option>
                                        <option value="antigravity" className="bg-[#18181b]">Antigravity</option>
                                        <option value="pycharm" className="bg-[#18181b]">PyCharm</option>
                                        <option value="zed" className="bg-[#18181b]">Zed</option>
                                        <option value="explorer" className="bg-[#18181b]">File Explorer</option>
                                        <option value="deped" className="bg-[#18181b]">PEAK (Direct Import)</option>
                                    </select>
                                    <div className="w-px h-6 bg-[#27272a] mx-1 shrink-0" />
                                    <Button
                                        onClick={() => {
                                            const fullPath = targetFolder.endsWith('/') || targetFolder.endsWith('\\')
                                                ? `${targetFolder}${projectName}`
                                                : `${targetFolder}/${projectName}`;

                                            if (preferredIde === 'deped') {
                                                if (onImport) onImport(fullPath);
                                            } else {
                                                invoke('open_in_editor', { path: fullPath, editor: preferredIde })
                                                    .catch(err => console.error("Failed to open IDE:", err))
                                            }
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-full rounded text-sm px-6 whitespace-nowrap shrink-0 transition-transform hover:scale-105"
                                    >
                                        <FolderOpen className="w-4 h-4 mr-2" /> Open Project
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

