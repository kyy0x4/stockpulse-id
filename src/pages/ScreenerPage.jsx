import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import ScreenerFilters from '../components/screener/ScreenerFilters'
import ScreenerTable from '../components/screener/ScreenerTable'

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
      </div>

      <ScreenerFilters onApply={setFilters} />
      <ScreenerTable stocks={filtered} onSelect={onSelectStock} onToggleFav={onToggleFav} favorites={favorites} />
    </div>
  )
}