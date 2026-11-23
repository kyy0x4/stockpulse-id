import { pct } from './DashboardComponents'

export default function FlowRow({ s, up, onSelect }) {
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <div
      className="hoverable"
      onClick={() => onSelect?.(s)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px', margin: '0 -6px', borderRadius: 8, cursor: 'pointer' }}
    >
      <span className="hide-sm">
        <span style={{ display: 'inline-block', width: 40, height: 18, background: 'var(--bg3)', borderRadius: 3, marginRight: 6 }}>
          <svg viewBox={`0 0 40 18`} style={{ width: '100%', height: '100%' }}>
            <path d={`M0,13 L${s.sparkline?.join(' L ') ?? '0 9 L 0 17'} Z`} fill={col} opacity={0.35} />
            <path d={s.sparkline?.join(' L ') ?? ''} fill="none" stroke={col} strokeWidth="1.5" />
          </svg>
        </span>
      </span>
      <span className="cell-sym">{s.ticker}</span>
      <span className="cell-name">{s.sector || s.name}</span>
      <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: col }}>{pct(s.changePct)}</span>
    </div>
  )
}