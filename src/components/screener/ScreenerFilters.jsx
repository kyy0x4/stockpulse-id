import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'

const sectors = ['Semua', 'Perbankan', 'Konsumen', 'Tambang', 'Energi', 'Telekomunikasi', 'Infrastruktur', 'Industri', 'Teknologi']

export default function ScreenerFilters({ onApply }) {
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('Semua')
  const [minScore, setMinScore] = useState(0)
  const [signal, setSignal] = useState('Semua')

  const apply = () => onApply({ query, sector, minScore, signal })

  const reset = () => {
    setQuery('')
    setSector('Semua')
    setMinScore(0)
    setSignal('Semua')
    onApply({ query: '', sector: 'Semua', minScore: 0, signal: 'Semua' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-sm">Filter Saham</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Cari Ticker / Nama</label>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); apply() }}
              placeholder="BBCA, Bank..."
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Sektor</label>
            <select
              value={sector}
              onChange={(e) => { setSector(e.target.value); apply() }}
              className="w-full rounded-xl bg-[#0b1526] border border-white/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500/40 cursor-pointer"
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">
              Min. Skor Total: <span className="text-emerald-400 font-mono">{minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); apply() }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Signal</label>
            <div className="flex gap-1.5">
              {['Semua', 'BUY', 'HOLD', 'SELL'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSignal(s); apply() }}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    signal === s
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Filter
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
