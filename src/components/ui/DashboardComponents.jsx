
import { useEffect, useRef, useMemo } from 'react'
import { createChart, LineSeries } from 'lightweight-charts'
import { useTheme } from '../../theme/ThemeProvider'

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

// Price chart via TradingView Lightweight Charts (line series).
// rows: [{ date: 'YYYY-MM-DD' | number (ms|s) | Date, close: number }]
// Props:
// - rows: array data history
// - height: tinggi chart (default 260)
// - range: period filter (mis '1mo', '3mo', '6mo', '1y', '5y') — memfilter rows
// - followTheme: boolean — kalau true, chart warna adaptif sesuai tema (light/dark)
export function PriceChart({ rows, height = 260, range = null, followTheme = true }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const { isDark } = useTheme()

  // Filter rows berdasarkan range — ambil N data terbaru (bukan filter tanggal)
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const daysMap = { '1mo': 21, '3mo': 63, '6mo': 126, '1y': 252, '2y': 504, '3y': 756, '5y': 1260 }
    if (!range || range === 'all') return rows
    const n = daysMap[range] || daysMap['3mo']
    return rows.slice(-n)
  }, [rows, range])

  const dataKey = JSON.stringify((filteredRows || []).map((r) => [r?.date, r?.close]))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const H = height || 260
    const theme = followTheme ? (isDark ? 'dark' : 'light') : 'dark'

    // Warna tema — DARK: navy bg, cyan text, turquoise line
    // Warna tema — LIGHT: white bg, navy text, cyan line
    const palette = theme === 'dark'
      ? {
          bg: '#030D1E',
          text: '#8CA6D9',
          grid: 'rgba(42, 58, 82, 0.5)',
          line: '#22E3D5',
          crosshair: '#22E3D5',
          labelBg: '#1A2638',
          border: '#2A3A52',
        }
      : {
          bg: '#FBFBFB',
          text: '#030D1E',
          grid: 'rgba(240, 244, 255, 0.5)',
          line: '#0783F7',
          crosshair: '#0DC4E9',
          labelBg: '#ffffff',
          border: '#D1D9E8',
        }

    const chart = createChart(container, {
      width: container.clientWidth || 640,
      height: H,
      layout: {
        background: { type: 'Solid', color: palette.bg },
        textColor: palette.text,
        fontSize: 10,
        fontFamily: 'DM Mono, monospace',
      },
      grid: {
        vertLines: { color: palette.grid, style: 1 },
        horzLines: { color: palette.grid, style: 1 },
      },
      crosshair: {
        mode: 'magnet',
        vertLine: { color: palette.crosshair, labelBackgroundColor: palette.labelBg },
        horzLine: { color: palette.crosshair, labelBackgroundColor: palette.labelBg },
      },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border, timeVisible: true },
    })

    const series = chart.addSeries(LineSeries, {
      color: palette.line,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    })
    chartRef.current = chart

    const data = (filteredRows || [])
      .filter((r) => r && r.close != null)
      .map((r) => {
        let d
        const raw = r.date
        if (raw instanceof Date) d = raw
        else if (typeof raw === 'number') d = new Date(raw < 1e12 ? raw * 1000 : raw)
        else d = new Date(String(raw).length === 10 ? `${raw}T00:00:00` : String(raw))
        const t = Math.floor(d.getTime() / 1000)
        if (Number.isNaN(t)) return null
        return { time: t, value: Number(r.close) }
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time)

    series.setData(data)

    const ro = new ResizeObserver(() => {
      chart.resize(container.clientWidth, H)
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [dataKey, height, isDark, followTheme])

  return <div ref={containerRef} style={{ width: '100%', height: height || 260, minHeight: 120 }} />
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
