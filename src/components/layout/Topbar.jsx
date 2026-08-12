import { Bell, Search, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Topbar({ onSearch, query }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#020617]/80 backdrop-blur-xl px-6">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Cari saham (BBCA, BBRI, ...)"
          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] py-2 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      <div className="ml-auto hidden md:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
          <TrendingUp size={14} /> IHSG 7.840 <span className="font-mono">+0,82%</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-white/[0.03] text-slate-300 border border-white/[0.08]">
          <span className="font-mono">LQ45</span> <span className="text-slate-500">1.045,22</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
