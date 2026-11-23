import { usePalette } from '../../theme/ThemeProvider'

export default function ScoreRing({ value, size = 42, stroke = 4 }) {
  const p = usePalette()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value / 100
  
  // CoinGlass-style colors
  let color
  if (value >= 80) color = '#00ff88'
  else if (value >= 70) color = '#00ff88'
  else if (value >= 60) color = '#ffa500'
  else if (value >= 50) color = '#ffa500'
  else color = '#ff4757'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke="#252529" 
          strokeWidth={stroke} 
          opacity={0.3}
        />
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
          style={{ 
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            filter: 'drop-shadow(0 0 8px rgba(255, 191, 0, 0.2))'
          }}
        />
      </svg>
      <span className="absolute font-mono font-bold" style={{ fontSize: size / 2.2 }}>
        {value}
      </span>
    </div>
  )
}