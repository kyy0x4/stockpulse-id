
export const fmt = (n, d = 2) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
export const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

export function sigColor(s, theme) {
  const dark = { 'Strong Buy':'#c8ff00','Buy':'#70e080','Hold':'#f5a623','Sell':'#ff8040','Strong Sell':'#ff3b3b' }
  const light = { 'Strong Buy':'#4a7c00','Buy':'#1a7a30','Hold':'#9a6800','Sell':'#c04000','Strong Sell':'#c41e1e' }
  return (theme === 'dark' ? dark : light)[s]
}

export function sigBg(s) {
  const m = { 'Strong Buy':'rgba(200,255,0,0.08)','Buy':'rgba(112,224,128,0.07)','Hold':'rgba(245,166,35,0.08)','Sell':'rgba(255,128,64,0.08)','Strong Sell':'rgba(255,59,59,0.09)' }
  return m[s]
}

// ── Real-data helpers ─────────────────────────────────────
// Normalize backend signal (BUY/HOLD/SELL) ke label UI.
export function normSignal(sig) {
  const m = { BUY:'Buy', HOLD:'Hold', SELL:'Sell', 'STRONG BUY':'Strong Buy', 'STRONG SELL':'Strong Sell' }
  return m[String(sig || '').trim().toUpperCase()] || 'Hold'
}

// Bangun mini-sparkline (7 titik) dari harga & perubahan persen — visual only.
export function sparkline(s) {
  const price = s.price || s.close || 100
  const chg = (s.changePct ?? s.change ?? 0) / 100
  const base = price / (1 + chg)
  return Array.from({ length: 7 }, (_, i) => +(base * (1 + chg * (i / 6))).toFixed(0))
}

// Petakan saham (real: fundamental/technical = objek) → field UI lengkap.
export function viewStock(s) {
  const src = s && typeof s === 'object' ? s : {}
  const f = (typeof src.fundamental === 'object' && src.fundamental !== null) ? src.fundamental : {}
  const t = (typeof src.technical === 'object' && src.technical !== null) ? src.technical : {}
  const fundScore = f.score ?? src.fundScore ?? (typeof src.fundamental === 'number' ? src.fundamental : 0)
  const techScore = t.score ?? src.techScore ?? (typeof src.technical === 'number' ? src.technical : 0)
  const composite = src.composite ?? Math.round((fundScore + techScore) / 2)
  const signal = normSignal(src.signal)
  return {
    ...src,
    sector: src.sector || 'Lainnya',
    price: src.price ?? src.close ?? 0,
    changePct: src.changePct ?? src.change ?? 0,
    mktCap: src.mktCap ?? src.marketCap ?? null,
    volume: src.volume ?? null,
    signal,
    composite,
    sparkline: Array.isArray(src.sparkline) ? src.sparkline : sparkline(src),
    fundamental: {
      ...f,
      score: fundScore,
    },
    technical: {
      ...t,
      score: techScore,
    },
    fundScore,
    techScore,
    pe: f.per ?? src.pe ?? null,
    pbv: f.pbv ?? src.pbv ?? null,
    roe: f.roe ?? src.roe ?? null,
    der: f.der ?? src.der ?? null,
    growth: f.growth ?? null,
    rsi: t.rsi ?? null,
    trend: t.trend ?? null,
    macd: t.macd ?? null,
    volRatio: t.vol ?? t.vol_ratio ?? null,
    ema21: t.ema21 ?? null,
    ema34: t.ema34 ?? null,
    ema55: t.ema55 ?? null,
    ema21w: t.ema21w ?? null,
    ema34w: t.ema34w ?? null,
    ema55w: t.ema55w ?? null,
    emaCross: t.ema_cross ?? null,
    structure: t.structure ?? null,
  }
}

// SVG line chart untuk history harga / IHSG.
export function LineChart({ values, up, w = 560, h = 180, labels = null }) {
  if (!values || values.length < 2) {
    return <div style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)' }}>— BELUM ADA DATA —</div>
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const rng = max - min || 1
  const pad = 6
  const step = (w - pad * 2) / (values.length - 1)
  const pts = values.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - ((v - min) / rng) * (h - pad * 2)).toFixed(1)}`).join(' ')
  const col = up ? 'var(--up)' : 'var(--down)'
  const gid = `lc-${w}-${h}-${values.length}-${Math.round(min)}-${Math.round(max)}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block', width:'100%', height:'auto' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.18" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      {labels && (
        <text x={w - pad} y={h - 8} textAnchor="end" style={{ fontFamily:'var(--font-mono)', fontSize:9, fill:'var(--text3)' }}>{labels}</text>
      )}
    </svg>
  )
}

export function cap(n) {
  if (n == null || n === '') return null
  if (typeof n === 'number') {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} M`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
    return n.toLocaleString('id-ID')
  }
  return String(n)
}

export function vol(n) {
  if (n == null) return null
  if (typeof n === 'number') {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} M`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} Jt`
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)} rb`
    return String(n)
  }
  return String(n)
}

export function Spark({ data, up, w=72, h=28, fluid }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/rng)*h}`).join(' L ')
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block', flexShrink:0, ...(fluid ? { width:'100%', height:'auto' } : {}) }}>
      <path d={`M ${pts}`} fill="none" stroke={col} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  )
}

export function SBar({ v, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div className="sbar-track" style={{ overflow:'hidden' }}>
        <div className="sbar-fill" style={{ width:`${v}%`, background:color }} />
      </div>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text2)', minWidth:24 }}>{v}</span>
    </div>
  )
}

export function PH({ eyebrow, title }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', letterSpacing:'0.14em', marginBottom:6 }}>{eyebrow}</div>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:42, fontWeight:800, letterSpacing:'-0.03em', color:'var(--text)', lineHeight:1, margin:0 }}>{title}</h1>
    </div>
  )
}
