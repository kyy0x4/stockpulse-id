import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'

export default function MarketPage({ stocks }) {
  const valid = (stocks || []).filter((s) => s.composite != null)

  const sectorMap = {}
  valid.forEach((s) => {
    const sec = s.sector || 'Lainnya'
    sectorMap[sec] = sectorMap[sec] || { change: 0, count: 0 }
    sectorMap[sec].change += s.change ?? 0
    sectorMap[sec].count += 1
  })
  const sectors = Object.entries(sectorMap)
    .map(([name, v]) => ({ name, change: +(v.change / v.count).toFixed(2), stocks: v.count }))
    .sort((a, b) => b.change - a.change)

  const movers = [...valid]
    .filter((s) => s.change != null && s.price != null)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, 4)
  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold tracking-tight"
        >
          Market <span className="text-gradient">Pulse</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-sm text-ink-faint mt-1"
        >
          Gambaran pasar saham Indonesia secara keseluruhan
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-up" />
                <h3 className="font-semibold text-sm">Performa Sektor</h3>
              </div>
              <Badge tone="green" dot>Semua sektor</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectors.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.35 }}
                  className="flex items-center justify-between rounded-xl bg-card border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[10px] text-ink-faint">{s.stocks} emiten</p>
                  </div>
                  <span className={`flex items-center gap-1 font-mono text-sm font-semibold ${s.change >= 0 ? 'text-up' : 'text-down'}`}>
                    {s.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-info" />
              <h3 className="font-semibold text-sm">Top Gainers</h3>
            </div>
            <div className="space-y-3">
              {movers.map((m, i) => (
                <button
                  key={m.ticker}
                  className="w-full flex items-center justify-between rounded-xl bg-card border border-line px-4 py-3 text-left hover:bg-elevated transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-faint w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{m.ticker}</p>
                      <p className="text-[10px] text-ink-faint truncate max-w-[140px]">{m.name}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-sm font-semibold text-up">
                    <TrendingUp size={13} />+{m.change}%
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-info/10 to-indigo-500/5 border border-info/15 p-4">
              <p className="text-xs text-info/80 uppercase tracking-widest font-medium mb-1">Catatan</p>
              <p className="text-xs text-ink-soft leading-relaxed">
                Perhatikan volume dan trend jangka panjang sebelum mengejar gainer harian.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
