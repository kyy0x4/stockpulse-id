import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, Rss, Loader2, Clock } from 'lucide-react'
import { api } from '../api/client'

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

export default function NewsPage() {
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
            Berita ekonomi & pasar saham Indonesia · CNBC Indonesia
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

      {!loading && !error && items.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Newspaper size={22} className="mx-auto text-ink-faint mb-3" />
          <p className="text-sm text-ink-soft">Belum ada berita saat ini.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((n, i) => (
          <motion.a
            key={n.link}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04, duration: 0.35 }}
            className="glass rounded-2xl overflow-hidden group hover:border-up/25 transition-colors flex flex-col"
          >
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
              <span className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[10px] text-white/80 font-mono">
                <Clock size={10} /> {timeAgo(n.published)}
              </span>
            </div>
            <div className="p-4 flex-1">
              <h3 className="text-sm font-semibold leading-snug line-clamp-3 group-hover:text-up transition-colors">
                {n.title}
              </h3>
            </div>
          </motion.a>
        ))}
      </div>

      <p className="text-[11px] text-ink-faint text-right">Sumber: cnbcindonesia.com · diperbarui otomatis</p>
    </div>
  )
}