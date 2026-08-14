import { useMemo } from 'react'
import { useIHSG } from '../hooks/useIHSG'
import { Spark, PH, pct, viewStock } from '../components/ui/DashboardComponents'

function Stat({ label, val, sub, color }) {
  return (
    <div className="bg-card" style={{ padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{sub}</div>
    </div>
  )
}

function SectorRow({ s }) {
  const col = s.avg >= 0 ? 'var(--up)' : 'var(--down)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: col }}>{pct(s.avg)}</span>
        </div>
        <div className="sbar-track" style={{ width: '100%' }}>
          <div className="sbar-fill" style={{ width: `${Math.min(100, Math.max(3, 50 + s.avg * 15))}%`, background: col, opacity: 0.6 }} />
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{s.up}▲ {s.down}▼ · {s.n}</span>
    </div>
  )
}

function FlowRow({ s, up }) {
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <div className="trow" style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Spark data={s.sparkline} up={up} w={44} h={20} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{s.ticker}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{s.name}</div>
      </div>
      <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: col }}>{pct(s.changePct)}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', minWidth: 50, textAlign: 'right' }}>{s.price.toLocaleString('id-ID')}</span>
    </div>
  )
}

export default function MarketPulsePage({ stocks = [] }) {
  const { ihsg, loading } = useIHSG()
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const withChange = data.filter((s) => s.changePct != null)
  const adv = withChange.filter((s) => s.changePct > 0).length
  const dec = withChange.filter((s) => s.changePct < 0).length
  const breadth = withChange.length ? Math.round(((adv - dec) / withChange.length) * 100) : 0
  const positive = (ihsg?.change ?? 0) >= 0

  const sectorMap = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
      if (!s.sector) return
      const g = m.get(s.sector) || { n: 0, up: 0, down: 0, sum: 0 }
      g.n += 1
      g.sum += s.changePct || 0
      if ((s.changePct || 0) > 0) g.up += 1
      if ((s.changePct || 0) < 0) g.down += 1
      m.set(s.sector, g)
    })
    return [...m.entries()]
      .map(([name, g]) => ({
        name,
        avg: g.n ? g.sum / g.n : 0,
        up: g.up,
        down: g.down,
        n: g.n,
      }))
      .sort((a, b) => b.avg - a.avg)
  }, [data])

  const gainers = [...withChange].filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 6)
  const losers = [...withChange].filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 6)
  const bestSector = sectorMap[0]

  const stats = [
    { label: 'IHSG', val: loading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 }), sub: loading ? 'memuat data real' : `${positive ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`, color: positive ? 'var(--up)' : 'var(--down)' },
    { label: 'BREADTH', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing minus declining', color: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
    { label: 'SAHAM NAIK', val: adv, sub: `${withChange.length ? Math.round((adv / withChange.length) * 100) : 0}% dari saham aktif`, color: 'var(--up)' },
    { label: 'SAHAM TURUN', val: dec, sub: `${withChange.length ? Math.round((dec / withChange.length) * 100) : 0}% dari saham aktif`, color: 'var(--down)' },
  ]

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="REAL-TIME MARKET FLOW" title="MARKET PULSE" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em' }}>
          DATA REAL DARI IHSG + SELURUH SAHAM YANG TAMPIL
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, background: 'var(--accent)', display: 'inline-block', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '0.12em' }}>
            {loading ? 'SYNCING DATA...' : 'LIVE MARKET READ'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4" style={{ marginBottom: 28 }}>
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="grid gap-px bg-line lg:grid-cols-[1.5fr_1fr]" style={{ marginBottom: 28 }}>
        <section className="bg-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em' }}>SEKTOR TERKUAT · RATA-RATA PERUBAHAN</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>{bestSector ? `${bestSector.name} TERKORELASI` : '—'}</div>
          </div>
          {sectorMap.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— BELUM ADA DATA —</div>}
          {sectorMap.slice(0, 8).map((s) => <SectorRow key={s.name} s={s} />)}
        </section>

        <aside className="grid gap-px bg-line">
          <div className="bg-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--up)', letterSpacing: '0.12em', marginBottom: 14 }}>TOP GAINERS · REAL MOVERS</div>
            {gainers.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— TIDAK ADA —</div>}
            {gainers.map((s) => <FlowRow key={s.ticker} s={s} up />)}
          </div>
          <div className="bg-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--down)', letterSpacing: '0.12em', marginBottom: 14 }}>TOP LOSERS · REAL MOVERS</div>
            {losers.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— TIDAK ADA —</div>}
            {losers.map((s) => <FlowRow key={s.ticker} s={s} up={false} />)}
          </div>
        </aside>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>
        BREADTH = ADVANCING − DECLINING · DIHITUNG DARI RATA-RATA PERUBAHAN SAHAM YANG TERSEDIA
      </div>
    </div>
  )
}