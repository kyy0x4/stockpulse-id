import { useEffect, useRef, useState } from 'react'
import { Bell, Search, TrendingUp, Menu, Sun, Moon, Newspaper, Loader2, X, ExternalLink, Clock, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMarketIndex } from '../../hooks/useMarketIndex'
import { api } from '../../api/client'
import { supabase } from '../../api/supabase'

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

export default function Topbar({ onSearch, query, onToggleSidebar, onToggleCollapse, sidebarCollapsed, theme, toggleTheme, user, onLogout }) {
  const { index: spx } = useMarketIndex('SPX')
  const isDark = theme !== 'light'
  const positive = (spx?.change ?? 0) >= 0
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
  const [userOpen, setUserOpen] = useState(false)
  const [loadingNews, setLoadingNews] = useState(true)
  const panelRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      api.news('all', 8)
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserOpen(false)
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
    <header style={{ position:'sticky', top:0, zIndex:30, display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, minHeight:44, borderBottom:'1px solid var(--border)', background:'var(--bg)', padding:'8px 16px' }}>
      <button
        onClick={onToggleSidebar}
        className="lg:hidden"
        style={{ border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', padding:6, lineHeight:0, cursor:'pointer' }}
        aria-label="Buka menu"
      >
        <Menu size={16} />
      </button>

      <button
        onClick={onToggleCollapse}
        className="hidden lg:inline-flex"
        style={{ border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', padding:6, lineHeight:0, cursor:'pointer' }}
        aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Kecilkan sidebar'}
      >
        <Menu size={16} />
      </button>

      <div style={{ position:'relative', flex:'1 1 260px', minWidth:0, maxWidth:420 }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
        <input
          value={query}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Cari aset (AAPL, NVDA, BTC, ...)"
          style={{
            width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)',
            padding:'5px 12px 5px 30px', fontSize:12, fontFamily:'var(--font-body)', outline:'none',
          }}
        />
      </div>

      <div style={{ marginLeft:'auto', display:'none', alignItems:'center', gap:8, fontSize:11, fontFamily:'var(--font-mono)' }} className="lg:flex">
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', border:'1px solid var(--border2)', background:'var(--bg3)', color: positive ? 'var(--up)' : 'var(--down)' }}>
          <TrendingUp size={13} /> S&P 500 {(spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          <span>{positive ? '+' : ''}{(spx?.change ?? 0).toLocaleString('en-US')}%</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)' }}>
          <Wifi size={13} style={{ color: supabase ? 'var(--up)' : 'var(--text3)' }} /> {supabase ? 'LIVE' : 'REFRESH'}
        </div>
      </div>

      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {user && (
          <div ref={userMenuRef} style={{ position:'relative' }}>
            <button
              onClick={() => setUserOpen((v) => !v)}
              title={`${user.email}`}
              style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid var(--border2)', background:'var(--bg3)', padding:'3px 8px 3px 3px', cursor:'pointer', color:'var(--text)' }}
            >
              <span style={{ height:24, width:24, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent)', color:'var(--bg)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:14 }}>
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:block" style={{ fontSize:11, fontFamily:'var(--font-body)', fontWeight:600, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.name || user.email}
              </span>
            </button>
            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{ position:'absolute', right:0, top:'calc(100% + 8px)', minWidth:220, background:'var(--bg2)', border:'1px solid var(--border2)', overflow:'hidden' }}
                >
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{user.name || 'Pengguna'}</div>
                    <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text3)', marginTop:2, wordBreak:'break-all' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', border:'none', background:'none', color:'var(--down)', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.06em', cursor:'pointer' }}
                    className="hoverable"
                  >
                    ⎋ LOG OUT
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={toggleTheme}
          style={{ border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', padding:6, lineHeight:0, cursor:'pointer' }}
          aria-label="Ganti tema"
        >
          <ThemeIcon size={15} />
        </button>

        <div ref={panelRef} style={{ position:'relative' }}>
          <button
            onClick={() => {
              if (!open) markSeen()
              setOpen((v) => !v)
            }}
            style={{ position:'relative', border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', padding:6, lineHeight:0, cursor:'pointer' }}
            aria-label="Notifikasi berita"
          >
            <Bell size={15} />
            {unread > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent)', color:'var(--bg)', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:500, padding:'0 3px' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:340, maxWidth:'90vw', background:'var(--bg2)', border:'1px solid var(--border2)', overflow:'hidden' }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                  <p style={{ fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                    <Newspaper size={14} style={{ color:'var(--up)' }} /> Berita Terbaru
                  </p>
                  <button onClick={() => setOpen(false)} style={{ border:'none', background:'none', color:'var(--text3)', padding:4, lineHeight:0, cursor:'pointer' }} aria-label="Tutup notifikasi">
                    <X size={13} />
                  </button>
                </div>

                <div style={{ maxHeight:360, overflowY:'auto' }}>
                  {loadingNews && news.length === 0 ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'32px 0', color:'var(--text3)', fontSize:11 }}>
                      <Loader2 size={14} className="animate-spin" /> memuat…
                    </div>
                  ) : news.length === 0 ? (
                    <p style={{ padding:'32px 0', textAlign:'center', fontSize:12, color:'var(--text3)' }}>Belum ada berita.</p>
                  ) : (
                    news.map((n) => (
                      <a
                        key={n.link}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        style={{ display:'flex', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', textDecoration:'none', color:'var(--text)' }}
                        className="hoverable"
                      >
                        {n.image && <img src={n.image} alt="" loading="lazy" style={{ height:40, width:40, flexShrink:0, objectFit:'cover' }} />}
                        <div style={{ minWidth:0, flex:1 }}>
                          <p style={{ fontSize:11, fontWeight:500, lineHeight:1.5 }}>{n.title}</p>
                          <p style={{ marginTop:2, display:'flex', alignItems:'center', gap:4, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text3)' }}>
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
      </div>
    </header>
  )
}
