import { useMemo } from 'react'
import { useIHSG } from '../hooks/useIHSG'
import { Star } from 'lucide-react'
import { Spark, SBar, PH, pct, sigColor, sigBg, viewStock, cap } from '../components/ui/DashboardComponents'

export default function DashboardPage({ theme = 'dark', onSelectStock, onToggleFav, favorites = [], stocks = [] }) {
  const { ihsg, loading: ihsgLoading } = useIHSG()
  const data = useMemo(() => stocks.map(viewStock).filter(s => s.composite != null), [stocks])

  const recs = useMemo(() => [...data].sort((a, b) => b.composite - a.composite).slice(0, 8), [data])
  const buys = data.filter(s => s.signal === 'Buy' || s.signal === 'Strong Buy')

  const ihsgPos = (ihsg?.change ?? 0) >= 0

  const bestSector = useMemo(() => {
    const m = new Map()
    data.forEach(s => {
      if (!s.sector) return
      const g = m.get(s.sector) || { sum: 0, n: 0 }
      g.sum += s.composite
      g.n += 1
      m.set(s.sector, g)
    })
    const ranked = [...m.entries()].map(([name, g]) => ({ name, avg: Math.round(g.sum / g.n) }))
      .sort((a, b) => b.avg - a.avg)
    return { top: ranked[0] || null, list: ranked.slice(0, 5) }
  }, [data])

  const stats = [
    { label: 'IHSG', val: ihsgLoading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 }), sub: ihsgLoading ? 'memuat data' : `${ihsgPos ? '+' : ''}${(ihsg?.change ?? 0).toLocaleString('id-ID')}%`, c: ihsgPos ? 'var(--up)' : 'var(--down)' },
    { label: 'SAHAM DIANALISA', val: data.length, sub: 'data real-time', c: 'var(--accent)' },
    { label: 'SIGNAL BUY', val: buys.length, sub: 'layak beli jangka panjang', c: 'var(--up)' },
    { label: 'SEKTOR TERBAIK', val: bestSector.top?.name || '—', sub: bestSector.top ? `${bestSector.top.avg} pts` : '', c: 'var(--accent)' },
  ]

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="REAL-TIME · BURSA EFEK INDONESIA" title="MARKET DASHBOARD" />

      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4" style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', padding: '18px 22px', borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: s.c, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 4 }}>REKOMENDASI HARI INI</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Skor Composite Tertinggi</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>{recs.length} SAHAM</div>
      </div>

      <div style={{ border: '1px solid var(--border)', overflowX: 'auto', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              {['SAHAM', 'HARGA', 'CHG%', 'KAPITALISASI', 'FUNDAMENTAL', 'TEKNIKAL', 'TOTAL', 'SIGNAL', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: h === 'SAHAM' ? 'left' : 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recs.map(s => {
              const isFav = favorites.includes(s.ticker)
              return (
                <tr key={s.ticker} className="trow" onClick={() => onSelectStock?.(s)} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Spark data={s.sparkline} up={s.changePct >= 0} w={44} h={22} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{s.ticker}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{String(s.name || '').slice(0, 24)}</div>
                      </div>
                      <span className="chip">{s.sector}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.price.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.changePct)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>{cap(s.mktCap) ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><SBar v={s.fundScore} color="var(--accent)" /></div></td>
                  <td style={{ padding: '10px 12px' }}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><SBar v={s.techScore} color="var(--up)" /></div></td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: s.composite >= 75 ? 'var(--up)' : s.composite >= 60 ? 'var(--hold)' : 'var(--down)' }}>{s.composite}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span className="sig" style={{ color: sigColor(s.signal, theme), background: sigBg(s.signal), borderColor: `${sigColor(s.signal, theme)}40` }}>{s.signal}</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: isFav ? 'var(--accent)' : 'var(--text3)', padding: 4, lineHeight: 0 }}
                      aria-label={`Watchlist ${s.ticker}`}
                    >
                      <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {recs.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>— BELUM ADA DATA —</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-2">
        <div style={{ background: 'var(--bg2)', padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 14 }}>SEKTOR TERBAIK · RATA-RATA SKOR</div>
          {bestSector.list.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— belum ada data —</div>}
          {bestSector.list.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', width: 16 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{r.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--up)' }}>{r.avg} pts</span>
              <div style={{ width: 90 }}>
                <div className="sbar-track"><div className="sbar-fill" style={{ width: `${Math.min(100, r.avg)}%`, background: 'var(--accent)' }} /></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--up)', letterSpacing: '0.12em', marginBottom: 14 }}>TOP GAINERS</div>
          {[...data].filter(s => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5).map(s => (
            <div key={s.ticker} className="trow" onClick={() => onSelectStock?.(s)} style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Spark data={s.sparkline} up w={44} h={20} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', width: 52 }}>{s.ticker}</span>
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{s.sector}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--up)' }}>{pct(s.changePct)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', minWidth: 55, textAlign: 'right' }}>{s.price.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
