import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { SlidersHorizontal, RotateCcw, BookmarkPlus, Bookmark, Trash2 } from 'lucide-react'

const sectors = ['Semua', 'Perbankan', 'Konsumen', 'Tambang', 'Energi', 'Telekomunikasi', 'Infrastruktur', 'Industri', 'Teknologi']

const PRESETS_KEY = 'stockpulse-screener-presets'

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export default function ScreenerFilters({ onApply }) {
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('Semua')
  const [minScore, setMinScore] = useState(0)
  const [signal, setSignal] = useState('Semua')
  const [name, setName] = useState('')
  const [presets, setPresets] = useState(loadPresets)

  const apply = (extra = {}) => onApply({ query, sector, minScore, signal, ...extra })

  const reset = () => {
    setQuery('')
    setSector('Semua')
    setMinScore(0)
    setSignal('Semua')
    onApply({ query: '', sector: 'Semua', minScore: 0, signal: 'Semua' })
  }

  const savePreset = () => {
    const label = (name || `${sector} · Skor≥${minScore}`).trim()
    const entry = { id: `${Date.now()}`, label, sector, minScore, signal }
    const next = [entry, ...presets.filter((p) => !(p.sector === sector && p.minScore === minScore && p.signal === signal))]
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
    setName('')
  }

  const loadPreset = (p) => {
    setSector(p.sector)
    setMinScore(p.minScore)
    setSignal(p.signal)
    onApply({ query: '', sector: p.sector, minScore: p.minScore, signal: p.signal })
  }

  const deletePreset = (id) => {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-up" />
          <h3 className="font-semibold text-sm">Filter Saham</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">Cari Ticker / Nama</label>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); apply() }}
              placeholder="BBCA, Bank..."
              className="w-full rounded-xl bg-elevated border border-line-strong px-3.5 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:border-up/40 focus:ring-2 focus:ring-up/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">Sektor</label>
            <select
              value={sector}
              onChange={(e) => { setSector(e.target.value); apply() }}
              className="w-full rounded-xl bg-elevated border border-line-strong px-3.5 py-2 text-sm focus:outline-none focus:border-up/40 cursor-pointer"
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">
              Min. Skor Total: <span className="text-up font-mono">{minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); apply() }}
              className="w-full accent-up cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">Signal</label>
            <div className="flex gap-1.5">
              {['Semua', 'BUY', 'HOLD', 'SELL'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSignal(s); apply() }}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    signal === s
                      ? 'border-up/40 bg-up/10 text-up'
                      : 'border-line-strong text-ink-soft hover:text-ink hover:bg-elevated'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama build (cth: Bank murah)"
            className="w-48 rounded-xl bg-elevated border border-line-strong px-3.5 py-1.5 text-xs placeholder:text-ink-faint focus:outline-none focus:border-up/40"
          />
          <button
            onClick={savePreset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-up/10 border border-up/25 px-3 py-1.5 text-xs font-semibold text-up hover:bg-up/20 transition-colors cursor-pointer"
          >
            <BookmarkPlus size={13} /> Simpan Build
          </button>

          {presets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap ml-2 border-l border-line pl-3">
              {presets.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink-soft">
                  <button onClick={() => loadPreset(p)} className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer">
                    <Bookmark size={12} className="text-up" /> {p.label}
                  </button>
                  <button onClick={() => deletePreset(p.id)} className="text-ink-faint hover:text-down transition-colors cursor-pointer" aria-label="Hapus build">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Filter
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
