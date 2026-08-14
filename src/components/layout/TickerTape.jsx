import { useMemo } from 'react'
import { useIHSG } from '../../hooks/useIHSG'
import { fmt, pct, viewStock } from '../ui/DashboardComponents'

export default function TickerTape({ stocks = [] }) {
  const { ihsg } = useIHSG()
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const movers = useMemo(() => {
    const up = data.filter(s => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 6)
    const down = data.filter(s => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 6)
    return [...up, ...down]
  }, [data])

  const ihsgItem = ihsg
    ? { name: 'IHSG', value: ihsg.price ?? 0, changePct: ihsg.change ?? 0 }
    : null

  const items = [
    ...(ihsgItem ? [ihsgItem] : []),
    ...movers.map(s => ({ name: s.ticker, value: s.price, changePct: s.changePct })),
  ]

  const loop = [...items, ...items]
  if (loop.length === 0) return null

  return (
    <div style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', height: 32 }}>
      <div className="ticker-inner" style={{ height: '100%', alignItems: 'center' }}>
        {loop.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: '1px solid var(--border)', height: '100%' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text2)', letterSpacing: '0.06em' }}>{it.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{Number.isInteger(it.value) ? it.value.toLocaleString('id-ID') : fmt(it.value)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: it.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(it.changePct)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
