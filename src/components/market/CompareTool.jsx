import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { api } from '../../api/client'
import { usePalette } from '../../theme/ThemeProvider'
import StockLogo from '../ui/StockLogo'
import { X, GitCompareArrows, Loader2 } from 'lucide-react'

const COLORS = ['#22c55e', '#38bdf8', '#a78bfa', '#f59e0b', '#f472b6']

const PALETTE = {
  'green': '#22c55e',
  'blue': '#38bdf8',
  'violet': '#a78bfa',
  'amber': '#f59e0b',
  'pink': '#f472b6',
}

export default function CompareTool({ stocks, open, onClose }) {
  const p = usePalette()
  const [selected, setSelected] = useState([])
  const [series, setSeries] = useState({})
  const [loading, setLoading] = useState(false)
  const [colors, setColors] = useState({})

  useEffect(() => {
    if (!open) {
      setSelected([])
      setSeries({})
    }
  }, [open])

  useEffect(() => {
    if (selected.length < 2) return
    let alive = true
    setLoading(true)
    Promise.all(selected.map((t) => api.detail(t)))
      .then((details) => {
        if (!alive) return
        const hist = {}
        const col = {}
        details.forEach((d, i) => {
          hist[d.ticker] = d.history || []
          col[d.ticker] = PALETTE[['green', 'blue', 'violet', 'amber', 'pink'][i]] || COLORS[i]
        })
        setSeries(hist)
        setColors(col)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [selected, open])

  const chart = useMemo(() => {
    const tickers = Object.keys(series)
    if (!tickers.length) return []
    const len = Math.max(...tickers.map((t) => series[t].length))
    const rows = []
    for (let i = 0; i < len; i += 2) {
      const row = { label: '' }
      tickers.forEach((t) => {
        const h = series[t]
        const idx = i < h.length ? i : h.length - 1
        row[t] = h[idx]?.close
        if (!row.label) row.label = h[idx]?.date?.slice(5) || ''
      })
      rows.push(row)
    }
    return rows
  }, [series])

  const toggle = (ticker) => {
    setSelected((prev) => (prev.includes(ticker) ? prev.filter((t) => t !== ticker) : prev.length < 5 ? [...prev, ticker] : prev))
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-overlay/80 backdrop-blur-sm p-0 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-line-strong bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <GitCompareArrows size={16} className="text-info" />
                <h3 className="font-semibold">Compare Saham</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:text-ink hover:bg-elevated transition-colors cursor-pointer" aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-ink-faint mb-3">Pilih 2–5 saham untuk dibandingkan — overlay pergerakan harga 3 bulan terakhir.</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {stocks.slice(0, 20).map((s) => {
                  const active = selected.includes(s.ticker)
                  return (
                    <button
                      key={s.ticker}
                      onClick={() => toggle(s.ticker)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                        active ? 'border-up/40 bg-up/10 text-up' : 'border-line-strong text-ink-soft hover:border-ink/30 hover:text-ink'
                      }`}
                    >
                      <StockLogo ticker={s.ticker} name={s.name} size="sm" logoUrl={s.logoUrl} logoFallback={s.logoFallback} />
                      <span style={active ? { color: colors[s.ticker] } : undefined}>{s.ticker}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors[s.ticker] || '#22c55e' }} />}
                    </button>
                  )
                })}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-16 text-ink-faint">
                  <Loader2 size={18} className="animate-spin" /> membandingkan…
                </div>
              )}

              {!loading && selected.length < 2 && (
                <div className="py-16 text-center text-sm text-ink-faint">Pilih minimal 2 saham di atas.</div>
              )}

              {!loading && selected.length >= 2 && (
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={p.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: p.axis, fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} dy={6} />
                      <YAxis tick={{ fill: p.axis, fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} width={46} domain={['auto', 'auto']} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 12, fontFamily: 'Fira Code', fontSize: 11 }}
                        labelStyle={{ color: p.label }}
                      />
                      {Object.keys(series).map((t) => (
                        <Line key={t} type="monotone" dataKey={t} name={t} stroke={colors[t] || COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}