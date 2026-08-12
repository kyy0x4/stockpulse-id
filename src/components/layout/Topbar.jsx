import { Bell, Search, TrendingUp, Menu, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useIHSG } from '../../hooks/useIHSG'
import { useTheme } from '../../theme/ThemeProvider'

export default function Topbar({ onSearch, query, onToggleSidebar }) {
  const { ihsg } = useIHSG()
  const { isDark, toggleTheme } = useTheme()
  const positive = (ihsg?.change ?? 0) >= 0
  const ThemeIcon = isDark ? Sun : Moon

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="rounded-xl border border-line-strong bg-card p-2 text-ink-soft hover:text-ink transition-colors cursor-pointer lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={18} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Cari saham (BBCA, BBRI, ...)"
          className="w-full rounded-xl bg-elevated border border-line-strong py-2 pl-10 pr-4 text-sm placeholder:text-ink-faint focus:outline-none focus:border-up/40 focus:ring-2 focus:ring-up/10 transition-all"
        />
      </div>

      <div className="ml-auto hidden md:flex items-center gap-3 text-xs">
        <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border ${positive ? 'bg-up/10 text-up border-up/15' : 'bg-down/10 text-down border-down/15'}`}>
          <TrendingUp size={14} /> IHSG {(ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}{' '}
          <span className="font-mono">{positive ? '+' : ''}{(ihsg?.change ?? 0).toLocaleString('id-ID')}%</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-card text-ink/70 border border-line-strong">
          <span className="font-mono">LQ45</span> <span className="text-ink-faint">1.045,22</span>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleTheme}
        className="rounded-xl border border-line-strong bg-card p-2.5 text-ink-soft hover:text-ink transition-colors cursor-pointer"
        aria-label="Ganti tema"
      >
        <ThemeIcon size={16} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative rounded-xl border border-line-strong bg-card p-2.5 text-ink/70 hover:text-ink transition-colors cursor-pointer"
        aria-label="Notifikasi"
      >
        <Bell size={16} />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent glow-green" />
      </motion.button>

      <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-slate-950">
        K
      </div>
    </header>
  )
}
