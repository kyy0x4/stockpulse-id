
export const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

// Format harga untuk universe baru (USD). Kripto kecil butuh lebih banyak desimal.
export function fmtPrice(n, kind = 'us_stock') {
  if (n == null || Number.isNaN(Number(n))) return '—'
  const v = Number(n)
  const digits = kind === 'crypto' && v < 1 ? 4 : v < 100 ? 2 : 2
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function kindLabel(kind) {
  return { crypto: 'KRIPTO', us_stock: 'SAHAM AS', etf: 'ETF', index: 'INDEKS' }[kind] || 'ASET'
}

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
  const kind = src.kind || 'us_stock'
  return {
    ...src,
    kind,
    currency: src.currency || 'USD',
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
    rating: f.rating ?? null,
    pillars: f.pillars ?? null,
    components: f.components ?? null,
    return30d: f.return_30d ?? null,
    return90d: f.return_90d ?? null,
    return1y: f.return_1y ?? null,
    drawdown52w: f.drawdown_52w ?? null,
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

// Price chart dengan sumbu harga & tanggal (dipakai di detail aset dan Market).
export function PriceChart({ rows, height = 260 }) {
  const pts = (rows || []).filter((r) => r && r.close != null)
  if (pts.length < 2) return null

  const W = 960
  const H = height
  const padL = 58
  const padR = 14
  const padT = 14
  const padB = 26

  const vals = pts.map((r) => Number(r.close))
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  const span = max - min || Math.abs(max) * 0.02 || 1
  min -= span * 0.08
  max += span * 0.08
  const rng = max - min || 1

  const x = (i) => padL + (i / (pts.length - 1)) * (W - padL - padR)
  const y = (v) => padT + (1 - (v - min) / rng) * (H - padT - padB)
  const up = vals[vals.length - 1] >= vals[0]
  const col = up ? 'var(--up)' : 'var(--down)'
  const gid = `pc-${pts.length}-${Math.round(min * 100)}-${Math.round(max * 100)}`

  const line = pts.map((r, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(Number(r.close)).toFixed(1)}`).join(' ')

  const fmtAxis = (v) => (v >= 1000 ? Math.round(v).toLocaleString('en-US') : v >= 10 ? v.toFixed(1) : v.toFixed(2))
  const asDate = (v) => {
    if (v == null) return null
    let d
    if (typeof v === 'number') d = new Date(v < 1e12 ? v * 1000 : v)
    else d = new Date(String(v).length === 10 ? `${v}T00:00:00` : String(v))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const firstD = asDate(pts[0].date)
  const lastD = asDate(pts[pts.length - 1].date)
  const spanDays = firstD && lastD ? Math.abs(lastD - firstD) / 86400000 : 0
  const longRange = spanDays > 300
  const fmtDate = (v) => {
    const d = asDate(v)
    if (!d) return String(v ?? '')
    return longRange
      ? d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const yTicks = Array.from({ length: 5 }, (_, i) => min + (rng * i) / 4)
  const xIdx = [0, Math.round((pts.length - 1) / 3), Math.round(((pts.length - 1) * 2) / 3), pts.length - 1]
  const last = vals[vals.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.22" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 4" strokeWidth="1" opacity="0.75" />
          <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--text3)" fontFamily="var(--font-mono)">{fmtAxis(v)}</text>
        </g>
      ))}

      <polygon points={`${padL},${H - padB} ${pts.map((r, i) => `${x(i).toFixed(1)},${y(Number(r.close)).toFixed(1)}`).join(' ')} ${W - padR},${H - padB}`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

      <line x1={padL} x2={W - padR} y1={y(last)} y2={y(last)} stroke={col} strokeDasharray="2 5" strokeWidth="1" opacity="0.45" />
      <circle cx={x(pts.length - 1)} cy={y(last)} r="3.5" fill={col} stroke="var(--bg2)" strokeWidth="1.5" />

      {[...new Set(xIdx)].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}
          fontSize="10"
          fill="var(--text3)"
          fontFamily="var(--font-mono)"
        >
          {fmtDate(pts[i].date)}
        </text>
      ))}
    </svg>
  )
}

export function cap(n) {
  if (n == null || n === '') return null
  if (typeof n === 'number') {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
    return n.toLocaleString('en-US')
  }
  return String(n)
}

export function vol(n) {
  if (n == null) return null
  if (typeof n === 'number') {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)} K`
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
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', marginBottom: 6, textTransform: 'uppercase' }}>
        {eyebrow}
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: 'var(--text)',
        lineHeight: 1.15,
        margin: 0,
      }}>
        {title}
      </h1>
    </div>
  )
}
