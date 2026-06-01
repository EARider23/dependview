import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock sub-components if they do complex interactions or read filesystem
vi.mock('./views/DashboardView', () => ({
  default: ({ setViewMode }) => (
    <div data-testid="dashboard-view">
      Dashboard View Mock
      <button onClick={() => setViewMode('create-project')}>Create Project</button>
    </div>
  )
}))
vi.mock('./views/ProjectDetailsView', () => ({
  default: () => <div data-testid="project-details-view">Project Details View Mock</div>
}))
vi.mock('./views/SystemPackagesView', () => ({
  default: () => <div data-testid="system-packages-view">System Packages View Mock</div>
}))
vi.mock('./views/FrameworksView', () => ({
  default: () => <div data-testid="frameworks-view">Frameworks View Mock</div>
}))

describe('Peeak App Core Flow - Tab Navigation', () => {
  it('renders the Peeak App header and navigation layout, and allows switching views', () => {
    render(<App />)
    
    // Check if the logo header renders
    expect(screen.getByText('PEEAK')).toBeInTheDocument()
    
    // Initial view should be dashboard/project package
    expect(screen.getByTestId('dashboard-view')).toBeInTheDocument()
    
    // Check if the tabs exist
    const systemTab = screen.getByText('System Package')
    const frameworkTab = screen.getByText('Framework')
    
    // Switch to System Package View
    fireEvent.click(systemTab)
    expect(screen.getByTestId('system-packages-view')).toBeInTheDocument()
    
    // Switch to Framework View
    fireEvent.click(frameworkTab)
    expect(screen.getByTestId('frameworks-view')).toBeInTheDocument()
  })
})
