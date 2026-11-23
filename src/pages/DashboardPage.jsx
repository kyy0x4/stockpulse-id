import { useMemo } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Star, TrendingUp, Layers, Target, Flame, Trophy } from 'lucide-react'
import { Spark, pct, cap, fmtPrice, viewStock } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'

export default function DashboardPage({ onSelectStock, onToggleFav, favorites = [], stocks = [] }) {
  const { index: spx } = useMarketIndex('SPX')
  const { index: btc } = useMarketIndex('BTC')
  const data = useMemo(() => stocks.map(viewStock).filter((s) => s.composite != null), [stocks])

  const recs = useMemo(() => [...data].sort((a, b) => b.composite - a.composite).slice(0, 9), [data])
  const buys = data.filter((s) => s.signal === 'Buy' || s.signal === 'Strong Buy')
  const gainers = useMemo(
    () => [...data].filter((s) => (s.changePct ?? 0) > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    [data],
  )

  const bestSector = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
      if (!s.sector) return
      const g = m.get(s.sector) || { sum: 0, n: 0 }
      g.sum += s.composite
      g.n += 1
      m.set(s.sector, g)
    })
    return [...m.entries()]
      .map(([name, g]) => ({ name, avg: Math.round(g.sum / g.n), n: g.n }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
  }, [data])

  const spxPos = (spx?.change ?? 0) >= 0
  const btcPos = (btc?.change ?? 0) >= 0
  const avgScore = data.length ? Math.round(data.reduce((a, s) => a + s.composite, 0) / data.length) : 0

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <div className="page-head-eyebrow">Real-time · US Stock · ETF · Crypto</div>
          <h1 className="page-head-title">Market Dashboard</h1>
          <p className="page-head-sub">Ringkasan pasar dan kandidat terkuat berdasarkan skor composite.</p>
        </div>
        <span className="tag tag-green tag-dot">Live</span>
      </div>

      <div className="stat-grid">
        <StatCard
          label="S&P 500"
          value={(spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          sub={<span style={{ color: spxPos ? 'var(--up)' : 'var(--down)' }}>{spxPos ? '+' : ''}{(spx?.change ?? 0).toFixed(2)}% hari ini</span>}
          icon={<TrendingUp size={13} />}
          accent={spxPos ? 'var(--up)' : 'var(--down)'}
        />
        <StatCard
          label="Bitcoin"
          value={btc?.price ? `$${(btc.price).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          sub={<span style={{ color: btcPos ? 'var(--up)' : 'var(--down)' }}>{btcPos ? '+' : ''}{(btc?.change ?? 0).toFixed(2)}% 24 jam</span>}
          icon={<Flame size={13} />}
          accent={btcPos ? 'var(--up)' : 'var(--down)'}
        />
        <StatCard label="Aset Dianalisa" value={data.length} sub="saham AS · ETF · kripto" icon={<Layers size={13} />} accent="var(--accent)" />
        <StatCard label="Sinyal Buy" value={buys.length} sub={`rata-rata skor ${avgScore}`} icon={<Target size={13} />} accent="var(--accent)" valueColor="var(--up)" />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.9fr) minmax(0, 1fr)' }} className="dash-grid">
        {/* Top composite table */}
        <div className="table-shell">
          <div className="cg-card-head">
            <Trophy size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="cg-card-title">Rekomendasi Teratas</div>
              <div className="cg-card-sub">Skor composite tertinggi hari ini</div>
            </div>
            <span className="tag tag-accent" style={{ marginLeft: 'auto' }}>{recs.length} aset</span>
          </div>
          <div className="table-scroll" style={{ maxHeight: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="l dash-asset-col">Aset</th>
                  <th>Harga</th>
                  <th>24h %</th>
                  <th className="hide-sm">Kap.</th>
                  <th className="c hide-sm">Skor</th>
                  <th className="c hide-sm">Signal</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {recs.map((s) => {
                  const isFav = favorites.includes(s.ticker)
                  const up = (s.changePct ?? 0) >= 0
                  return (
                    <tr key={s.ticker} onClick={() => onSelectStock?.(s)}>
                      <td className="l">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="hide-sm" style={{ display: 'inline-flex' }}>
                            <Spark data={s.sparkline} up={up} w={40} h={20} />
                          </span>
                          <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-sym">{s.ticker}</div>
                            <div className="cell-name">{s.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num t-strong">{fmtPrice(s.price, s.kind)}</td>
                      <td className="num" style={{ color: up ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>{pct(s.changePct)}</td>
                      <td className="num t-soft hide-sm">{cap(s.mktCap) ?? '—'}</td>
                      <td className="c hide-sm"><ScoreCell value={s.composite} /></td>
                      <td className="c hide-sm">
                        <span className={`tag ${s.signal === 'Buy' ? 'tag-green' : s.signal === 'Sell' ? 'tag-red' : 'tag-amber'} tag-dot`}>{s.signal}</span>
                      </td>
                      <td className="c">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: isFav ? 'var(--accent)' : 'var(--text3)', padding: 4, lineHeight: 0 }}
                          aria-label="Watchlist"
                        >
                          <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {recs.length === 0 && <div className="empty-state">— Belum ada data —</div>}
          </div>
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="cg-card">
            <div className="cg-card-head" style={{ padding: '13px 16px' }}>
              <Layers size={15} style={{ color: 'var(--accent)' }} />
              <div className="cg-card-title">Sektor Terkuat</div>
            </div>
            <div style={{ padding: '6px 16px 14px' }}>
              {bestSector.map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', width: 16 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div className="sbar-track" style={{ marginTop: 5 }}>
                      <div className="sbar-fill" style={{ width: `${r.avg}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                  <span className="num" style={{ color: 'var(--accent)', fontSize: 12, width: 26, textAlign: 'right' }}>{r.avg}</span>
                </div>
              ))}
              {bestSector.length === 0 && <div className="empty-state" style={{ padding: 20 }}>— belum ada data —</div>}
            </div>
          </div>

          <div className="cg-card">
            <div className="cg-card-head" style={{ padding: '13px 16px' }}>
              <TrendingUp size={15} style={{ color: 'var(--up)' }} />
              <div className="cg-card-title">Top Gainers</div>
            </div>
            <div style={{ padding: '6px 16px 14px' }}>
              {gainers.map((s) => (
                <div key={s.ticker} onClick={() => onSelectStock?.(s)} className="hoverable" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', margin: '0 -6px', borderRadius: 8, cursor: 'pointer' }}>
                  <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-sym">{s.ticker}</div>
                    <div className="cell-name">{s.sector}</div>
                  </div>
                  <span className="num" style={{ color: 'var(--up)', fontWeight: 600, fontSize: 12.5 }}>{pct(s.changePct)}</span>
                </div>
              ))}
              {gainers.length === 0 && <div className="empty-state" style={{ padding: 20 }}>— belum ada gainer —</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreCell({ value }) {
  const color = value >= 80 ? 'var(--up)' : value >= 60 ? 'var(--hold)' : 'var(--down)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 78 }}>
      <div className="sbar-track" style={{ width: 40 }}>
        <div className="sbar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="num" style={{ color, fontWeight: 600, width: 22, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function StatCard({ label, value, sub, icon, accent, valueColor = 'var(--text)' }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent }}>
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value" style={{ color: valueColor }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}
