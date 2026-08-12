import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  SlidersHorizontal,
  Star,
  Activity,
  Settings,
  CandlestickChart,
  X,
} from 'lucide-react'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', icon: SlidersHorizontal },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'market', label: 'Pasar', icon: Activity },
]

export default function Sidebar({ active, onNavigate, open = false, onClose }) {
  const navigate = (id) => {
    onNavigate(id)
    onClose?.()
  }

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

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 w-[240px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-line">
          <div className="glow-green flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
            <CandlestickChart size={18} className="text-slate-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">
              Stock<span className="text-accent">Pulse</span>
            </p>
            <p className="text-[10px] text-ink-faint font-mono">ID · Long Term</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-ink-soft hover:text-ink hover:bg-elevated transition-colors cursor-pointer lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const activeTab = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  activeTab ? 'text-ink' : 'text-ink-soft hover:text-ink hover:bg-elevated'
                }`}
              >
                {activeTab && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-up/15 to-transparent border border-up/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <item.icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {activeTab && (
                  <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-accent glow-green" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            onClick={() => navigate('settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:text-ink hover:bg-elevated transition-colors cursor-pointer"
          >
            <Settings size={18} />
            <span>Pengaturan</span>
          </button>
        </div>
      </aside>
    </>
  )
}
