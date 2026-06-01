import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import './dark-theme.css'

// Prevent the default web context menu (right-click) to make the app feel native
document.addEventListener('contextmenu', e => {
  // Allow context menu only for input fields or textareas if needed, or disable globally
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
