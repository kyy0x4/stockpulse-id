import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import ScreenerFilters from '../components/screener/ScreenerFilters'
import ScreenerTable from '../components/screener/ScreenerTable'
import { Download } from 'lucide-react'

function exportCSV(stocks) {
  const header = ['Ticker', 'Nama', 'Sektor', 'Harga', 'Change %', 'Change Pts', 'Signal', 'Skor', 'RSI', 'Trend', 'PER', 'ROE', 'Growth']
  const rows = stocks.map((s) => [
    s.ticker,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.sector,
    s.price,
    s.change,
    s.change != null ? (s.price != null ? (s.price * s.change / 100).toFixed(2) : '') : '',
    s.signal,
    s.composite,
    s.technical.rsi ?? '',
    `"${s.technical.trend || ''}"`,
    s.fundamental.per ?? '',
    s.fundamental.roe ?? '',
    s.fundamental.growth != null ? `${s.fundamental.growth}%` : '',
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `stockpulse-screener-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ScreenerPage({ stocks, onSelectStock, onToggleFav, favorites }) {
  const [filters, setFilters] = useState({ query: '', sector: 'Semua', minScore: 0, signal: 'Semua' })

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (filters.query && !s.ticker.toLowerCase().includes(filters.query.toLowerCase()) && !s.name.toLowerCase().includes(filters.query.toLowerCase())) return false
      if (filters.sector !== 'Semua' && s.sector !== filters.sector) return false
      if (s.composite != null && s.composite < filters.minScore) return false
      if (filters.signal !== 'Semua' && s.signal !== filters.signal) return false
      return true
    }).sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
  }, [stocks, filters])

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold tracking-tight"
        >
          Stock <span className="text-gradient">Screener</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-sm text-ink-faint mt-1"
        >
          Saring semua saham Indonesia berdasarkan kriteria fundamental & teknikal
        </motion.p>
        <div className="mt-4">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink hover:border-ink/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      <ScreenerFilters onApply={setFilters} />
      <ScreenerTable stocks={filtered} onSelect={onSelectStock} onToggleFav={onToggleFav} favorites={favorites} />
    </div>
  )
}