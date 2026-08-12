import { usePalette } from '../../theme/ThemeProvider'

export default function ScoreRing({ value, size = 56, stroke = 5 }) {
  const p = usePalette()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value / 100
  const color = value >= 75 ? p.up : value >= 60 ? p.warn : p.down

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <span className="absolute font-mono font-semibold" style={{ fontSize: size / 4.5 }}>
        {value}
      </span>
    </div>
  )
}
