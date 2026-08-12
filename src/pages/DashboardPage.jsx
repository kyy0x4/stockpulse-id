import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Activity, Layers, Loader2 } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import MarketChart from '../components/dashboard/MarketChart'
import StockTable from '../components/dashboard/StockTable'
import StockLogo from '../components/ui/StockLogo'
import { useIHSG } from '../hooks/useIHSG'

export default function DashboardPage({ stocks, loading, onSelectStock, onToggleFav, favorites }) {
  const { ihsg, loading: ihsgLoading } = useIHSG()
  const valid = (stocks || []).filter((s) => s.composite != null)
  const top = [...valid].sort((a, b) => b.composite - a.composite).slice(0, 8)
  const buys = valid.filter((s) => s.signal === 'BUY')

  const ihsgPositive = (ihsg?.change ?? 0) >= 0
  const stats = [
    {
      icon: TrendingUp,
      label: 'IHSG',
      value: ihsgLoading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 }),
      sub: ihsgLoading ? 'memuat data' : `${ihsgPositive ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`,
      positive: ihsgPositive,
    },
    { icon: Layers, label: 'Saham Dianalisa', value: loading ? '…' : valid.length, sub: 'Data real-time', positive: true },
    { icon: Activity, label: 'Signal BUY', value: loading ? '…' : buys.length, sub: 'Layak beli jangka panjang', positive: true },
    { icon: Wallet, label: 'Kandidat Baru', value: loading ? '…' : Math.max(0, buys.length - 1), sub: 'dari screener otomatis', positive: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold tracking-tight"
        >
          Market <span className="text-gradient">Overview</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-sm text-ink-faint mt-1"
        >
          Analisa fundamental & teknikal untuk investasi jangka panjang
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} delay={0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MarketChart />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {buys.slice(0, 2).map((s, i) => (
              <motion.div
                key={s.ticker}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.07, duration: 0.45 }}
              >
                <div
                  onClick={() => onSelectStock(s)}
                  className="glass rounded-2xl p-5 cursor-pointer hover:border-up/25 transition-colors h-full"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <StockLogo ticker={s.ticker} name={s.name} size="sm" logoUrl={s.logoUrl} />
                    <p className="text-xs text-ink-faint truncate">{s.name}</p>
                  </div>
                  <p className="font-mono text-xl font-bold tracking-tight">
                    {s.price != null ? s.price.toLocaleString('id-ID') : '—'}
                  </p>
                  <p className="font-mono text-xs text-up mt-0.5">
                    ▲ +{s.change ?? 0}% · Skor {s.composite}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="glass rounded-2xl p-5"
          >
            <p className="text-xs text-ink-faint mb-3">Sektor Terbaik</p>
            {(() => {
              const bySector = {}
              valid.forEach((s) => {
                const sec = s.sector || 'Lainnya'
                bySector[sec] = bySector[sec] || { count: 0, sum: 0 }
                bySector[sec].count += 1
                bySector[sec].sum += s.composite
              })
              const ranked = Object.entries(bySector)
                .map(([name, v]) => ({ name, avg: Math.round(v.sum / v.count), count: v.count }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 3)
              return ranked.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2 py-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-up/10 border border-up/15 font-mono text-[10px] text-up">
                    {i + 1}
                  </div>
                  <span className="text-sm text-ink/70">{r.name}</span>
                  <span className="ml-auto font-mono text-xs text-up">{r.avg} pts</span>
                </div>
              ))
            })()}
          </motion.div>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin text-up" />
          <p className="text-sm text-ink-soft font-mono">Mengambil data real dari market…</p>
        </div>
      ) : (
        <StockTable
          stocks={top}
          onSelect={onSelectStock}
          onToggleFav={onToggleFav}
          favorites={favorites}
        />
      )}
    </div>
  )
}
