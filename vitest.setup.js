import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd, args) => {
    console.log(`Mocked invoke called for: ${cmd}`, args)
    if (cmd === 'get_projects' || cmd === 'list_projects') return Promise.resolve([])
    return Promise.resolve(null)
  }),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

// Mock framer-motion using React.createElement to avoid JSX in .js file
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef((props, ref) => 
      React.createElement('div', { ...props, ref })
    ),
    button: React.forwardRef((props, ref) => 
      React.createElement('button', { ...props, ref })
    ),
  },
  AnimatePresence: ({ children }) => children,
}))
