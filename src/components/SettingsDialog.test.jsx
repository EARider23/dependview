import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SettingsDialog } from './SettingsDialog'

// Mock useMaintenance and useHistory hooks which SettingsDialog uses
vi.mock('../hooks/useMaintenance', () => ({
  useMaintenance: () => ({
    maintenanceResult: null,
    isAnalyzing: false,
    runMaintenance: vi.fn(),
    handleCleanCache: vi.fn(),
    handleCleanAllCaches: vi.fn(),
  })
}))

vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({
    historyRecords: [],
    clearHistory: vi.fn(),
  })
}))

describe('SettingsDialog Component Flow', () => {
  const defaultSettings = {
    theme: 'light',
    defaultEditor: 'vscode',
    packageManager: 'npm',
    saveExact: false,
    ignoreScripts: false,
    registryUrl: '',
    ignorePatterns: 'node_modules',
    autoScan: true,
    deepSearch: true,
    autoCleanup: false,
    customScanPaths: []
  }

  it('renders settings options when dialog is open and triggers save callback', () => {
    const handleOpenChange = vi.fn()
    const handleSave = vi.fn()

    render(
      <SettingsDialog
        open={true}
        onOpenChange={handleOpenChange}
        settings={defaultSettings}
        onSave={handleSave}
        showToast={vi.fn()}
        formatBytes={vi.fn()}
      />
    )

    // Verify it renders the sidebar items and headers
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()

    // Test clicking dark mode option
    const darkModeButton = screen.getByText('Dark Mode')
    fireEvent.click(darkModeButton)

    // Save settings and verify callback was called with updated settings
    const saveButton = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(saveButton)

    expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
      theme: 'dark'
    }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})
