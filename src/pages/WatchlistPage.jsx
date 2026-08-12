import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ScoreRing from '../components/ui/ScoreRing'
import StockLogo from '../components/ui/StockLogo'
import { Star, Bell, TrendingUp, TrendingDown, X, Check, Trash2 } from 'lucide-react'

const KEY = 'stockpulse-price-alerts'
const TRIGGERED_KEY = 'stockpulse-price-triggered'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} mnt lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return `${Math.floor(hrs / 24)} hr lalu`
}

async function notify(title, body) {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') await Notification.requestPermission()
    if (Notification.permission === 'granted') new Notification(title, { body })
  } catch {
    /* ignore */
  }
}

export default function WatchlistPage({ favorites, stocks, onSelectStock, onToggleFav }) {
  const list = favorites.map((t) => stocks.find((s) => s.ticker === t)).filter(Boolean)

  const [alerts, setAlerts] = useState(() => load(KEY, {}))
  const [triggered, setTriggered] = useState(() => load(TRIGGERED_KEY, {}))
  const [editing, setEditing] = useState(null)
  const [target, setTarget] = useState('')

  useEffect(() => {
    let changed = false
    const next = { ...triggered }
    list.forEach((s) => {
      const a = alerts[s.ticker]
      if (!a || s.price == null) return
      const key = s.ticker
      const fired = next[key]
      if (fired) return
      const hit = (a.above && s.price >= a.above) || (a.below && s.price <= a.below)
      if (hit) {
        next[key] = { direction: s.price >= (a.above ?? -Infinity) ? 'above' : 'below', price: s.price, at: new Date().toISOString() }
        changed = true
        notify(
          `${s.ticker} ${s.price.toLocaleString('id-ID')}`,
          s.price >= (a.above ?? -Infinity) ? `Tembus target naik Rp${a.above?.toLocaleString('id-ID')}` : `Turun ke target Rp${a.below?.toLocaleString('id-ID')}`
        )
      }
    })
    if (changed) {
      setTriggered(next)
      save(TRIGGERED_KEY, next)
    }
  }, [list, alerts, triggered])

  const openEditor = (ticker) => {
    const a = alerts[ticker]
    setTarget(a ? (a.above != null ? String(a.above) : String(a.below)) : '')
    setEditing(ticker)
  }

  const saveAlert = (ticker, price) => {
    const val = parseFloat(target)
    if (!Number.isFinite(val) || val <= 0) return
    const next = { ...alerts, [ticker]: { above: val > price ? val : null, below: val <= price ? val : null } }
    setAlerts(next)
    save(KEY, next)
    setEditing(null)
    setTarget('')
  }

  const removeAlert = (ticker, e) => {
    e.stopPropagation()
    const next = { ...alerts }
    delete next[ticker]
    setAlerts(next)
    save(KEY, next)
  }

  const clearTriggered = (ticker, e) => {
    e.stopPropagation()
    const next = { ...triggered }
    delete next[ticker]
    setTriggered(next)
    save(TRIGGERED_KEY, next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold tracking-tight"
          >
            <span className="text-gradient">Watchlist</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-sm text-ink-faint mt-1"
          >
            {list.length} saham dipantau · alert harga & notifikasi browser
          </motion.p>
        </div>
      </div>

      {list.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated border border-line-strong text-ink-faint">
              <Star size={24} />
            </div>
            <h3 className="font-semibold text-lg">Belum ada saham di watchlist</h3>
            <p className="text-sm text-ink-faint mt-1.5 max-w-sm mx-auto">
              Klik ikon bintang di tabel Screener atau Dashboard untuk menambahkan saham yang ingin kamu pantau.
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {list.map((s, i) => {
              const a = alerts[s.ticker]
              const t = triggered[s.ticker]
              return (
                <motion.div
                  key={s.ticker}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
                >
                  <Card hover className="p-5 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <StockLogo ticker={s.ticker} name={s.name} size="md" logoUrl={s.logoUrl} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold tracking-tight">{s.ticker}</p>
                            <Badge tone={s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'amber'} dot>
                              {s.signal}
                            </Badge>
                            {a && !t && (
                              <Badge tone="blue" dot>Alarm</Badge>
                            )}
                          </div>
                          <p className="text-xs text-ink-faint">{s.sector}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleFav(s.ticker)}
                        className="p-1.5 rounded-lg text-warning bg-warning/10 hover:bg-warning/20 transition-colors cursor-pointer"
                        aria-label="Hapus dari watchlist"
                      >
                        <Star size={16} fill="currentColor" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <p className="font-mono text-2xl font-bold tracking-tight">
                        {s.price != null ? s.price.toLocaleString('id-ID') : '—'}
                      </p>
                      <p className={`flex items-center gap-1 font-mono text-sm ${s.change != null && s.change >= 0 ? 'text-up' : 'text-down'}`}>
                        {s.change != null && s.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {s.change != null ? `${s.change >= 0 ? '+' : ''}${s.change}%` : '—'}
                      </p>
                    </div>

                    {a ? (
                      <div className="mt-3 rounded-xl bg-elevated border border-line px-3 py-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-mono text-ink-soft">
                          {a.above != null && <span>Target naik <span className="text-up">{a.above.toLocaleString('id-ID')}</span></span>}
                          {a.below != null && <span> Target turun <span className="text-down">{a.below.toLocaleString('id-ID')}</span></span>}
                        </p>
                        <div className="flex items-center gap-1">
                          {t ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-up font-mono" title={timeAgo(t.at)}>
                              <Check size={12} /> {t.price.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <button onClick={() => openEditor(s.ticker)} className="text-ink-faint hover:text-info transition-colors cursor-pointer" aria-label="Ubah alarm">
                              <Bell size={13} />
                            </button>
                          )}
                          <button onClick={(e) => clearTriggered(s.ticker, e)} className="text-ink-faint hover:text-ink transition-colors cursor-pointer" aria-label="Hapus riwayat">
                            <X size={13} />
                          </button>
                          <button onClick={(e) => removeAlert(s.ticker, e)} className="text-ink-faint hover:text-down transition-colors cursor-pointer" aria-label="Hapus alarm">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-elevated border border-line px-3 py-2">
                        <p className="text-xs text-ink-faint">Belum ada alarm harga</p>
                        <button onClick={() => openEditor(s.ticker)} className="text-ink-soft hover:text-info transition-colors cursor-pointer" aria-label="Set alert harga">
                          <Bell size={14} />
                        </button>
                      </div>
                    )}

                    {editing === s.ticker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveAlert(s.ticker, s.price)}
                            placeholder={s.price != null ? `Target (harga kini ${s.price.toLocaleString('id-ID')})` : 'Target harga'}
                            className="w-full rounded-xl bg-card border border-line-strong px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:border-info/50 focus:ring-2 focus:ring-info/10"
                            autoFocus
                          />
                          <button
                            onClick={() => saveAlert(s.ticker, s.price)}
                            disabled={!Number.isFinite(parseFloat(target)) || parseFloat(target) <= 0}
                            className="rounded-xl bg-info/15 border border-info/30 px-3 py-2 text-xs font-semibold text-info hover:bg-info/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Simpan
                          </button>
                          <button onClick={() => setEditing(null)} className="rounded-xl border border-line-strong bg-card px-2.5 py-2 text-ink-soft hover:text-ink transition-colors cursor-pointer" aria-label="Batal">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] text-ink-faint">Di atas harga → alarm "naik ke", di bawah → alarm "turun ke". Notifikasi browser dikirim saat tersentuh.</p>
                      </motion.div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-ink-soft">
                        <span>PER <span className="text-ink/80 font-mono">{s.fundamental.per || '—'}</span></span>
                        <span>ROE <span className="text-ink/80 font-mono">{s.fundamental.roe != null ? `${s.fundamental.roe}%` : '—'}</span></span>
                      </div>
                      <ScoreRing value={s.composite ?? 0} size={40} stroke={4} />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => onSelectStock(s)}
                        className="flex-1 rounded-xl bg-up/10 border border-up/20 py-2 text-xs font-semibold text-up hover:bg-up/20 transition-colors cursor-pointer"
                      >
                        Analisa Lengkap
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}