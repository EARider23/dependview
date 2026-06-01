import React, { useRef, useMemo, useCallback, useEffect } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RefreshCw, HardDrive, ShieldCheck, Zap, FolderOpen, FolderMinus,
  Search, X, Box, Square, Menu, Trash2, ArrowUpCircle, Package, Play, Plus, ExternalLink, Database as DatabaseIcon,
  ChevronUp, ChevronDown, Download, LayoutGrid, List, ArrowDownAz, SortAsc, SortDesc, Ruler,
  TrendingUp, TrendingDown, Info, Terminal, AlertTriangle, Clock, Share2, Layers, CheckCircle2, Loader2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { PackageCard } from '../components/PackageCard'
import { PackageCardSkeleton } from '../components/PackageCardSkeleton'
import { getTechIcon } from '../assets/iconLinks'
import { useProject } from '../hooks/useProject'
import { isTauri, mockConvertFileSrc } from '../lib/browserMock'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"

// High-performance Lazy Wrapper with Shimmer
const LazyPackageCard = React.memo((props) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' } // Load slightly before it enters viewport
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: props.viewMode === 'list' ? '50px' : '220px' }}>
      {isVisible ? (
        <PackageCard {...props} />
      ) : (
        <PackageCardSkeleton viewMode={props.viewMode} />
      )}
    </div>
  )
})

const ProjectDetailsView = React.memo(({
  currentProject,
  setCurrentProject,
  showToast,
  setViewMode,
  removeProject,
  updateProject,
  AnimatedCounter,
  formatBytes
}) => {
  if (!currentProject) return null

  const [cfs, setCfs] = React.useState(() => mockConvertFileSrc)
  React.useEffect(() => {
    if (isTauri() && cfs === mockConvertFileSrc) {
      import('@tauri-apps/api/core').then(m => setCfs(() => m.convertFileSrc))
    }
  }, [cfs])

  const fileInputRef = useRef(null)
  const [packageView, setPackageView] = React.useState('grid')
  const [isCardFlipped, setIsCardFlipped] = React.useState(false)
  const [sharePreviewUrl, setSharePreviewUrl] = React.useState(null)
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false)
  const [isCopying, setIsCopying] = React.useState(false)
  const {
    scanResult,
    auditResult,
    projectTechnologies,
    projectScripts,
    outdatedCount,
    venvPath,
    isScanning,
    isSilentScanning,
    isLoadingAudit,
    busy,
    availableUpdates,
    packageVersionHistory,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    selectedPackages,
    setSelectedPackages,
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
    handleRevert,
    handleDelete,
    openFolder,
    handleUpdateAll,
    syncProject,
    handleUpdateSelected,
    handleDeleteSelected,
    togglePackage,
    installingPackagesHasPath,
    installingPackages,
    runScript,
    handleAuditFix
  } = useProject(currentProject, showToast)

  // Memoize filtered package groups to avoid expensive filtering on every render
  const corePackages = useMemo(() =>
    filteredPackages.filter(p => p?.is_declared),
    [filteredPackages]
  )

  const subPackages = useMemo(() =>
    filteredPackages.filter(p => !p.is_declared),
    [filteredPackages]
  )

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Image = event.target.result

      let savedPath = null;
      if (isTauri()) {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          savedPath = await invoke('save_project_icon', { projectPath: currentProject.path, base64Data: base64Image })
          console.log('[PEEAK] Icon saved to:', savedPath)
        } catch (err) {
          console.error('[PEEAK] Failed to save icon to disk:', err)
        }
      }

      const updates = { image: base64Image, logo: savedPath || currentProject.logo }
      updateProject(currentProject.path, updates)
      setCurrentProject(prev => ({ ...prev, ...updates }))
      showToast('Project image updated and saved to .peeakthings/', 'success')
    }
    reader.readAsDataURL(file)
  }, [currentProject, updateProject, setCurrentProject, showToast])

  const searchInputRef = useRef(null)
  const shareCardRef = useRef(null)
  const [isUninstallDialogOpen, setIsUninstallDialogOpen] = React.useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = React.useState('');
  const [autoUpdate, setAutoUpdate] = React.useState(() => {
    const saved = localStorage.getItem('autoUpdate_enabled');
    return saved === 'true';
  });
  const [showCore, setShowCore] = React.useState(true);
  const [showSub, setShowSub] = React.useState(false);

  const [displayMetrics, setDisplayMetrics] = React.useState({
    pkgCount: 0,
    outdatedCount: 0,
    pendingCount: 0,
    totalSize: 0,
    criticalCount: 0,
    highCount: 0,
    totalVulns: 0
  });

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [packageToDelete, setPackageToDelete] = React.useState(null);

  // Project card back-face state
  const [projectDescription, setProjectDescription] = React.useState(currentProject?.description || '');
  const [projectProgress, setProjectProgress] = React.useState(currentProject?.progress ?? 0);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareSuccess, setShareSuccess] = React.useState(false);

  // Sync description/progress when project changes
  React.useEffect(() => {
    setProjectDescription(currentProject?.description || '');
    setProjectProgress(currentProject?.progress ?? 0);
  }, [currentProject?.path]);

  const handleDescriptionChange = React.useCallback((val) => {
    setProjectDescription(val);
    updateProject(currentProject.path, { description: val });
  }, [currentProject?.path, updateProject]);

  const handleProgressChange = React.useCallback((val) => {
    setProjectProgress(val);
    updateProject(currentProject.path, { progress: val });
  }, [currentProject?.path, updateProject]);

  // Generate shareable card image via Canvas API, save via Tauri, then reveal folder
  const handleShareCard = React.useCallback(async () => {
    setIsSharing(true);
    try {
      const { getBestIcon } = await import('../assets/iconLinks');

      const techList = (projectTechnologies || []).map(t => {
        const name = t?.name || (typeof t === 'string' ? t : '?');
        const iconData = getBestIcon(name);
        return { name: iconData.name || name, image: iconData.image, color: iconData.color };
      });

      // Pre-load all tech images
      await Promise.all(techList.map(async (tech) => {
        if (tech.image) {
          return new Promise(res => {
            const img = new Image();
            img.onload = () => { tech.imgObj = img; res(); };
            img.onerror = () => { res(); };
            img.src = tech.image;
          });
        }
      }));

      const W = 1080, H = 1350; // 4:5 Portrait Ratio to fit widgets below
      const canvas = document.createElement('canvas');
      canvas.width = W * 2; canvas.height = H * 2; // Retina
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);

      const isDark = document.documentElement.classList.contains('dark');
      const cardBg = isDark ? '#1e293b' : '#ffffff';
      const border = isDark ? '#334155' : '#e2e8f0';
      const textMain = isDark ? '#f1f5f9' : '#0f172a';
      const textMuted = isDark ? '#94a3b8' : '#64748b';
      const progress = projectProgress;

      // --- Background ---
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, isDark ? '#0f172a' : '#f8fafc');
      bgGrad.addColorStop(1, isDark ? '#1e293b' : '#eef2ff');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Decorative subtle blobs
      const blob1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 500);
      blob1.addColorStop(0, 'rgba(99,102,241,0.06)');
      blob1.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = blob1;
      ctx.fillRect(0, 0, W, H);

      // --- Main Card ---
      const cardW = 760;
      const cardH = 800;
      const cardX = (W - cardW) / 2;
      const cardY = 160;
      const cardRadius = 48; // rounded-3xl/4xl sleek

      // Card Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 48;
      ctx.shadowOffsetY = 16;

      // Card Body
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = isDark ? '#334155' : '#e0e7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // Top Right Slanted Tape (Status)
      ctx.save();
      ctx.translate(cardX + cardW - 40, cardY + 20); // Top right corner overlap
      ctx.rotate(25 * Math.PI / 180); // Tilted down-right like the diagram

      const tapeText = progress >= 100 ? 'COMPLETED' : 'IN PROGRESS';
      const tapeColor = progress >= 100 ? '#10b981' : '#f59e0b';

      // Tape background
      const tapeW = 280;
      const tapeH = 64;
      ctx.fillStyle = tapeColor;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.rect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
      ctx.fill();

      // Text inside tape
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tapeText, 0, 0);
      ctx.restore();

      // Inside Card Layout
      const innerPad = 56;
      const innerW = cardW - innerPad * 2;
      let curY = cardY + innerPad;

      // 1. Header: Left Aligned (Avatar + Title + Badge)
      const avatarSize = 100;
      const avatarRadius = 24;
      const avatarX = cardX + innerPad;
      const avatarY = curY;

      if (currentProject.image || currentProject.logo) {
        await new Promise((resolveImg) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const size = 180;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(140, 60, size, size, 40);
            ctx.clip();
            ctx.drawImage(img, 140, 60, size, size);
            ctx.restore();

            // Draw ring around image
            ctx.beginPath();
            ctx.roundRect(140, 60, size, size, 40);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 4;
            ctx.stroke();

            resolveImg();
          };
          img.onerror = resolveImg;
          img.src = currentProject.image || cfs(currentProject.logo);
        });
      } else {
        ctx.fillStyle = isDark ? '#312e81' : '#eff6ff'; // indigo-50
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
        ctx.fill();
        ctx.fillStyle = '#6366f1';
        ctx.font = '900 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((currentProject?.name || 'P')[0].toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 4);
      }

      // Title (Right of avatar)
      const nameX = avatarX + avatarSize + 32;
      const nameY = avatarY + 36;
      ctx.fillStyle = textMain;
      ctx.font = '900 38px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const projName = currentProject?.name || 'Project Name';

      let displayName = projName;
      while (ctx.measureText(displayName).width > innerW - avatarSize - 40 && displayName.length > 5) {
        displayName = displayName.slice(0, -1);
      }
      if (displayName !== projName) displayName += '…';
      ctx.fillText(displayName, nameX, nameY);

      // Project Description (Below title, no box)
      const desc = projectDescription || 'A Default project made with PEAK.';
      ctx.fillStyle = textMuted;
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const words = desc.split(' ');
      let line = '', lines = [], maxW = innerW - avatarSize - 40;
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else { line = test; }
      }
      if (line) lines.push(line);

      let textY = nameY + 32;
      lines.slice(0, 2).forEach((l) => {
        ctx.fillText(l, nameX, textY);
        textY += 28;
      });

      curY += avatarSize + 56;

      // 3. Tech Stack Left Aligned
      ctx.fillStyle = textMuted;
      ctx.font = '900 16px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const techStackText = 'TECH STACK';
      ctx.fillText(techStackText, cardX + innerPad, curY);

      // Count Badge
      const techCount = techList.length;
      ctx.font = '900 14px system-ui, sans-serif';
      const countText = `${techCount}`;
      const countW = ctx.measureText(countText).width + 16;
      const countX = cardX + cardW - innerPad - countW;
      ctx.fillStyle = isDark ? '#334155' : '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(countX, curY - 2, countW, 24, 6);
      ctx.fill();
      ctx.fillStyle = textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(countText, countX + countW / 2, curY + 2);

      curY += 36;

      let tx = cardX + innerPad;
      let ty = curY;

      for (const chip of techList.slice(0, 8)) {
        ctx.font = '700 18px system-ui, sans-serif';
        const textW = ctx.measureText(chip.name).width;
        const imgSize = 24;
        const hasImg = !!chip.imgObj;

        const cw = hasImg ? (16 + imgSize + 12 + textW + 20) : (24 + textW + 24);

        if (tx + cw > cardX + cardW - innerPad) {
          tx = cardX + innerPad;
          ty += 60;
        }

        ctx.fillStyle = isDark ? '#020617' : '#ffffff';
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tx, ty, cw, 48, 24); // fully rounded pills
        ctx.fill();
        ctx.stroke();

        let contentX = tx + (hasImg ? 16 : 24);

        if (hasImg) {
          // Invert white logos on light mode so they are visible against the white chip background
          const needsInvert = !isDark && [
            'next.js', 'nextjs', 'express', 'three.js', 'threejs',
            'socket.io', 'shadcn/ui', 'shadcn-ui', 'vercel', 'github',
            'swr', 'bun'
          ].includes(chip.name.toLowerCase());

          if (needsInvert) {
            ctx.filter = 'invert(1)';
          }
          ctx.drawImage(chip.imgObj, contentX, ty + 12, imgSize, imgSize);
          if (needsInvert) {
            ctx.filter = 'none'; // reset filter
          }

          contentX += imgSize + 12;
        }

        ctx.fillStyle = textMain;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip.name, contentX, ty + 24);

        tx += cw + 16;
      }

      // Move past tech stack
      curY = ty + 48;

      // 4. Completion section — LABEL above, NUMBER below
      // Big Percentage number
      const numberText = `${progress}%`;
      ctx.font = 'italic 900 96px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      ctx.fillText(numberText, cardX + innerPad, cardY + cardH - 20);

      // "COMPLETION" label sits clearly above the number (measure the number height ~96px)
      ctx.fillStyle = textMuted;
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('COMPLETION', cardX + innerPad, cardY + cardH - 118);


      // ═══════════════════════════════════════════
      // OUTSIDE CARD BOTTOM
      // ═══════════════════════════════════════════

      let bottomY = cardY + cardH + 60;

      // "Download the PEEAK Software"
      ctx.fillStyle = textMain;
      ctx.font = '900 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Download the PEEAK Software', W / 2, bottomY);

      bottomY += 70;

      // ── Helper to draw a download badge button ──
      const drawBadge = (bx, by, bw, bh, br, bgFill, borderCol, iconDrawFn, topLabel, bigLabel) => {
        // Background
        ctx.fillStyle = bgFill;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, br);
        ctx.fill();
        ctx.stroke();

        // Draw the icon (caller supplies a function)
        iconDrawFn(bx + 20, by + bh / 2);

        // Top small label
        ctx.fillStyle = bgFill === '#000000' ? '#ffffff' : textMuted;
        ctx.font = '500 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(topLabel, bx + 72, by + bh / 2 - 13);

        // Big label
        ctx.fillStyle = bgFill === '#000000' ? '#ffffff' : textMain;
        ctx.font = '900 22px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(bigLabel, bx + 72, by + bh / 2 + 12);
      };

      const badgeW = 260;
      const badgeH = 72;
      const badgeR = 16;
      const totalBadgesW = badgeW * 2 + 24;
      const bStartX = (W - totalBadgesW) / 2;
      const badgeBg = isDark ? '#1e293b' : '#ffffff';
      const badgeBorder = isDark ? '#334155' : '#e2e8f0';

      // ── Badge 1: Microsoft Store ──
      drawBadge(
        bStartX, bottomY, badgeW, badgeH, badgeR,
        badgeBg, badgeBorder,
        (ix, iy) => {
          // MS Windows flag 4 colored squares
          const s = 14;
          ctx.fillStyle = '#f25022'; ctx.fillRect(ix, iy - s - 2, s, s);
          ctx.fillStyle = '#7fba00'; ctx.fillRect(ix + s + 2, iy - s - 2, s, s);
          ctx.fillStyle = '#00a4ef'; ctx.fillRect(ix, iy + 2, s, s);
          ctx.fillStyle = '#ffb900'; ctx.fillRect(ix + s + 2, iy + 2, s, s);
        },
        'Get it from',
        'Microsoft'
      );

      // ── Badge 2: Website / Download ──
      drawBadge(
        bStartX + badgeW + 24, bottomY, badgeW, badgeH, badgeR,
        badgeBg, badgeBorder,
        (ix, iy) => {
          // Simple globe icon
          const r = 18;
          ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ix + r, iy, r, 0, Math.PI * 2);
          ctx.stroke();
          // latitude lines
          ctx.beginPath();
          ctx.ellipse(ix + r, iy, r * 0.55, r, 0, 0, Math.PI * 2);
          ctx.stroke();
          // horizontal line
          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + r * 2, iy);
          ctx.stroke();
        },
        'Available on',
        'Website'
      );

      bottomY += badgeH + 70;

      // Footer: Below made with (heart) Peeak.
      ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Made with ❤️ PEEAK', W / 2, bottomY);

      // Open the preview modal instead of silently downloading
      const dataUrl = canvas.toDataURL('image/png');
      setSharePreviewUrl(dataUrl);
      setIsShareModalOpen(true);
    } catch (e) {
      console.error('[Share]', e);
      showToast('Could not generate share image', 'error');
    } finally {
      setIsSharing(false);
    }
  }, [currentProject, projectDescription, projectProgress, projectTechnologies, showToast, cfs]);

  const handleSaveToDisk = async () => {
    if (!sharePreviewUrl) return;
    const filename = `${(currentProject?.name || 'project').replace(/[^a-zA-Z0-9-_]/g, '_')}-card.png`;
    try {
      let savedPath = null;
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        savedPath = await invoke('save_share_image', { base64Data: sharePreviewUrl, filename });
        if (savedPath) {
          const dir = savedPath.includes('\\')
            ? savedPath.substring(0, savedPath.lastIndexOf('\\'))
            : savedPath.substring(0, savedPath.lastIndexOf('/'));
          setTimeout(() => invoke('open_folder', { path: dir }), 500);
          showToast(`Saved to Downloads! 🚀 Opening folder…`, 'success');
        }
      }
      if (!savedPath) {
        const link = document.createElement('a');
        link.href = sharePreviewUrl;
        link.download = filename;
        link.click();
        showToast('Image downloaded! 🚀', 'success');
      }
    } catch (e) {
      console.error('[Share Save]', e);
      showToast('Could not save image', 'error');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!sharePreviewUrl) return;
    setIsCopying(true);
    try {
      const res = await fetch(sharePreviewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Copied to clipboard! 🚀 Ready to paste.', 'success');
    } catch (e) {
      console.error('[Share Copy]', e);
      showToast('Failed to copy to clipboard', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDeleteClick = useCallback((pkg) => {
    setPackageToDelete(pkg);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = () => {
    if (packageToDelete) {
      handleDelete(packageToDelete);
      setShowDeleteConfirm(false);
      setPackageToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
    handleDeleteSelected();
  };

  React.useEffect(() => {
    if (!isScanning && scanResult) {
      const timer = setTimeout(() => {
        setDisplayMetrics({
          pkgCount: scanResult?.packages?.length || 0,
          outdatedCount: outdatedCount || 0,
          pendingCount: scanResult?.packages?.filter(p => p.is_declared && !p.is_installed).length || 0,
          totalSize: scanResult?.total_size || 0,
          criticalCount: auditResult?.metadata?.vulnerabilities?.critical || 0,
          highCount: auditResult?.metadata?.vulnerabilities?.high || 0,
          totalVulns: auditResult?.metadata?.vulnerabilities?.total || 0
        });
      }, 600); // 600ms delay for dramatic reveal after overlay exit
      return () => clearTimeout(timer);
    } else if (isScanning) {
      setDisplayMetrics({
        pkgCount: 0,
        outdatedCount: 0,
        pendingCount: 0,
        totalSize: 0,
        criticalCount: 0,
        highCount: 0,
        totalVulns: 0
      });
    }
  }, [isScanning, scanResult, auditResult, outdatedCount]);

  // Automatic Silent Refresh: Keep dependency data fresh every 60 seconds
  React.useEffect(() => {
    if (!currentProject || !autoUpdate) return;

    const interval = setInterval(() => {
      // Only refresh if not already busy to avoid overlapping scans
      if (!busy) {
        console.log('[ProjectDetailsView] Automatic silent refresh triggered');
        scan(currentProject, { silent: true });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentProject, scan, busy, autoUpdate]);

  // Automatic Maintenance Assistant: Handle updates and security fixes
  React.useEffect(() => {
    if (!autoUpdate || busy) return;

    // 1. Auto-Update packages
    if (availableUpdates.size > 0) {
      console.log('[MaintenanceAssistant] Triggering auto-update for', availableUpdates.size, 'packages');
      handleUpdateAll({ silent: true });
      return; // Prioritize updates
    }

    // 2. Auto-Fix security vulnerabilities
    const vulns = auditResult?.metadata?.vulnerabilities || {};
    const totalVulns = (vulns.total || 0) + (vulns.critical || 0) + (vulns.high || 0);
    if (totalVulns > 0) {
      console.log('[MaintenanceAssistant] Triggering auto-security fix for', totalVulns, 'vulnerabilities');
      handleAuditFix();
    }
  }, [autoUpdate, availableUpdates, auditResult, busy, handleUpdateAll, handleAuditFix]);


  const projectType = useMemo(() => {
    const manager = scanResult?.packages?.[0]?.manager;
    if (manager === 'pip') return 'python';
    if (manager === 'composer') return 'php';
    if (manager === 'flutter') return 'flutter';
    if (manager === 'cargo') return 'rust';
    if (manager === 'npm' || manager === 'yarn' || manager === 'pnpm' || manager === 'bun') return 'node';

    // Fallback detection via files
    if (currentProject?.path) {
      const path = currentProject.path.toLowerCase();
      if (path.includes('node_modules') || path.includes('package.json')) return 'node';
    }
    return 'node'; // Default
  }, [scanResult, currentProject]);

  const handleUninstall = useCallback(() => {
    if (confirmDeleteText === `delete - ${currentProject?.name}`) {
      removeProject(currentProject.path);
      setViewMode('dashboard');
      showToast(`${currentProject?.name} uninstalled successfully`, 'success');
      setIsUninstallDialogOpen(false);
      setConfirmDeleteText('');
    }
  }, [confirmDeleteText, currentProject, removeProject, setViewMode, showToast]);

  const vulnsMetadata = auditResult?.metadata?.vulnerabilities || {};
  const totalVulns = vulnsMetadata.total || 0;
  const criticalCount = vulnsMetadata.critical || 0;
  const highCount = vulnsMetadata.high || 0;
  const totalSize = scanResult?.total_size || 0
  const pkgCount = scanResult?.packages?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-muted/80 min-h-screen rounded-3xl mx-2 my-2 border border-border shadow-[inset_0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <div className="p-6 pb-20 max-w-7xl mx-auto">
        {/* Header Area */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setViewMode('dashboard')}
              variant="ghost"
              size="sm"
              className="w-9 h-9 rounded-lg bg-card/60 border border-border shadow-sm p-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center">
                Project <span className="text-purple-600 ml-1">Details</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => scan(currentProject)}
              disabled={busy}
              variant="outline"
              className="h-9 px-3 rounded-lg bg-card shadow-sm font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${busy ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>

        {/* Project Analysis Overlay (Opening Project) */}
        <AnimatePresence>
          {isScanning && !isSilentScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-card/80 backdrop-blur-2xl flex flex-col items-center justify-center"
            >
              <div className="relative">
                <div className="w-32 h-32 mb-8 relative flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.15)] rounded-[2.5rem]">
                  {/* Perfectly Seamless Rotating Border Trail */}
                  <div className="absolute inset-0 rounded-[2.5rem] border-2 border-purple-50 dark:border-transparent overflow-hidden">
                    <motion.div
                      className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0%,#9333ea_20%,transparent_40%)] blur-[2px]"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    {/* Inner Mask to create the border effect */}
                    <div className="absolute inset-[2px] bg-card rounded-[2.4rem] z-0" />
                  </div>

                  <div className="relative z-10 w-20 h-20 bg-card rounded-[1.6rem] shadow-2xl flex items-center justify-center border border-purple-50 dark:border-transparent">
                    <Package className="w-10 h-10 text-purple-600 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-foreground tracking-tighter font-sans">Analyzing Workspace</h3>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] font-mono">Synchronizing dependency state & node_modules</p>
              </div>

              <div className="mt-12 flex gap-3">
                <Badge variant="outline" className="bg-card/50 animate-pulse border-purple-100 dark:border-white/5 text-purple-600 font-bold font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                  Scanning Node Modules
                </Badge>
                <Badge variant="outline" className="bg-card/50 animate-pulse delay-75 border-purple-100 dark:border-white/5 text-purple-600 font-bold font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                  Detecting Changes
                </Badge>
                <Badge variant="outline" className="bg-card/50 animate-pulse delay-150 border-purple-100 dark:border-white/5 text-purple-600 font-bold font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                  Syncing Metrics
                </Badge>
              </div>

              {/* Animated Background Orbs */}
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uninstall Confirmation Modal */}
        <AnimatePresence>
          {isUninstallDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-card rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-red-100"
              >
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-foreground text-center mb-2">Uninstall Project?</h3>
                <p className="text-muted-foreground text-center mb-6 text-sm">
                  This action is irreversible. To proceed, please type <span className="font-bold text-red-600">delete - {currentProject?.name}</span> below.
                </p>

                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder={`delete - ${currentProject?.name}`}
                  className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-red-500 outline-none transition-all font-bold text-sm mb-6 text-center"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold border-border"
                    onClick={() => {
                      setIsUninstallDialogOpen(false);
                      setConfirmDeleteText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className={`flex-1 h-12 rounded-xl font-bold ${confirmDeleteText !== `delete - ${currentProject?.name}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={confirmDeleteText !== `delete - ${currentProject?.name}`}
                    onClick={handleUninstall}
                  >
                    Uninstall
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Bento Grid Design (As per Screenshot) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-8 items-stretch">
          {/* Left Tall Card: Project Branding (3D Flip Card) */}
          <div className="xl:col-span-4 xl:row-span-3 relative perspective-[2000px] min-h-[400px] z-20">
            <motion.div
              initial={false}
              animate={{ rotateY: isCardFlipped ? 180 : 0 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 200, damping: 20 }}
              className="w-full h-full relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* === FRONT FACE === */}
              <motion.div
                whileHover="hover"
                className={`absolute inset-0 bg-card rounded-[2.5rem] p-8 border border-indigo-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center group overflow-hidden ${isCardFlipped ? 'pointer-events-none' : ''}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Background Decor - Subtle & Professional */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute inset-0 bg-card" />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-50 dark:from-slate-800/50" />

                  {/* Very Mild Hover Glow */}
                  <motion.div
                    variants={{
                      hover: {
                        opacity: 1,
                        scale: 1.1
                      }
                    }}
                    className="absolute -inset-20 bg-gradient-to-tr from-indigo-50/20 via-transparent to-indigo-50/20 opacity-0 blur-3xl transition-opacity duration-1000 dark:from-indigo-500/10 dark:to-indigo-500/10"
                  />
                </div>

                {/* Flip to Back Button */}
                <div className="absolute top-6 left-6 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCardFlipped(true)}
                    className="w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 border border-border shadow-sm transition-all"
                    title="View Project Details"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute top-6 right-6 flex gap-2 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remove from Dashboard (List Only)"
                    onClick={() => {
                      if (window.confirm('Remove this project from the dashboard list? (Physical files will not be deleted)')) {
                        removeProject(currentProject.path);
                        setViewMode('dashboard');
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-border shadow-sm transition-all"
                  >
                    <FolderMinus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Uninstall Project (Delete Files)"
                    onClick={() => setIsUninstallDialogOpen(true)}
                    className="w-9 h-9 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-red-50 text-slate-400 hover:text-red-500 border border-border shadow-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="relative z-10 flex flex-col items-center w-full mt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <motion.div
                    variants={{ hover: { y: -5, scale: 1.05 } }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-[2rem] bg-card shadow-xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-slate-700 transition-all duration-700 ease-out ring-1 ring-indigo-50/30 dark:ring-white/5 overflow-hidden cursor-pointer group/icon"
                  >
                    {currentProject?.image || currentProject?.logo ? (
                      <div className="relative w-full h-full group/img">
                        <img src={currentProject.image || cfs(currentProject.logo)} className="w-full h-full object-cover" alt={currentProject?.name} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProject(currentProject.path, { image: null, logo: null });
                            setCurrentProject({ ...currentProject, image: null, logo: null });
                            showToast('Project image removed', 'info');
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                          title="Remove Image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 text-indigo-500 group-hover/icon:scale-110 transition-transform">
                        <FolderOpen className="w-full h-full" />
                      </div>
                    )}
                  </motion.div>

                  <h3 className="text-2xl font-black text-foreground mb-4 tracking-tighter text-center truncate w-full px-4 drop-shadow-sm">{currentProject?.name}</h3>

                  {/* Tech Stack Dock (Mac-style Zoom) */}
                  <div className="flex -space-x-2 items-center justify-center h-16 px-4">
                    {(projectTechnologies || []).slice(0, 6).map((tech, i) => {
                      const techName = tech?.name || (typeof tech === 'string' ? tech : 'Unknown');
                      const iconData = tech?.image ? tech : getTechIcon(techName);

                      return (
                        <div key={`${techName}-${i}`} className="relative group/tech">
                          {/* Floating Label */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tech:opacity-100 group-hover/tech:-top-12 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl">
                            {techName}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>

                          <motion.div
                            whileHover={{
                              scale: 1.3,
                              y: -8,
                              marginInline: "0.5rem",
                              zIndex: 40
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={`w-10 h-10 rounded-full ${techName.toLowerCase().includes('next') ? 'bg-slate-900' : 'bg-card'} border-2 border-indigo-50 dark:border-white/10 shadow-lg flex items-center justify-center overflow-hidden relative cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 transition-shadow`}
                            style={{ zIndex: 20 - i }}
                          >
                            {iconData?.image ? (
                              <img src={iconData.image} className={`w-6 h-6 object-contain ${techName.toLowerCase().includes('next') ? 'brightness-200' : ''} ${techName.toLowerCase().includes('express') ? 'dark:invert opacity-90' : ''}`} alt={techName} />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase">
                                  {techName[0] || '?'}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Decorative background accent */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700" />
              </motion.div>

              {/* === BACK FACE === */}
              <div
                ref={shareCardRef}
                className={`absolute inset-0 bg-card rounded-[2.5rem] p-5 border border-indigo-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden ${!isCardFlipped ? 'pointer-events-none' : ''}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {/* Flip back to Front Button */}
                <div className="absolute top-5 right-5 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCardFlipped(false)}
                    className="w-8 h-8 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 border border-border shadow-sm transition-all"
                    title="Flip back to front"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* ── Project Header (Image + Name + Status Badge) ── */}
                <div className="flex items-center gap-3 mt-4 mb-3 pr-10">
                  {/* Small project avatar */}
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {currentProject?.image || currentProject?.logo ? (
                      <img src={currentProject.image || cfs(currentProject.logo)} className="w-full h-full object-cover" alt={currentProject?.name} />
                    ) : (
                      <span className="text-sm font-black text-indigo-500">{(currentProject?.name || 'P')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-foreground truncate leading-tight">{currentProject?.name}</h4>
                    <div className="mt-1">
                      {projectProgress >= 100 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                        </span>
                      ) : projectProgress > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <Loader2 className="w-2.5 h-2.5" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3.5">

                  {/* === Description === */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Project Description</label>
                    <textarea
                      rows={2}
                      maxLength={140}
                      placeholder="Short description of your app or software idea…"
                      value={projectDescription}
                      onChange={e => handleDescriptionChange(e.target.value)}
                      className="w-full text-[11px] text-foreground placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all font-medium leading-relaxed"
                    />
                    <div className="text-right text-[8px] text-slate-400 mt-0.5">{projectDescription.length}/140</div>
                  </div>

                  {/* === Tech Stack Used === */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tech Stack</span>
                      <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-black">{projectTechnologies?.length || 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(projectTechnologies || []).map((tech, i) => {
                        const techName = tech?.name || (typeof tech === 'string' ? tech : 'Unknown');
                        const iconData = tech?.image ? tech : getTechIcon(techName);
                        return (
                          <div key={i} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                            {iconData?.image && (
                              <img
                                src={iconData.image}
                                className={`w-3 h-3 object-contain flex-shrink-0 ${techName.toLowerCase().includes('next') ? 'dark:brightness-200' : ''
                                  } ${techName.toLowerCase().includes('express') ? 'dark:invert opacity-90' : ''}`}
                                alt={techName}
                              />
                            )}
                            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-bold">{techName}</span>
                          </div>
                        );
                      })}
                      {(!projectTechnologies || projectTechnologies.length === 0) && (
                        <span className="text-[10px] text-slate-400 italic">No stack detected yet</span>
                      )}
                    </div>
                  </div>

                  {/* === Share Progress Slider === */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/40">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Share Progress</span>
                      <span className={`text-lg font-black leading-none tabular-nums ${projectProgress >= 100 ? 'text-emerald-500' : 'text-indigo-500'
                        }`}>{projectProgress}%</span>
                    </div>

                    {/* Hint label */}
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-3 leading-relaxed">
                      ✦ Set manually — shown on your share card for followers.
                      <span className="italic"> Not auto-tracked.</span>
                    </p>

                    {/* Single range input */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={projectProgress}
                      onChange={e => handleProgressChange(Number(e.target.value))}
                      className="w-full cursor-pointer block"
                      style={{
                        accentColor: projectProgress >= 100 ? '#10b981' : '#6366f1',
                        height: '16px',
                        margin: 0,
                      }}
                    />

                    {/* Milestone markers */}
                    <div className="flex justify-between mt-1.5">
                      {[0, 25, 50, 75, 100].map(m => (
                        <span
                          key={m}
                          className={`text-[8px] font-black ${projectProgress >= m ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                        >{m}%</span>
                      ))}
                    </div>
                  </div>


                </div>

                {/* ── Share Button (pinned to bottom) ── */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShareCard}
                  disabled={isSharing}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${shareSuccess
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isSharing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  ) : shareSuccess ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Saved! Share it 🚀</>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5" /> Share Project Card</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Row 1 Metric Cards */}
          <div className="xl:col-span-2 bg-card rounded-[2rem] p-5 border border-border shadow-sm flex flex-col justify-between group overflow-hidden hover:border-indigo-200 transition-all relative border-l-[2px] border-l-indigo-500/30 hover:border-l-indigo-500">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white"
                >
                  <Box className="w-5 h-5" />
                </motion.div>
                {displayMetrics.pendingCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-lg">
                    {displayMetrics.pendingCount} Pending
                  </Badge>
                )}
              </div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Packages</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">
                <AnimatedCounter value={displayMetrics.pkgCount} />
              </span>
            </div>
          </div>

          <div className="xl:col-span-2 bg-card rounded-[2rem] p-5 border border-border shadow-sm flex flex-col justify-between group overflow-hidden hover:border-blue-200 transition-all relative border-l-[2px] border-l-blue-500/30 hover:border-l-blue-500">
            <div className="space-y-1.5">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Updates</span>
            </div>
            <div className="mt-2">
              <span className={`text-3xl font-black tracking-tighter leading-none ${displayMetrics.outdatedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                <AnimatedCounter value={displayMetrics.outdatedCount} />
              </span>
            </div>
          </div>

          <div className="xl:col-span-4 bg-card rounded-[2rem] p-5 border border-border shadow-sm flex flex-col justify-between group relative overflow-hidden hover:border-red-200 transition-all">
            <div className="absolute top-5 right-5">
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-400 border border-border transition-colors group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600"
              >
                <ShieldCheck className="w-5 h-5" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Security Analysis</span>
              <div className="flex flex-col">
                {isLoadingAudit ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-xl font-black text-slate-400 animate-pulse uppercase tracking-widest">Auditing...</span>
                  </div>
                ) : (
                  <>
                    <span className={`text-3xl font-black tracking-tighter leading-none ${displayMetrics.totalVulns > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {displayMetrics.totalVulns > 0 ? `${displayMetrics.totalVulns} Vulnerabilities` : 'Project Secure'}
                    </span>
                    <div className="flex gap-2 mt-3">
                      {displayMetrics.criticalCount > 0 && (
                        <Badge className="bg-rose-950 text-white border-0 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                          Critical: {displayMetrics.criticalCount}
                        </Badge>
                      )}
                      {displayMetrics.highCount > 0 && (
                        <Badge className="bg-red-600 text-white border-0 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                          High: {displayMetrics.highCount}
                        </Badge>
                      )}
                      {displayMetrics.totalVulns === 0 && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
                          Verified Clean
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2 Metric Cards */}
          <div className="xl:col-span-2 bg-card rounded-[2rem] p-5 border border-border shadow-sm flex flex-col justify-between group overflow-hidden hover:border-slate-300 transition-all relative border-l-[2px] border-l-slate-300/50 hover:border-l-slate-800">
            <div className="space-y-1.5">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-600 border border-border transition-colors group-hover:bg-slate-900 group-hover:text-white"
              >
                <HardDrive className="w-5 h-5" />
              </motion.div>
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-widest block">Disk Usage</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
                <AnimatedCounter value={displayMetrics.totalSize} formatter={formatBytes} />
              </span>
            </div>
          </div>

          <div className="xl:col-span-6 bg-indigo-50/60 rounded-[2rem] p-5 border border-indigo-100 shadow-[inset_0_2px_8px_rgba(99,102,241,0.08)] flex flex-col justify-between group hover:bg-indigo-50 transition-all h-[150px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-black uppercase text-[9px] tracking-widest">
                  {projectType === 'python' ? 'Environment Root' : projectType === 'node' ? 'Node Modules' : 'Local Environment'}
                </span>
                {(venvPath || (scanResult?.packages?.some(p => p.is_installed && p.path?.includes(currentProject?.path)) ?? false)) ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-black text-[9px] rounded-lg px-2.5 py-1 shadow-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all cursor-default">Isolated</Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-600 border border-amber-200 font-black text-[9px] rounded-lg px-2.5 py-1 shadow-sm uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all cursor-default">Not Isolated</Badge>
                )}
              </div>
              <div className="flex flex-col items-end">
                {(venvPath || (scanResult?.packages?.some(p => p.is_installed && p.path?.includes(currentProject?.path)) ?? false)) ? (
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active shielding</span>
                ) : (
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Shielding Disabled</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 p-2 bg-card rounded-2xl border border-indigo-100 shadow-sm mb-2">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -15 }}
                onClick={() => openFolder(currentProject?.path)}
                className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <FolderOpen className="w-4 h-4" />
              </motion.div>
              <span className="text-xs font-mono font-medium text-slate-600 truncate flex-1 tracking-tight">{currentProject?.path}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openFolder(currentProject?.path)}
                className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {!(venvPath || (scanResult?.packages?.some(p => p.is_installed && p.path?.includes(currentProject?.path)) ?? false)) && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                  {projectType === 'python' ? 'Relying on shared environment. Migration recommended.' : 'Dependencies not isolated. Migration recommended.'}
                </span>
                <Button
                  size="sm"
                  onClick={syncProject}
                  className="h-7 px-3 rounded-lg bg-slate-900 text-white hover:bg-indigo-600 text-[8px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  Migrate to Isolated
                </Button>
              </div>
            )}
          </div>

          {/* Row 3: Scripts (Now under Env Path) */}
          <div className="xl:col-span-8 bg-card rounded-[2rem] p-5 border border-border shadow-sm group hover:border-indigo-100 transition-all h-[140px] flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg"
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-foreground font-black uppercase text-[10px] tracking-[0.1em]">Project Scripts</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto pt-2 pb-4 px-2 custom-scrollbar flex-1 min-h-[60px]">
              {busy && (!projectScripts || Object.keys(projectScripts).length === 0) ? (
                <div className="w-full flex items-center justify-center h-full py-4">
                  <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin opacity-50" />
                </div>
              ) : projectScripts && Object.keys(projectScripts).length > 0 ? (
                Object.keys(projectScripts).map((script, idx) => (
                  <motion.div
                    key={script}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => runScript(script)}
                      className="h-8 px-3 rounded-xl border-border bg-muted/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 font-black text-[9px] uppercase tracking-widest transition-all group/btn flex items-center gap-2 shadow-sm"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-card group-hover/btn:bg-indigo-500 transition-colors flex items-center justify-center shadow-sm">
                        <Play className="w-2 h-2 text-indigo-600 group-hover/btn:text-white fill-current" />
                      </div>
                      {script}
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="w-full flex items-center justify-center h-full py-4">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">No scripts detected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Storage Insights: Stealth Monochrome Section */}
        <div className="mb-14 mt-6 rounded-[2.5rem] p-10 border border-black/20 relative overflow-hidden">
          {/* Subtle Scanline Effect Overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

          <div className="relative z-10">
            {/* Tactical Header: Unified Center Text with Thermal Indicators */}
            <div className="flex items-center justify-between mb-12 relative px-2">
              <motion.div
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] leading-none">High Usage</span>
                </div>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.15em] pl-3.5">Max Storage</span>
              </motion.div>

              <div className="flex-1 mx-16 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-black/20" />
                </div>
                <div className="relative z-20 bg-card px-10 py-3 border border-black/20 rounded-full shadow-sm">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] flex items-center gap-3">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    Storage Consumed Package
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-end gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] leading-none">Low Usage</span>
                  <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.15em] pr-3.5">Min Storage</span>
              </motion.div>
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15,
                    delayChildren: 0.8
                  }
                }
              }}
              initial="hidden"
              animate={(!isScanning && scanResult) ? "show" : "hidden"}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
            >
              {topPackages && topPackages.length > 0 ? (
                topPackages.map((pkg, idx) => {
                  // Smart Brand Detection using iconLinks.js
                  const pkgLower = pkg.name.toLowerCase();
                  let techKey = pkgLower;

                  if (pkgLower.includes('firebase')) techKey = 'firebase';
                  else if (pkgLower.includes('three')) techKey = 'three';

                  const tech = getTechIcon(techKey);
                  const displayIcon = tech.image;

                  return (
                    <motion.div
                      key={pkg.name}
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.9 },
                        show: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }
                        }
                      }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="relative group"
                    >
                      {/* Tactical Data Card: Stealth Outline Style */}
                      <div className="bg-transparent rounded-[2rem] p-6 border border-black/10 group-hover:border-black/20 group-hover:bg-muted transition-all duration-500 h-[230px] flex flex-col justify-between relative overflow-hidden">
                        {/* Background Index Number */}
                        <div className="absolute top-4 right-6 text-[45px] font-black text-slate-400 group-hover:text-foreground transition-all duration-700 leading-none select-none italic tracking-tighter">
                          0{idx + 1}
                        </div>

                        <div className="relative z-10">
                          {/* Icon Container: Monochrome */}
                          <div className="w-12 h-12 rounded-xl bg-muted border border-black/5 flex items-center justify-center text-2xl mb-6 group-hover:bg-card group-hover:scale-110 group-hover:border-black/10 transition-all overflow-hidden relative">
                            {displayIcon ? (
                              <img
                                src={displayIcon}
                                alt={pkg.name}
                                className="w-7 h-7 object-contain relative z-10 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 transition-all"
                              />
                            ) : (
                              <Box className="w-5 h-5 text-slate-400 relative z-10" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <h4 className="text-[14px] font-black text-muted-foreground truncate tracking-tight group-hover:text-black transition-colors">
                              {pkg.name}
                            </h4>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-baseline gap-1.5 mb-5">
                            <span className="text-3xl font-bold font-mono text-black tracking-tighter tabular-nums leading-none">
                              {formatBytes(pkg.size).split(' ')[0]}
                            </span>
                            <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest leading-none">
                              {formatBytes(pkg.size).split(' ')[1]}
                            </span>
                          </div>

                          {/* Metric Visualizer */}
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center px-0.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                                {idx === 0 ? 'TOP' : 'NORMAL'}
                              </span>
                              <span className="text-[10px] font-bold font-mono text-black/40 tabular-nums">
                                {Math.round((pkg.size / topPackages[0].size) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-[1px]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(pkg.size / topPackages[0].size) * 100}%` }}
                                transition={{ duration: 1.5, delay: idx * 0.1 + 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full rounded-full ${idx === 0 ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.1)]' : 'bg-slate-400 group-hover:bg-slate-500'} transition-all`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-5 py-24 flex flex-col items-center justify-center bg-[#121212] rounded-[2.5rem] border border-dashed border-white/5">
                  <HardDrive className="w-10 h-10 text-foreground mb-4" />
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">Standby: Initializing Data</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>



        {/* --- PHASE 2: PROFESSIONAL QUICK INSTALL & UPDATE SUITE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* Quick Install Panel */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-[2rem] border border-border shadow-sm flex flex-col h-full overflow-hidden border-l-[2px] border-l-indigo-600"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-foreground tracking-tight font-sans">Quick Install</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] font-sans">1 - click install </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1 group/input">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                      <Input
                        placeholder="Search packages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-11 h-10 bg-muted border-border rounded-xl text-[13px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleSearch}
                        disabled={busy || !searchQuery}
                        className="h-10 px-5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                      </Button>
                    </motion.div>
                    {searchResults && searchResults.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchResults([])}
                        className="h-10 px-4 border-border bg-card text-muted-foreground hover:bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 bg-card flex-1">
                <div className="space-y-2 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
                  {searchResults && searchResults.length > 0 ? (
                    searchResults.map((result) => {
                      const name = result.package?.name || result.name;
                      const version = result.package?.version || result.version;
                      const description = result.package?.description || result.description;

                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between p-3 bg-muted hover:bg-card hover:border-indigo-100 rounded-2xl border border-transparent transition-all group shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm shrink-0">
                              <img
                                src={`https://img.icons8.com/color/48/000000/npm.png`}
                                className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all"
                              />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[13px] font-bold text-foreground truncate leading-tight">
                                {name}
                              </span>
                              {description && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[300px] font-medium leading-none mt-0.5">
                                  {description}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">
                                  v{version}
                                </span>
                                {name?.includes('/') && (
                                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0 rounded-md">Verified Registry Match</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {installingPackages.has(name) ? (
                            <div className="flex flex-col items-end gap-2 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <motion.div
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-1 h-1 bg-indigo-600 rounded-full"
                                  />
                                  <motion.div
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                    className="w-1 h-1 bg-indigo-600 rounded-full"
                                  />
                                  <motion.div
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                    className="w-1 h-1 bg-indigo-600 rounded-full"
                                  />
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tight">Deploying...</span>
                                  {installingPackages.get(name)?.lastLog && (
                                    <span className="text-[7px] font-bold text-slate-400 truncate max-w-[150px] text-right uppercase tracking-tighter">
                                      {installingPackages.get(name).lastLog}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden border border-indigo-100 p-[0.5px]">
                                <motion.div
                                  initial={{ width: "5%" }}
                                  animate={{ width: `${installingPackages.get(name)?.progress || 5}%` }}
                                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                                />
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleInstall(name, version)}
                              className="h-9 w-9 p-0 rounded-xl bg-card border border-border hover:bg-slate-900 text-muted-foreground hover:text-white transition-all shadow-sm group-hover:scale-110 active:scale-95 group-hover:shadow-indigo-100"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-2xl py-8 opacity-80 bg-slate-100/50">
                      <Box className="w-5 h-5 text-slate-300 mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Input</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Update Center Panel */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-[2rem] border border-border shadow-sm flex flex-col h-full overflow-hidden border-r-2 border-r-rose-600"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-foreground tracking-tight font-sans">Update Packages</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] font-sans">Monitor & Update</p>
                      {autoUpdate && busy && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="flex items-center gap-1"
                        >
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Maintenance Active</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-black font-mono px-2.5 py-1 text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-rose-600 hover:text-white transition-all cursor-default">
                  {outdatedCount} Updates
                </Badge>
              </div>

              {/* Content Section */}
              <div className="p-6 bg-card flex-1 flex items-center justify-center">
                <div className="flex flex-col gap-4 w-full">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        const nextValue = !autoUpdate;
                        setAutoUpdate(nextValue);
                        localStorage.setItem('autoUpdate_enabled', nextValue.toString());
                      }}
                      className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between hover:bg-card hover:border-rose-200 transition-all shadow-sm cursor-pointer group/toggle"
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-700 group-hover/toggle:text-rose-600 transition-colors">Auto Update</span>
                        {/* <span className="text-[8px] font-bold text-slate-400 uppercase">Check</span> */}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const nextValue = !autoUpdate;
                          setAutoUpdate(nextValue);
                          localStorage.setItem('autoUpdate_enabled', nextValue.toString());
                        }}
                        className={`w-10 h-6 rounded-full p-1 transition-all duration-300 relative ${autoUpdate ? 'bg-rose-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-card transition-all duration-300 shadow-sm transform ${autoUpdate ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <Button
                      variant="default"
                      className="h-full min-h-[56px] rounded-2xl bg-card border border-rose-100 text-rose-600 font-black text-[11px] uppercase tracking-[0.15em] hover:bg-rose-600 hover:text-white transition-all flex flex-col gap-0.5 shadow-sm active:scale-95 group/scan"
                      onClick={() => scan(currentProject, { silent: true })}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 group-hover/scan:rotate-180 transition-transform duration-500 ${busy ? 'animate-spin' : ''}`} />
                      <span>Check for Update</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- PHASE 2: CATEGORIZED DEPENDENCY BARS --- */}
        <div className="space-y-4 mb-10">
          {/* Dependency Controls Hub */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Filter dependencies..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-10 pl-9 bg-muted border-border rounded-xl text-[12px] font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortBy('name')}
                  className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${sortBy === 'name' ? 'bg-card text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <ArrowDownAz className="w-3.5 h-3.5" />
                  Name
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortBy('size')}
                  className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${sortBy === 'size' ? 'bg-card text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Update All Button */}
              {outdatedCount > 0 && (
                <Button
                  onClick={handleUpdateAll}
                  disabled={busy}
                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                  Update All
                </Button>
              )}

              {/* Selected Actions */}
              <AnimatePresence>
                {selectedPackages.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const packagesToUpdate = Array.from(selectedPackages).map(path =>
                          filteredPackages.find(p => p.path === path)
                        ).filter(Boolean);
                        handleUpdateSelected(packagesToUpdate);
                      }}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Update Selected ({selectedPackages.size})
                    </Button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPackageView('grid')}
                  className={`w-8 h-8 rounded-lg transition-all ${packageView === 'grid' ? 'bg-card text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPackageView('list')}
                  className={`w-8 h-8 rounded-lg transition-all ${packageView === 'list' ? 'bg-card text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Core Dependencies Bar */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-visible mt-6"
          >
            <div
              onClick={() => setShowCore(!showCore)}
              className="w-full p-4 flex items-center justify-between bg-card border-2 border-indigo-500 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group/bar cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover/bar:bg-indigo-600 group-hover/bar:text-white transition-colors">
                  <Box className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-[13px] font-black tracking-tight uppercase text-foreground font-sans">Core Stack</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 font-sans">Primary Logic Engines</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold font-mono tracking-tighter text-slate-400 bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {scanResult?.packages?.filter(p => p.is_declared).length || 0} MODULES
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    scan(currentProject, { silent: true });
                  }}
                  disabled={busy}
                  className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                </Button>
                {showCore ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            <div className={`p-4 pt-3 mt-4 ${!showCore ? 'hidden' : ''} relative`}>
              <AnimatePresence>
                {isSilentScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-card/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"
                  >
                    <div className="flex flex-col items-center gap-3 bg-card p-4 rounded-2xl shadow-xl border border-indigo-50">
                      <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Syncing...</span>
                        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-400">Updating Stack View</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={packageView === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-3"
              }>
                {corePackages.map(pkg => (
                  <LazyPackageCard
                    key={pkg.path}
                    pkg={pkg}
                    viewMode={packageView}
                    venvPath={venvPath}
                    onUpdate={handleUpdate}
                    onDelete={handleDeleteClick}
                    onRevert={handleRevert}
                    onToggle={togglePackage}
                    selected={selectedPackages.has(pkg.path)}
                    hasUpdate={availableUpdates.has(pkg.name)}
                    latestVersion={availableUpdates.get(pkg.name)}
                    versionHistory={packageVersionHistory.get(pkg.name) || []}
                    isInstalling={installingPackages.get(pkg.name) !== undefined}
                    installProgress={installingPackages.get(pkg.name)?.progress}
                    installType={installingPackages.get(pkg.name)?.type}
                    lastLog={installingPackages.get(pkg.name)?.lastLog}
                    throughput={installingPackages.get(pkg.name)?.throughput}
                    openFolder={openFolder}
                    formatBytes={formatBytes}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sub Dependencies Bar */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-visible mt-6"
          >
            <div
              onClick={() => setShowSub(!showSub)}
              className="w-full p-4 flex items-center justify-between bg-card border-2 border-slate-500 rounded-2xl shadow-sm hover:border-border transition-all group/bar cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-600 border border-border group-hover/bar:bg-slate-900 group-hover/bar:text-white transition-colors">
                  <Menu className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-[13px] font-black tracking-tight uppercase text-foreground font-sans">Dependency Tree</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 font-sans">Auxiliary System Assets</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold font-mono tracking-tighter text-slate-400 bg-muted px-2.5 py-1 rounded-lg border border-border">
                  {subPackages.length} MODULES
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    scan(currentProject, { silent: true });
                  }}
                  disabled={busy}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-slate-400 hover:text-foreground transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                </Button>
                {showSub ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            <div className={`p-4 pt-5 pb-4 ${!showSub ? 'hidden' : ''} relative`}>
              <AnimatePresence>
                {isSilentScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-card/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"
                  >
                    <div className="flex flex-col items-center gap-3 bg-card p-4 rounded-2xl shadow-xl border border-slate-50">
                      <div className="w-8 h-8 border-3 border-border border-t-slate-900 rounded-full animate-spin" />
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Syncing Tree</span>
                        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-400">Updating Dependencies</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={packageView === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-3"
              }>
                {subPackages.map(pkg => (
                  <LazyPackageCard
                    key={pkg.path}
                    pkg={pkg}
                    viewMode={packageView}
                    venvPath={venvPath}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onRevert={handleRevert}
                    onToggle={togglePackage}
                    selected={selectedPackages.has(pkg.path)}
                    hasUpdate={availableUpdates.has(pkg.name)}
                    latestVersion={availableUpdates.get(pkg.name)}
                    versionHistory={packageVersionHistory.get(pkg.name) || []}
                    isInstalling={installingPackages.get(pkg.name) !== undefined}
                    installProgress={installingPackages.get(pkg.name)?.progress}
                    installType={installingPackages.get(pkg.name)?.type}
                    lastLog={installingPackages.get(pkg.name)?.lastLog}
                    throughput={installingPackages.get(pkg.name)?.throughput}
                    openFolder={openFolder}
                    formatBytes={formatBytes}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Custom Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px] border-rose-100 shadow-2xl shadow-rose-500/10 rounded-[2rem] p-0 overflow-hidden">
          <div className="bg-rose-50/50 p-8 border-b border-rose-100 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-card border-2 border-rose-200 flex items-center justify-center shadow-sm shadow-rose-200/50">
              <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-[18px] font-black uppercase tracking-tight text-black">Confirm Bulk Action</DialogTitle>
              <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Security Clearance Required</DialogDescription>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-[14px] text-slate-600 font-medium leading-relaxed text-center">
              You are about to uninstall <span className="font-black text-rose-600 px-2 py-0.5 bg-rose-50 rounded-md">{selectedPackages.size} packages</span> from your project. This action is destructive and cannot be undone.
            </p>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
              >
                Abort Action
              </Button>
              <Button
                onClick={confirmBulkDelete}
                className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px] border-rose-100 shadow-2xl shadow-rose-500/10 rounded-[2rem] p-0 overflow-hidden">
          <div className="bg-rose-50/50 p-8 border-b border-rose-100 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-card border-2 border-rose-200 flex items-center justify-center shadow-sm shadow-rose-200/50">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-[18px] font-black uppercase tracking-tight text-black">Uninstall Package</DialogTitle>
              <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Security Clearance Required</DialogDescription>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-[14px] text-slate-600 font-medium leading-relaxed text-center">
              Are you sure you want to uninstall <span className="font-black text-rose-600 px-2 py-0.5 bg-rose-50 rounded-md">{packageToDelete?.name}</span>?
              <br />
              <span className="text-[10px] text-slate-400 mt-2 block font-bold uppercase tracking-wider">This action will remove the package from your local system.</span>
            </p>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                Proceed
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Preview Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="w-[540px] max-w-[540px] bg-card border-border p-5 rounded-[2rem] gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Share Project</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Preview your project card. Save or copy to share on socials.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center" style={{ maxHeight: '52vh' }}>
            {sharePreviewUrl ? (
              <img src={sharePreviewUrl} alt="Share Preview" className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
            ) : (
              <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-4">
            <div className="flex w-full sm:w-auto gap-2">
              <Button
                variant="outline"
                className="rounded-xl flex-1 sm:flex-none border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => {
                  const text = encodeURIComponent(`Check out my new project built with DepED Package Analyzer! 🚀\n\n#buildinpublic #developer #coding`);
                  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                }}
              >
                Share on X
              </Button>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Button variant="outline" className="rounded-xl flex-1 sm:flex-none" onClick={handleSaveToDisk}>
                <Download className="w-4 h-4 mr-2" /> Save to Disk
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex-1 sm:flex-none"
                onClick={handleCopyToClipboard}
                disabled={isCopying}
              >
                {isCopying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                {isCopying ? 'Copying...' : 'Copy Image'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  )
})

export default ProjectDetailsView
