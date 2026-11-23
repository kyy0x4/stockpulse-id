import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import logoUrl from '../../images/myLogo.png'

const nav = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'screener', label: 'Screener', path: '/screener' },
  { id: 'watchlist', label: 'Watchlist', path: '/watchlist' },
  { id: 'portfolio', label: 'Portfolio', path: '/portfolio' },
  { id: 'market', label: 'Pasar', path: '/market' },
  { id: 'macro', label: 'Macro', path: '/macro' },
  { id: 'market-pulse', label: 'Market Pulse', path: '/market-pulse' },
  { id: 'news', label: 'News', path: '/news' },
  { id: 'news-impact', label: 'News Impact', path: '/news-impact' },
]

export default function Sidebar({ active, onNavigate, open = false, collapsed = false, onClose, theme, toggleTheme, onToggleCollapse, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (item) => {
    onNavigate(item.id)
    onClose?.()
    if (item.path) navigate(item.path)
  }

  useEffect(() => {
    onClose?.()
  }, [location.pathname])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-overlay/80 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 88 : 260 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className={`fixed inset-y-0 left-0 z-40 flex max-w-[85vw] flex-col border-r border-line bg-card/95 backdrop-blur-xl lg:static lg:max-w-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ willChange: 'width, transform' }}
      >
        <div className="relative px-5 py-5 border-b border-line">
          <div className="flex items-center justify-center min-h-[44px]">
            <AnimatePresence mode="wait" initial={false}>
              {collapsed ? (
                <motion.img
                  key="logo"
                  src={logoUrl}
                  alt="PulseTerminal"
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.82, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.82, y: -4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-9 w-9 object-contain"
                />
              ) : (
                <motion.div
                  key="wordmark"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="text-center"
                >
                  <p className="font-display text-[28px] leading-none font-extrabold tracking-tight">
                    Pulse<span className="text-accent">Terminal</span>
                  </p>
                  <p className="font-mono text-[9px] mt-1 text-ink-soft tracking-[0.12em]">
                    SAHAM AS · KRIPTO · MAKRO
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-soft hover:text-ink hover:bg-elevated transition-colors cursor-pointer lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="absolute right-4 top-4 hidden rounded-lg p-1.5 text-ink-soft hover:text-ink hover:bg-elevated transition-colors cursor-pointer lg:inline-flex"
            aria-label={collapsed ? 'Buka sidebar' : 'Kecilkan sidebar'}
          >
            <span className="font-mono text-[10px]">{collapsed ? '›' : '‹'}</span>
          </button>
        </div> 

        <nav className="flex-1 py-3">
          {nav.map((item) => {
            const activeTab = active === item.id || location.pathname === item.path
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`nav-btn ${activeTab ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.12 }}
              >
                <span>{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-line">
          {user && !collapsed && (
            <div className="mb-3 px-3 py-2 border border-line bg-card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div className="font-mono text-[10px] text-ink truncate">{user.name || user.email}</div>
              <div className="font-mono text-[9px] text-ink-faint truncate tracking-[0.08em]">{user.email}</div>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-2 px-3 py-1.5 mb-3 border border-line-strong bg-elevated text-ink-soft font-mono text-[10px] tracking-[0.06em] transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-[13px]">{theme === 'dark' ? '☼' : '◗'}</span>
            {!collapsed && (theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE')}
          </button>
          {user && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2 px-3 py-1.5 mb-3 border border-line bg-card text-ink-soft font-mono text-[10px] tracking-[0.06em] transition-colors cursor-pointer hover:text-ink ${collapsed ? 'justify-center' : ''}`}
              style={{ color: 'var(--down)' }}
            >
              <span className="text-[12px]">⎋</span>
              {!collapsed && 'LOG OUT'}
            </button>
          )}
          {!collapsed && <div className="font-mono text-[9px] text-ink-faint tracking-[0.08em]">US 21:30 WIB · KRIPTO 24/7</div>}
        </div>
      </motion.aside>
    </>
  )
}
