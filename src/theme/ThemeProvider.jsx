import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'stockpulse-theme'

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.remove('dark')
    else root.classList.add('dark')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function usePalette() {
  const { isDark } = useTheme()
  return {
    up: isDark ? '#22c55e' : '#059669',
    down: isDark ? '#ef4444' : '#dc2626',
    warn: isDark ? '#f59e0b' : '#d97706',
    info: isDark ? '#38bdf8' : '#0284c7',
    track: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)',
    grid: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.08)',
    axis: '#64748b',
    tooltipBg: isDark ? '#0b1526' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
    label: isDark ? '#94a3b8' : '#64748b',
    stroke: isDark ? '#020617' : '#ffffff',
  }
}
