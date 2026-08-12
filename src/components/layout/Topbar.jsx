import { useEffect, useRef, useState } from 'react'
import { Bell, Search, TrendingUp, Menu, Sun, Moon, Newspaper, Loader2, X, ExternalLink, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIHSG } from '../../hooks/useIHSG'
import { useTheme } from '../../theme/ThemeProvider'
import { api } from '../../api/client'

const KEY = 'stockpulse-notif-seen'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam`
  return `${Math.floor(hrs / 24)} hari`
}

export default function Topbar({ onSearch, query, onToggleSidebar }) {
  const { ihsg } = useIHSG()
  const { isDark, toggleTheme } = useTheme()
  const positive = (ihsg?.change ?? 0) >= 0
  const ThemeIcon = isDark ? Sun : Moon

  const [news, setNews] = useState([])
  const [seen, setSeen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  })
  const [open, setOpen] = useState(false)
  const [loadingNews, setLoadingNews] = useState(true)
  const panelRef = useRef(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      api.news('market', 8)
        .then((res) => {
          if (!alive) return
          setNews(res.items || [])
          setLoadingNews(false)
        })
        .catch(() => alive && setLoadingNews(false))
    }
    load()
    const timer = setInterval(load, 5 * 60 * 1000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  const markSeen = () => {
    const ids = news.map((n) => n.link).filter(Boolean)
    if (!ids.length) return
    setSeen((prev) => {
      const next = [...new Set([...ids, ...prev])].slice(0, 80)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const unread = news.filter((n) => !seen.includes(n.link)).length

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

      <div ref={panelRef} className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!open) markSeen()
            setOpen((v) => !v)
          }}
          className="relative rounded-xl border border-line-strong bg-card p-2.5 text-ink/70 hover:text-ink transition-colors cursor-pointer"
          aria-label="Notifikasi berita"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-slate-950 glow-green">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-[340px] max-w-[90vw] rounded-2xl border border-line-strong bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Newspaper size={15} className="text-up" /> Berita Terbaru
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-ink-faint hover:text-ink hover:bg-elevated transition-colors cursor-pointer"
                  aria-label="Tutup notifikasi"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {loadingNews && news.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-ink-faint">
                    <Loader2 size={14} className="animate-spin" /> memuat…
                  </div>
                ) : news.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-faint">Belum ada berita.</p>
                ) : (
                  news.map((n) => (
                    <a
                      key={n.link}
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-elevated transition-colors"
                    >
                      {n.image && (
                        <img src={n.image} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-snug line-clamp-2">{n.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-faint font-mono">
                          <Clock size={9} /> {timeAgo(n.published)} · buka
                          <ExternalLink size={9} />
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-slate-950">
        K
      </div>
    </header>
  )
}