import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import StockLogo from '../components/ui/StockLogo'
import { TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, CandlestickChart, Database } from 'lucide-react'
import { useIHSG } from '../hooks/useIHSG'
import IHSGChart from '../components/charts/IHSGChart'
import CompareTool from '../components/market/CompareTool'
import { useState } from 'react'
import { GitCompareArrows } from 'lucide-react'

export default function MarketPage({ stocks }) {
  const { ihsg, loading: ihsgLoading } = useIHSG()
  const valid = (stocks || []).filter((s) => s.composite != null)
  const [compareOpen, setCompareOpen] = useState(false)

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

  const withPrice = [...valid].filter((s) => s.change != null && s.price != null)
  const gainers = [...withPrice].sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 5)
  const losers = [...withPrice].sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 5)

  const adv = withPrice.filter((s) => s.change > 0).length
  const dec = withPrice.filter((s) => s.change < 0).length
  const breadth = withPrice.length ? Math.round(((adv - dec) / withPrice.length) * 100) : 0
  const positive = (ihsg?.change ?? 0) >= 0

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

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-up/15 to-teal-500/10 border border-up/25 px-4 py-2 text-sm font-semibold text-up hover:bg-up/20 transition-all cursor-pointer"
          >
            <GitCompareArrows size={15} /> Bandingkan Saham
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'IHSG', value: ihsgLoading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 }), sub: ihsgLoading ? 'memuat' : `${positive ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`, positive },
          { label: 'Saham Naik', value: adv, sub: `${withPrice.length ? Math.round((adv / withPrice.length) * 100) : 0}% pasar`, positive: true },
          { label: 'Saham Turun', value: dec, sub: `${withPrice.length ? Math.round((dec / withPrice.length) * 100) : 0}% pasar`, positive: false },
          { label: 'Breadth', value: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', positive: breadth >= 0 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            className="glass rounded-2xl p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-ink-faint font-medium">{stat.label}</p>
            <p className={`mt-1 font-mono text-xl font-bold tracking-tight ${stat.positive ? 'text-up' : 'text-down'}`}>{stat.value}</p>
            <p className="text-[11px] text-ink-faint font-mono mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <CandlestickChart size={16} className="text-info" />
            <h3 className="font-semibold text-sm">Indeks Harga Saham Gabungan</h3>
            <Badge tone={positive ? 'green' : 'red'} dot>
              {positive ? '+' : ''}{(ihsg?.change ?? 0).toLocaleString('id-ID')}%
            </Badge>
          </div>
          <div className="h-[240px]">
            <IHSGChart history={ihsg?.history || []} />
          </div>
        </Card>

        <Card className="p-6 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-up" />
              <h3 className="font-semibold text-sm">Performa Sektor</h3>
            </div>
            <span className="text-[10px] text-ink-faint font-mono">avg % change</span>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {sectors.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl bg-card border border-line px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] text-ink-faint">{s.stocks} emiten</p>
                </div>
                <span className={`flex items-center gap-1 font-mono text-sm font-semibold ${s.change >= 0 ? 'text-up' : 'text-down'}`}>
                  {s.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {s.change >= 0 ? '+' : ''}{s.change}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 h-full">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={16} className="text-up" />
            <h3 className="font-semibold text-sm">Top Gainers</h3>
          </div>
          <MoversList movers={gainers} positive />
        </Card>
        <Card className="p-6 h-full">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight size={16} className="text-down" />
            <h3 className="font-semibold text-sm">Top Losers</h3>
          </div>
          <MoversList movers={losers} />
        </Card>
      </div>

      <VolumeBySector stocks={valid} />

      <CompareTool stocks={valid} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function VolumeBySector({ stocks }) {
  const bySector = {}
  stocks.forEach((s) => {
    const sec = s.sector || 'Lainnya'
    bySector[sec] = bySector[sec] || 0
    bySector[sec] += s.volume ?? 0
  })
  const rows = Object.entries(bySector)
    .map(([name, volume]) => ({ name, volume }))
    .sort((a, b) => b.volume - a.volume)
  const maxVol = Math.max(...rows.map((r) => r.volume), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
    >
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-info" />
          <h3 className="font-semibold text-sm">Volume Perdagangan per Sektor</h3>
          <span className="ml-auto text-[10px] text-ink-faint font-mono">total lot (harus lalu)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r, i) => (
            <div key={r.name} className="rounded-xl bg-card border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="font-mono text-xs text-ink-soft">
                  {(r.volume / 1e6 >= 1 ? `${(r.volume / 1e6).toFixed(1)}M` : `${(r.volume / 1e3).toFixed(0)}K`)}
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-elevated overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.volume / maxVol) * 100}%` }}
                  transition={{ delay: 0.35 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${r.volume === maxVol ? 'bg-gradient-to-r from-up to-teal-400' : 'bg-info/60'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

function MoversList({ movers, positive }) {
  return (
    <div className="space-y-2">
      {movers.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">Belum ada data.</p>}
      {movers.map((m) => (
        <div key={m.ticker} className="flex items-center gap-3 rounded-xl bg-card border border-line px-3.5 py-2.5">
          <StockLogo ticker={m.ticker} name={m.name} size="sm" logoUrl={m.logoUrl} logoFallback={m.logoFallback} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{m.ticker}</p>
            <p className="text-[10px] text-ink-faint truncate">{m.name}</p>
          </div>
          <div className="text-right">
            <p className={`flex items-center justify-end gap-1 font-mono text-sm font-semibold ${positive ? 'text-up' : 'text-down'}`}>
              {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {m.change >= 0 ? '+' : ''}{m.change}%
            </p>
            <p className="font-mono text-[10px] text-ink-faint">{m.price?.toLocaleString('id-ID')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}