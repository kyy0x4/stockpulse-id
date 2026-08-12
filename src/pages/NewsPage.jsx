import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, Rss, Loader2, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Badge from '../components/ui/Badge'
import { api } from '../api/client'
import Card from '../components/ui/Card'

const CATEGORIES = [
  { id: 'market', label: 'Market & Saham' },
  { id: 'ekbis', label: 'Ekonomi & Bisnis' },
]

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam`
  const days = Math.floor(hrs / 24)
  return `${days} hari`
}

function sentimentBadge(label) {
  if (label === 'positif') return <Badge tone="green" dot>Bullish</Badge>
  if (label === 'negatif') return <Badge tone="red" dot>Bearish</Badge>
  return <Badge tone="neutral" dot>Netral</Badge>
}

function impactLabel(label) {
  if (label === 'positif') return { text: 'Tendensi menguatkan IHSG', Icon: TrendingUp, cls: 'text-up' }
  if (label === 'negatif') return { text: 'Tendensi menekan IHSG', Icon: TrendingDown, cls: 'text-down' }
  return { text: 'Dampak terbatas ke IHSG', Icon: Activity, cls: 'text-ink-soft' }
}

export default function NewsPage({ onSelectStock }) {
  const [category, setCategory] = useState('market')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    api.news(category, 20)
      .then((res) => alive && setItems(res.items || []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [category])

  const summary = useMemo(() => {
    const b = items.filter((n) => n.sentiment === 'positif').length
    const be = items.filter((n) => n.sentiment === 'negatif').length
    const net = b - be
    const netral = items.length - b - be
    return { bullish: b, bearish: be, netral, net }
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold tracking-tight"
          >
            Market <span className="text-gradient">News</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-sm text-ink-faint mt-1"
          >
            Berita ekonomi & pasar saham Indonesia · analisa sentimen & saham terkait
          </motion.p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-card p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                category === c.id
                  ? 'bg-gradient-to-r from-up/15 to-teal-500/10 text-ink border border-up/25'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Rss size={13} className={category === c.id ? 'text-up' : ''} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin text-up" />
          <p className="text-sm text-ink-soft font-mono">Mengambil berita terbaru…</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass rounded-2xl p-10 text-center">
          <Newspaper size={22} className="mx-auto text-warning mb-3" />
          <p className="text-sm text-ink-soft">Berita gagal dimuat: {error}</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-faint font-medium">Bullish</p>
                <p className="mt-1 font-mono text-xl font-bold text-up">{summary.bullish}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-faint font-medium">Bearish</p>
                <p className="mt-1 font-mono text-xl font-bold text-down">{summary.bearish}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-faint font-medium">Netral</p>
                <p className="mt-1 font-mono text-xl font-bold text-ink-soft">{summary.netral}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-faint font-medium">Sentimen Pasar</p>
                <p className={`mt-1 font-mono text-xl font-bold ${summary.net >= 0 ? 'text-up' : 'text-down'}`}>
                  {summary.net >= 0 ? '+' : ''}{summary.net}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Newspaper size={22} className="mx-auto text-ink-faint mb-3" />
          <p className="text-sm text-ink-soft">Belum ada berita saat ini.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((n, i) => {
          const impact = impactLabel(n.sentiment)
          return (
            <motion.div
              key={n.link}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.35 }}
              className="glass rounded-2xl overflow-hidden group hover:border-up/25 transition-colors flex flex-col"
            >
              <a href={n.link} target="_blank" rel="noopener noreferrer">
                <div className="relative h-40 bg-elevated overflow-hidden">
                  {n.image ? (
                    <img
                      src={n.image}
                      alt={n.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-up/10 to-teal-500/5">
                      <Newspaper size={28} className="text-up/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-2.5 left-3">{sentimentBadge(n.sentiment)}</div>
                  <span className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[10px] text-white/80 font-mono">
                    <Clock size={10} /> {timeAgo(n.published)}
                  </span>
                </div>
                <div className="p-4 flex-1">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-3 group-hover:text-up transition-colors">
                    {n.title}
                  </h3>
                </div>
              </a>

              <div className="px-4 pb-4 -mt-1 space-y-2">
                <p className={`flex items-center gap-1.5 text-[11px] font-mono ${impact.cls}`}>
                  <impact.Icon size={12} /> {impact.text}
                </p>
                {n.related.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {n.related.map((r) => (
                      <button
                        key={r.ticker}
                        onClick={() => onSelectStock?.({ ticker: r.ticker, name: r.name, sector: r.sector })}
                        className="rounded-full border border-line-strong bg-card px-2.5 py-1 text-[11px] text-ink-soft hover:text-up hover:border-up/30 transition-colors cursor-pointer"
                        title={r.name || r.ticker}
                      >
                        {r.ticker}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="text-[11px] text-ink-faint text-right">Sumber: cnbcindonesia.com · analisa sentimen otomatis</p>
    </div>
  )
}