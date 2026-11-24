import { useMemo, useState } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Spark, pct, viewStock, fmtPrice, PriceChart } from '../components/ui/DashboardComponents'
import { Activity, Layers, TrendingUp, TrendingDown } from 'lucide-react'
import StockLogo from '../components/ui/StockLogo'

const MARKET_ASSETS = [
  { code: 'SPX', label: 'S&P 500' },
  { code: 'IXIC', label: 'Nasdaq' },
  { code: 'DJI', label: 'Dow Jones' },
  { code: 'BTC', label: 'Bitcoin' },
  { code: 'ETH', label: 'Ethereum' },
]

export default function MarketPage({ onSelectStock, stocks = [] }) {
  const [code, setCode] = useState('SPX')
  const { index, loading: indexLoading } = useMarketIndex(code)
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const sectorPerf = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
      if (!s.sector) return
      const g = m.get(s.sector) || { change: 0, n: 0, adv: 0 }
      g.change += s.changePct
      g.n += 1
      g.adv += s.changePct > 0 ? 1 : 0
      m.set(s.sector, g)
    })
    return [...m.entries()]
      .map(([name, g]) => ({ name, change: +(g.change / g.n).toFixed(2), stocks: g.n, advDec: `${g.adv}/${g.n - g.adv}` }))
      .sort((a, b) => b.change - a.change)
  }, [data])

  const withPrice = data.filter((s) => s.changePct != null)
  const adv = withPrice.filter((s) => s.changePct > 0).length
  const dec = withPrice.filter((s) => s.changePct < 0).length
  const breadth = withPrice.length ? Math.round(((adv - dec) / withPrice.length) * 100) : 0
  const indexPos = (index?.change ?? 0) >= 0
  const indexHistory = (index?.history || []).slice(-60)

  const gainers = withPrice.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5)
  const losers = withPrice.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5)

  const stats = [
    {
      label: index?.name || code,
      val: indexLoading ? '…' : (index?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 }),
      sub: indexLoading ? 'memuat…' : `${indexPos ? '+' : ''}${(index?.change ?? 0).toFixed(2)}% hari ini`,
      c: indexPos ? 'var(--up)' : 'var(--down)',
    },
    { label: 'Aset Naik', val: adv, sub: `${withPrice.length ? Math.round((adv / withPrice.length) * 100) : 0}% universe`, c: 'var(--up)' },
    { label: 'Aset Turun', val: dec, sub: `${withPrice.length ? Math.round((dec / withPrice.length) * 100) : 0}% universe`, c: 'var(--down)' },
    { label: 'Breadth', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', c: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
  ]

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <div className="page-head-eyebrow">Pasar global · Saham AS &amp; Kripto</div>
          <h1 className="page-head-title">Market Overview</h1>
          <p className="page-head-sub">Ringkasan indeks, breadth, dan rotasi sektor.</p>
        </div>
        <span className="tag tag-green tag-dot">Live</span>
      </div>

      <div className="tabstrip">
        {MARKET_ASSETS.map((a) => (
          <button key={a.code} className={`tabstrip-tab ${code === a.code ? 'active' : ''}`} onClick={() => setCode(a.code)}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="stat-grid">
        {stats.map((x) => (
          <div key={x.label} className="stat-card" style={{ '--stat-accent': x.c }}>
            <div className="stat-label">{x.label}</div>
            <div className="stat-value" style={{ color: x.c }}>{x.val}</div>
            <div className="stat-sub">{x.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2.5fr) minmax(0, 1fr)', marginBottom: 16 }}>
        <div className="cg-card">
          <div className="cg-card-head">
            <Activity size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="cg-card-title">{index?.name || code}</div>
              <div className="cg-card-sub">60 sesi terakhir</div>
            </div>
            <span className={`tag ${indexPos ? 'tag-green' : 'tag-red'}`} style={{ marginLeft: 'auto' }}>
              {indexLoading ? '…' : `${indexPos ? '+' : ''}${(index?.change ?? 0).toFixed(2)}%`}
            </span>
          </div>
          <div style={{ padding: '10px 16px 16px' }}>
            {indexHistory.length >= 2 ? (
              <PriceChart rows={indexHistory} height={400} />
            ) : (
              <div className="empty-state">— memuat data indeks —</div>
            )}
          </div>
        </div>

        <div className="cg-card">
          <div className="cg-card-head">
            <Layers size={15} style={{ color: 'var(--accent)' }} />
            <div className="cg-card-title">Performa Sektor</div>
            <span className="cg-card-sub" style={{ marginLeft: 'auto' }}>avg %</span>
          </div>
          <div style={{ padding: '6px 16px 14px', maxHeight: 360, overflowY: 'auto' }}>
            {sectorPerf.length === 0 && <div className="empty-state" style={{ padding: 24 }}>— belum ada data —</div>}
            {sectorPerf.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span className="num" style={{ fontSize: 11, color: s.change >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.change)}</span>
                  </div>
                  <div className="sbar-track" style={{ width: '100%' }}>
                    <div className="sbar-fill" style={{ width: `${Math.min(100, Math.max(3, 50 + s.change * 12))}%`, background: s.change >= 0 ? 'var(--up)' : 'var(--down)', opacity: 0.75 }} />
                  </div>
                </div>
                <span className="num" style={{ fontSize: 9, color: 'var(--text3)', width: 16, textAlign: 'right' }}>{s.stocks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {[
          { key: 'gainers', label: 'Top Gainers', list: gainers, color: 'var(--up)', icon: TrendingUp },
          { key: 'losers', label: 'Top Losers', list: losers, color: 'var(--down)', icon: TrendingDown },
        ].map((block) => {
          const Icon = block.icon
          return (
            <div key={block.key} className="cg-card">
              <div className="cg-card-head">
                <Icon size={15} style={{ color: block.color }} />
                <div className="cg-card-title">{block.label}</div>
              </div>
              <div style={{ padding: '4px 12px 10px' }}>
                {block.list.length === 0 && <div className="empty-state" style={{ padding: 24 }}>— tidak ada —</div>}
                {block.list.map((s) => (
                  <div
                    key={s.ticker}
                    onClick={() => onSelectStock?.(s)}
                    className="hoverable"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px', margin: '0 -6px', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <Spark data={s.sparkline} up={block.key === 'gainers'} w={40} h={20} />
                    <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cell-sym">{s.ticker}</div>
                      <div className="cell-name">{s.sector}</div>
                    </div>
                    <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: block.color }}>{pct(s.changePct)}</span>
                    <span className="num" style={{ fontSize: 11, color: 'var(--text2)', minWidth: 66, textAlign: 'right' }}>{fmtPrice(s.price, s.kind)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
