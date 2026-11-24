import { useState, useEffect } from 'react'
import { getCachedLogoUrl, rememberLogo, forgetLogo } from '../../lib/logoCache'

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

const sizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-lg',
  lg: 'h-14 w-14 rounded-2xl',
}

const fonts = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-lg',
}

export default function StockLogo({ ticker, name, logoUrl, logoFallback, size = 'md', className = '' }) {
  const key = (ticker || name || 'X').toUpperCase()
  const palette = palettes[hashCode(key) % palettes.length]
  const initials = key.slice(0, 2)
  const label = name ? `${name} (${ticker})` : ticker
  const box = `${sizes[size] || sizes.md} ${className}`

  // 1. Cek cache dulu — kalau ada, pakai URL cache, jangan fetch lagi
  const [failed, setFailed] = useState(0)
  const [url, setUrl] = useState(() => {
    // Cek cache berdasarkan ticker (prioritas)
    const cached = getCachedLogoUrl(ticker)
    if (cached) return cached
    return logoUrl
  })

  // Update saat logoUrl berganti
  useEffect(() => {
    if (logoUrl) {
      const cached = getCachedLogoUrl(ticker)
      setUrl(cached || logoUrl)
    } else {
      setUrl(null)
    }
  }, [logoUrl, ticker])

  const hasFallback = Boolean(logoFallback)
  const keepTrying = failed === 0 || (hasFallback && failed === 1)

  if (url && keepTrying) {
    return (
      <div className={`flex shrink-0 items-center justify-center bg-white ${box}`}>
        <img
          key={failed === 0 ? 'primary' : 'fallback'}
          src={url}
          alt={label}
          title={label}
          loading="lazy"
          draggable={false}
          onLoad={() => {
            if (url && ticker) rememberLogo(ticker, url, true)
          }}
          onError={() => {
            if (url && ticker) forgetLogo(ticker)
            setFailed((f) => f + 1)
          }}
          className="h-[62%] w-[62%] object-contain"
        />
      </div>
    )
  }

  return (
    <div
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center font-mono font-bold text-white ${fonts[size] || fonts.md} ${box}`}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        boxShadow: `0 4px 14px -4px ${palette.from}66`,
      }}
    >
      {initials}
    </div>
  )
}