import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Sun, Moon, Menu, X, Clock, ExternalLink, Loader2, Wifi,
  LayoutDashboard, SlidersHorizontal, Star, PieChart, LineChart, Globe,
  Newspaper, Activity, Zap, LogOut, ChevronDown, Crown, UserCog,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Avatar, AvatarFallback,
} from '@/components/ui/avatar'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMarketIndex } from '../../hooks/useMarketIndex'
import { api } from '../../api/client'
import { supabase } from '../../api/supabase'
import myLogo from '../../images/myLogo.png'
import brandLogo from '../../images/Logo MarketIQ Biru-Toska.png'

const NOTIF_KEY = 'stockpulse-notif-seen'

const PRIMARY_NAV = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', path: '/screener', icon: SlidersHorizontal },
  { id: 'watchlist', label: 'Watchlist', path: '/watchlist', icon: Star },
  { id: 'portfolio', label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { id: 'market', label: 'Market', path: '/market', icon: LineChart },
]

const MORE_NAV = [
  { id: 'profile', label: 'Profile', path: '/profile', icon: UserCog },
  { id: 'alerts', label: 'Alerts', path: '/alerts', icon: Bell },
  { id: 'pricing', label: 'Pricing', path: '/pricing', icon: Crown },
  { id: 'macro', label: 'Macro', path: '/macro', icon: Globe },
  { id: 'news', label: 'News', path: '/news', icon: Newspaper },
  { id: 'market-pulse', label: 'Market Pulse', path: '/market-pulse', icon: Activity },
  { id: 'news-impact', label: 'News Impact', path: '/news-impact', icon: Zap },
]

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

export default function TopNav({ page, onNavigate, query, onSearch, theme, toggleTheme, user, onLogout }) {
  const { index: spx } = useMarketIndex('SPX')
  const isDark = theme !== 'light'
  const positive = (spx?.change ?? 0) >= 0
  const ThemeIcon = isDark ? Sun : Moon

  const [news, setNews] = useState([])
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') } catch { return [] }
  })
  const [open, setOpen] = useState(false)
  const [loadingNews, setLoadingNews] = useState(true)
  const [drawer, setDrawer] = useState(false)

  const panelRef = useRef(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      api.news('all', 8)
        .then((res) => { if (alive) { setNews(res.items || []); setLoadingNews(false) } })
        .catch(() => alive && setLoadingNews(false))
    }
    load()
    const timer = setInterval(load, 5 * 60 * 1000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setDrawer(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const markSeen = () => {
    const ids = news.map((n) => n.link).filter(Boolean)
    if (!ids.length) return
    setSeen((prev) => {
      const next = [...new Set([...ids, ...prev])].slice(0, 80)
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const unread = news.filter((n) => !seen.includes(n.link)).length

  const go = (item) => { onNavigate?.(item.id); setDrawer(false) }

  return (
    <>
      <header className="topnav">
        <div className="topnav-burger">
          <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Menu">
            <Menu size={17} />
          </button>
        </div>

        <div className="topnav-brand" onClick={() => go({ id: 'dashboard', path: '/' })}>
          <img src={brandLogo} alt="MarketIQ" className="topnav-brand-img" />
          <div className="topnav-brand-text">
            MARKET<span className="brand-iq">IQ</span>
          </div>
        </div>

        <nav className="topnav-links">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`topnav-link ${page === item.id ? 'active' : ''}`}
                onClick={() => go(item)}
              >
                <Icon size={15} />
                {item.label}
              </button>
            )
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`topnav-link ${MORE_NAV.some((m) => m.id === page) ? 'active' : ''}`}
              >
                More <ChevronDown size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8}>
              <DropdownMenuLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Navigasi
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MORE_NAV.map((m) => {
                const Icon = m.icon
                return (
                  <DropdownMenuItem key={m.id} onClick={() => go(m)}>
                    <Icon size={15} style={{ color: page === m.id ? 'var(--accent)' : 'var(--text3)' }} />
                    {m.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="topnav-actions">
          <div className="topnav-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Cari aset…"
            />
          </div>

          <div
            className="hidden xl:flex"
            style={{
              alignItems: 'center', gap: 6, height: 34, padding: '0 11px',
              borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg3)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: positive ? 'var(--up)' : 'var(--down)',
            }}
          >
            <span style={{ color: 'var(--text3)' }}>S&P</span>
            {(spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span>{positive ? '+' : ''}{(spx?.change ?? 0).toFixed(2)}%</span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="icon-btn" onClick={toggleTheme} aria-label="Ganti tema">
                <ThemeIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ganti tema</TooltipContent>
          </Tooltip>

          <div ref={panelRef} style={{ position: 'relative' }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="icon-btn"
                  onClick={() => { if (!open) markSeen(); setOpen((v) => !v) }}
                  aria-label="Notifikasi"
                >
                  <Bell size={16} />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--down)', color: '#fff', borderRadius: 99,
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, padding: '0 4px',
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Notifikasi</TooltipContent>
            </Tooltip>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 350, maxWidth: '92vw',
                    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14,
                    boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Newspaper size={15} style={{ color: 'var(--accent)' }} /> Berita Terbaru
                    </p>
                    <button onClick={() => setOpen(false)} className="icon-btn" style={{ width: 26, height: 26, border: 'none', background: 'none' }} aria-label="Tutup">
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ maxHeight: 370, overflowY: 'auto' }}>
                    {loadingNews && news.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '36px 0', color: 'var(--text3)', fontSize: 12 }}>
                        <Loader2 size={15} className="animate-spin" /> memuat…
                      </div>
                    ) : news.length === 0 ? (
                      <p style={{ padding: '34px 0', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>Belum ada berita.</p>
                    ) : (
                      news.map((n) => (
                        <a
                          key={n.link}
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpen(false)}
                          className="hoverable"
                          style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)' }}
                        >
                          {n.image && <img src={n.image} alt="" loading="lazy" style={{ height: 42, width: 42, flexShrink: 0, objectFit: 'cover', borderRadius: 8 }} />}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.45 }}>{n.title}</p>
                            <p style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                              <Clock size={9} /> {timeAgo(n.published)} · buka <ExternalLink size={9} />
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

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title={user.email}
                  className="flex items-center gap-2 h-[34px] px-2 pr-3 rounded-lg border bg-secondary text-foreground text-xs font-medium cursor-pointer"
                >
                  <Avatar className="h-[26px] w-[26px] rounded-lg bg-accent">
                    <AvatarFallback className="text-primary-foreground text-[13px] font-bold bg-accent">
                      {(user.name || user.email || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block max-w-[110px] truncate">{user.name || user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuLabel>
                  <div>
                    <div className="text-[13px] font-semibold">{user.name || 'Pengguna'}</div>
                    <div className="text-[10.5px] font-mono text-muted-foreground break-all">{user.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px]" style={{ color: supabase ? 'var(--up)' : 'var(--text3)' }}>
                      <Wifi size={12} /> {supabase ? 'Realtime aktif' : 'Refresh manual'}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleTheme()}>
                  <ThemeIcon size={14} /> Ganti tema
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate?.('profile')}>
                  <UserCog size={14} /> Profil & Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onLogout}
                >
                  <LogOut size={14} /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="mobile-drawer">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              style={{ position: 'absolute', inset: 0, background: 'var(--overlay)' }}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="mobile-drawer-panel"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <img src={brandLogo} alt="MarketIQ" className="topnav-brand-img" />
                  <div className="topnav-brand-text">
                    MARKET<span className="brand-iq">IQ</span>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Tutup"><X size={17} /></button>
              </div>
              {[...PRIMARY_NAV, ...MORE_NAV].map((item) => {
                const Icon = item.icon
                return (
                  <button key={item.id} className={`mobile-nav-link ${page === item.id ? 'active' : ''}`} onClick={() => go(item)}>
                    <Icon size={16} /> {item.label}
                  </button>
                )
              })}
              <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button className="mobile-nav-link" onClick={() => { toggleTheme(); setDrawer(false) }}>
                  <ThemeIcon size={16} /> {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                {user && (
                  <button className="mobile-nav-link" onClick={onLogout} style={{ color: 'var(--down)' }}>
                    <LogOut size={16} /> Log out
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
