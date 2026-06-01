import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProjectDetailsView from './ProjectDetailsView'

// Mock useProject hook
vi.mock('../hooks/useProject', () => ({
  useProject: () => ({
    scanResult: { packages: [], total_size: 1000 },
    auditResult: null,
    projectTechnologies: [{ name: 'React' }],
    projectScripts: [],
    outdatedCount: 0,
    isScanning: false,
    isSilentScanning: false,
    isLoadingAudit: false,
    busy: false,
    availableUpdates: new Set(),
    packageVersionHistory: new Map(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: [],
    setSearchResults: vi.fn(),
    selectedPackages: new Set(),
    setSelectedPackages: vi.fn(),
    filter: 'all',
    setFilter: vi.fn(),
    sortBy: 'name',
    setSortBy: vi.fn(),
    topPackages: [],
    filteredPackages: [],
    scan: vi.fn(),
    handleSearch: vi.fn(),
    handleInstall: vi.fn(),
    handleUpdate: vi.fn(),
    handleRevert: vi.fn(),
    handleDelete: vi.fn(),
    openFolder: vi.fn(),
    handleUpdateAll: vi.fn(),
    syncProject: vi.fn(),
    handleUpdateSelected: vi.fn(),
    handleDeleteSelected: vi.fn(),
    togglePackage: vi.fn(),
    installingPackagesHasPath: vi.fn(),
    installingPackages: new Map(),
    runScript: vi.fn(),
    handleAuditFix: vi.fn()
  })
}))

describe('ProjectDetailsView Component Flow', () => {
  const mockProject = {
    name: 'test-app',
    path: '/path/to/test-app',
    description: 'A React template test app',
    progress: 50
  }

  it('renders project details layout', () => {
    const handleSetViewMode = vi.fn()

    const { container } = render(
      <ProjectDetailsView
        currentProject={mockProject}
        setCurrentProject={vi.fn()}
        showToast={vi.fn()}
        setViewMode={handleSetViewMode}
        removeProject={vi.fn()}
        updateProject={vi.fn()}
        AnimatedCounter={({ value }) => <span>{value}</span>}
        formatBytes={(b) => `${b} Bytes`}
      />
    )

    // Verify view has core headers and titles
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()

    // Test clicking back button triggers callback via class selector
    const backBtn = container.querySelector('.lucide-arrow-left')?.closest('button')
    expect(backBtn).toBeInTheDocument()
    if (backBtn) {
      fireEvent.click(backBtn)
      expect(handleSetViewMode).toHaveBeenCalledWith('dashboard')
    }
  })
})
