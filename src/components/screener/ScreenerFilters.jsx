import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../ui/Card'
import { SlidersHorizontal, RotateCcw, BookmarkPlus, Bookmark, Trash2, Filter, BarChart3 } from 'lucide-react'
import { api } from '../../api/client'

const DEFAULT_SECTORS = ['Semua', 'Technology', 'Communication Services', 'Consumer Cyclical', 'Consumer Defensive', 'Financials', 'Healthcare', 'Energy', 'Industrials', 'ETF', 'Kripto']

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
  const [presets, setPresets] = useState(loadPresets())
  const [sectors, setSectors] = useState(DEFAULT_SECTORS)

  useEffect(() => {
    let alive = true
    api.tickers()
      .then((res) => {
        if (!alive) return
        const list = res.sectors || []
        if (Array.isArray(list) && list.length) setSectors(['Semua', ...list])
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

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
          <SlidersHorizontal size={16} className="text-accent" />
          <h3 className="font-semibold text-sm">Filter Aset</h3>
        </div>

        <div className="space-y-3">
          {/* Search */}
          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">Cari Ticker / Nama</label>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); apply() }}
              placeholder="AAPL, BTC, SPY..."
              className="input-field"
            />
          </div>

          {/* Sector & Signal row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-faint mb-1.5 font-medium">Sektor</label>
              <select
                value={sector}
                onChange={(e) => { setSector(e.target.value); apply() }}
                className="select-field"
              >
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-ink-faint mb-1.5 font-medium">
                Signal <span className="text-ink ml-1">·</span>
              </label>
              <div className="btn-group">
                {['Semua', 'BUY', 'HOLD', 'SELL'].map((s) => (
                  <span
                    key={s}
                    onClick={() => { setSignal(s); apply() }}
                    className={`badge cursor-pointer ${
                      signal === s ? 'active' : ''
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Score slider */}
          <div>
            <label className="block text-xs text-ink-faint mb-1.5 font-medium">
              Min. Skor Total: <span className="text-accent font-mono">{minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); apply() }}
              className="range-slider"
            />
            <div className="flex justify-between text-xs text-ink-faint mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <AnimatePresence>
          {presets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-line"
            >
              <p className="text-xs text-ink-faint mb-2">Build Tersimpan:</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <span key={p.id} className="badge badge--neutral cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadPreset(p)}>
                    <Bookmark size={12} className="text-accent flex-shrink-0" />
                    <span>{p.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePreset(p.id) }}
                      className="text-ink-faint hover:text-down transition-colors"
                      aria-label="Hapus build"
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama build (cth: Bank murah)"
            className="input-field text-xs py-1.5"
            style={{ fontSize: '12px', padding: '8px 10px' }}
          />
          <button
            onClick={savePreset}
            className="badge badge--green hover:scale-105 transition-transform"
          >
            <BookmarkPlus size={12} />
            Simpan
          </button>

          <button
            onClick={reset}
            className="badge badge--neutral hover:scale-105 transition-transform"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </Card>
    </motion.div>
  )
}