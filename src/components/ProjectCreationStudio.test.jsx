import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectCreationStudio } from './ProjectCreationStudio'

// Mock Tauri invoke and listen APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

describe('ProjectCreationStudio Component Flow', () => {
  it('renders the creation studio templates view and shows categories', () => {
    const handleBack = vi.fn()
    const handleImport = vi.fn()

    render(<ProjectCreationStudio onBack={handleBack} onImport={handleImport} />)

    // Check header text
    expect(screen.getByText('Project Studio')).toBeInTheDocument()

    // Assert that standard web category is active and visible
    expect(screen.getByText('NextJS')).toBeInTheDocument()
    expect(screen.getByText('React + Vite')).toBeInTheDocument()

    // Back button triggers callback
    const backBtn = screen.getByRole('button', { name: /Dashboard/i })
    fireEvent.click(backBtn)
    expect(handleBack).toHaveBeenCalled()
  })
})
