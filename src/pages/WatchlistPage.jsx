import { motion, AnimatePresence } from 'framer-motion'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ScoreRing from '../components/ui/ScoreRing'
import StockLogo from '../components/ui/StockLogo'
import { Star, Bell, TrendingUp, TrendingDown } from 'lucide-react'

export default function WatchlistPage({ favorites, stocks, onSelectStock, onToggleFav }) {
  const list = favorites.map((t) => stocks.find((s) => s.ticker === t)).filter(Boolean)

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
            {list.length} saham dipantau · alert harga & perubahan signal
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
            {list.map((s, i) => (
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
                    <button
                      className="rounded-xl border border-line-strong bg-card px-3 py-2 text-ink-soft hover:text-ink transition-colors cursor-pointer"
                      aria-label="Set alert harga"
                    >
                      <Bell size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
