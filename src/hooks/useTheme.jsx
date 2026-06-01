import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Load from localStorage, default to 'light'
    const saved = localStorage.getItem('peeak_theme')
    return saved || 'light'
  })

  const isDark = theme === 'dark'

  // Apply the theme class to <html> element
  useEffect(() => {
    const root = document.documentElement

    // Add transition class for smooth theme change
    root.classList.add('dark-transitioning')

    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      root.classList.remove('dark-transitioning')
    }, 350)

    // Persist to localStorage
    localStorage.setItem('peeak_theme', theme)

    return () => clearTimeout(timer)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
