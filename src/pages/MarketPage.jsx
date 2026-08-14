import { useMemo } from 'react'
import { useIHSG } from '../hooks/useIHSG'
import { Spark, PH, pct, viewStock, LineChart } from '../components/ui/DashboardComponents'

export default function MarketPage({ onSelectStock, stocks = [] }) {
  const { ihsg, loading: ihsgLoading } = useIHSG()
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const sectorPerf = useMemo(() => {
    const m = new Map()
    data.forEach(s => {
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

  const withPrice = data.filter(s => s.changePct != null)
  const adv = withPrice.filter(s => s.changePct > 0).length
  const dec = withPrice.filter(s => s.changePct < 0).length
  const breadth = withPrice.length ? Math.round(((adv - dec) / withPrice.length) * 100) : 0
  const ihsgPos = (ihsg?.change ?? 0) >= 0
  const ihsgSeries = (ihsg?.history || []).slice(-60).map(h => h.close).filter(n => n != null)

  const gainers = withPrice.filter(s => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5)
  const losers  = withPrice.filter(s => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5)

  const stats = [
    { label: 'IHSG', val: ihsgLoading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 }), sub: ihsgLoading ? 'memuat' : `${ihsgPos ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`, c: ihsgPos ? 'var(--up)' : 'var(--down)' },
    { label: 'SAHAM NAIK', val: adv, sub: `${withPrice.length ? Math.round((adv / withPrice.length) * 100) : 0}% pasar`, c: 'var(--up)' },
    { label: 'SAHAM TURUN', val: dec, sub: `${withPrice.length ? Math.round((dec / withPrice.length) * 100) : 0}% pasar`, c: 'var(--down)' },
    { label: 'BREADTH', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', c: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
  ]

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="BURSA EFEK INDONESIA · IDX" title="MARKET OVERVIEW" />

      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4" style={{ marginBottom: 28 }}>
        {stats.map(x => (
          <div key={x.label} style={{ background: 'var(--bg2)', padding: '16px 20px', borderLeft: `3px solid ${x.c}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6 }}>{x.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: x.c, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{x.val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{x.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-[2fr_1fr]" style={{ marginBottom: 28 }}>
        <div style={{ background: 'var(--bg2)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em' }}>INDEKS HARGA SAHAM GABUNGAN</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: ihsgPos ? 'var(--up)' : 'var(--down)' }}>
              {ihsgLoading ? '…' : `${ihsgPos ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 14 }}>TREN 60 SESSI</div>
          <LineChart values={ihsgSeries} up={ihsgPos} h={200} />
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 14 }}>PERFORMA SEKTOR · AVG %</div>
          {sectorPerf.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— belum ada data —</div>}
          {sectorPerf.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.change >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.change)}</span>
                </div>
                <div className="sbar-track" style={{ width: '100%' }}>
                  <div className="sbar-fill" style={{ width: `${Math.min(100, Math.max(3, 50 + s.change * 12))}%`, background: s.change >= 0 ? 'var(--up)' : 'var(--down)', opacity: 0.6 }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{s.stocks}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-2">
        {(['TOP GAINERS', 'TOP LOSERS']).map((label, li) => {
          const list = li === 0 ? gainers : losers
          const col = li === 0 ? 'var(--up)' : 'var(--down)'
          return (
            <div key={label} style={{ background: 'var(--bg2)', padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: col, letterSpacing: '0.12em', marginBottom: 14 }}>{label}</div>
              {list.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— tidak ada —</div>}
              {list.map(s => (
                <div key={s.ticker} className="trow" onClick={() => onSelectStock?.(s)} style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <Spark data={s.sparkline} up={li === 0} w={44} h={20} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', width: 52 }}>{s.ticker}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{s.sector}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: col }}>{pct(s.changePct)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', minWidth: 55, textAlign: 'right' }}>{s.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
