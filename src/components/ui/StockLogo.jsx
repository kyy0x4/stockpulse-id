const palettes = [
  { from: '#059669', to: '#34d399' },
  { from: '#2563eb', to: '#38bdf8' },
  { from: '#7c3aed', to: '#d946ef' },
  { from: '#ea580c', to: '#fbbf24' },
  { from: '#0d9488', to: '#2dd4bf' },
  { from: '#dc2626', to: '#fb923c' },
  { from: '#4f46e5', to: '#a78bfa' },
  { from: '#0369a1', to: '#22d3ee' },
  { from: '#be123c', to: '#f472b6' },
  { from: '#166534', to: '#4ade80' },
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export default function StockLogo({ ticker, name, size = 'md', className = '' }) {
  const key = (ticker || name || 'X').toUpperCase()
  const palette = palettes[hashCode(key) % palettes.length]
  const initials = key.slice(0, 2)
  const label = name ? `${name} (${ticker})` : ticker

  const sizes = {
    sm: 'h-8 w-8 rounded-lg text-[11px]',
    md: 'h-9 w-9 rounded-lg text-xs',
    lg: 'h-14 w-14 rounded-2xl text-lg',
  }

  return (
    <div
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center font-mono font-bold text-white shadow-lg ${sizes[size] || sizes.md} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        boxShadow: `0 4px 14px -4px ${palette.from}66`,
      }}
    >
      {initials}
    </div>
  )
}
