import { useMemo } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Spark, PH, pct, viewStock, fmtPrice } from '../components/ui/DashboardComponents'
import SectorBars from '../components/ui/SectorBars'
import StockLogo from '../components/ui/StockLogo'
import { Activity, Layers, TrendingDown, TrendingUp } from 'lucide-react'

function FlowRow({ s, up, onSelect }) {
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <div
      className="hoverable"
      onClick={() => onSelect?.(s)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', margin: '0 -8px', borderRadius: 8, cursor: 'pointer' }}
    >
      <Spark data={s.sparkline} up={up} w={40} h={20} />
      <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="cell-sym">{s.ticker}</div>
        <div className="cell-name">{s.sector || s.name}</div>
      </div>
      <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: col }}>{pct(s.changePct)}</span>
      <span className="num" style={{ fontSize: 11, color: 'var(--text2)', minWidth: 68, textAlign: 'right' }}>{fmtPrice(s.price, s.kind)}</span>
    </div>
  )
}

export default function MarketPulsePage({ stocks = [], onSelectStock }) {
  const { index: spx, loading } = useMarketIndex('SPX')
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const withChange = data.filter((s) => s.changePct != null)
  const adv = withChange.filter((s) => s.changePct > 0).length
  const dec = withChange.filter((s) => s.changePct < 0).length
  const breadth = withChange.length ? Math.round(((adv - dec) / withChange.length) * 100) : 0
  const positive = (spx?.change ?? 0) >= 0

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
      .map(([name, g]) => ({ name, avg: g.n ? g.sum / g.n : 0, up: g.up, down: g.down, n: g.n }))
      .sort((a, b) => b.avg - a.avg)
  }, [data])

  const gainers = [...withChange].filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 6)
  const losers = [...withChange].filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 6)
  const bestSector = sectorMap[0]

  const stats = [
    { label: 'S&P 500', val: loading ? '…' : (spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 }), sub: loading ? 'memuat data real' : `${positive ? '+' : ''}${(spx?.change ?? 0).toLocaleString('en-US')}% hari ini`, c: positive ? 'var(--up)' : 'var(--down)' },
    { label: 'Breadth', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', c: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
    { label: 'Aset Naik', val: adv, sub: `${withChange.length ? Math.round((adv / withChange.length) * 100) : 0}% dari aset aktif`, c: 'var(--up)' },
    { label: 'Aset Turun', val: dec, sub: `${withChange.length ? Math.round((dec / withChange.length) * 100) : 0}% dari aset aktif`, c: 'var(--down)' },
  ]

  return (
    <div className="fade-up">
      <PH eyebrow="Real-time global market flow" title="Market Pulse" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Data real dari S&amp;P 500 dan seluruh aset yang tampil.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {loading ? 'Syncing data…' : 'Live market read'}
          </span>
        </span>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-accent': s.c }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.c }}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }} className="dash-grid">
        <section className="cg-card">
          <div className="cg-card-head">
            <Layers size={15} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="cg-card-title">Sektor Terkuat</div>
              <div className="cg-card-sub">{bestSector ? `${bestSector.name} terkorelasi` : 'rata-rata perubahan'}</div>
            </div>
            <span className="tag tag-accent" style={{ marginLeft: 'auto' }}>avg %</span>
          </div>
          <div style={{ padding: '4px 16px 14px' }}>
            {sectorMap.length === 0 && <div className="empty-state" style={{ padding: 24 }}>— belum ada data —</div>}
            {sectorMap.slice(0, 8).map((s) => (
              <SectorBars key={s.name} name={s.name} change={s.avg} count={s.n} up={s.up} down={s.down} />
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gap: 16 }}>
          <section className="cg-card">
            <div className="cg-card-head">
              <TrendingUp size={15} style={{ color: 'var(--up)' }} />
              <div className="cg-card-title">Top Gainers</div>
              <span className="cg-card-sub" style={{ marginLeft: 'auto' }}>real movers</span>
            </div>
            <div style={{ padding: '4px 16px 12px' }}>
              {gainers.length === 0 && <div className="empty-state" style={{ padding: 20 }}>— tidak ada —</div>}
              {gainers.map((s) => <FlowRow key={s.ticker} s={s} up onSelect={onSelectStock} />)}
            </div>
          </section>

          <section className="cg-card">
            <div className="cg-card-head">
              <TrendingDown size={15} style={{ color: 'var(--down)' }} />
              <div className="cg-card-title">Top Losers</div>
              <span className="cg-card-sub" style={{ marginLeft: 'auto' }}>real movers</span>
            </div>
            <div style={{ padding: '4px 16px 12px' }}>
              {losers.length === 0 && <div className="empty-state" style={{ padding: 20 }}>— tidak ada —</div>}
              {losers.map((s) => <FlowRow key={s.ticker} s={s} up={false} onSelect={onSelectStock} />)}
            </div>
          </section>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.05em' }}>
        <Activity size={10} />
        BREADTH = ADVANCING − DECLINING · DIHITUNG DARI RATA-RATA PERUBAHAN ASET YANG TERSEDIA
      </div>
    </div>
  )
}
