import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  SlidersHorizontal,
  Star,
  Activity,
  Settings,
  CandlestickChart,
} from 'lucide-react'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', icon: SlidersHorizontal },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'market', label: 'Pasar', icon: Activity },
]

export default function Sidebar({ active, onNavigate, collapsed = false }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[#040b18]/95 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[240px]'
      }`}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="glow-green flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
          <CandlestickChart size={18} className="text-slate-950" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">
              Stock<span className="text-accent">Pulse</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">ID · Long Term</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const activeTab = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {activeTab && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/15 to-transparent border border-emerald-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">{item.label}</span>}
              {!collapsed && activeTab && (
                <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-accent glow-green" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={() => onNavigate('settings')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <Settings size={18} />
          {!collapsed && <span>Pengaturan</span>}
        </button>
      </div>
    </aside>
  )
}
