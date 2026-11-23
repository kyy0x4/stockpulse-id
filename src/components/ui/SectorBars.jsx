import { pct } from './DashboardComponents'

export default function SectorBars({ name, change, count, up, down, showBreadth = true }) {
  const col = change >= 0 ? 'var(--up)' : 'var(--down)'
  const width = Math.min(100, Math.max(3, 50 + change * 14))
  return (
    <div className="sector-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span className="num" style={{ fontSize: 11, color: col, whiteSpace: 'nowrap' }}>{pct(change)}</span>
        </div>
        <div className="sbar-track" style={{ width: '100%' }}>
          <div className="sbar-fill" style={{ width: `${width}%`, background: col, opacity: 0.72 }} />
        </div>
      </div>
      {showBreadth && (
        <span className="num" style={{ fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {up}▲ {down}▼ · {count}
        </span>
      )}
    </div>
  )
}
