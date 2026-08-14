import { useState, useMemo } from 'react'
import { Star } from 'lucide-react'
import { Spark, SBar, PH, pct, sigColor, sigBg, viewStock, cap } from '../components/ui/DashboardComponents'

const SIGNALS = ['All', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']
const MIN_SCORES = [0, 60, 75]

function exportCSV(rows) {
  const header = ['Ticker', 'Nama', 'Sektor', 'Harga', 'Change %', 'Signal', 'Skor', 'RSI', 'Trend', 'PER', 'ROE', 'Growth', 'DER', 'Kapitalisasi']
  const lines = rows.map(s => [
    s.ticker,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.sector,
    s.price,
    s.changePct,
    s.signal,
    s.composite,
    s.rsi ?? '',
    `"${s.trend || ''}"`,
    s.pe ?? '',
    s.roe != null ? `${s.roe}%` : '',
    s.growth != null ? `${s.growth}%` : '',
    s.der ?? '',
    `"${cap(s.mktCap) ?? ''}"`,
  ])
  const csv = [header, ...lines].map(r => r.join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `plotfinansial-screener-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ScreenerPage({ theme = 'dark', onSelectStock, onToggleFav, favorites = [], stocks = [] }) {
  const data = useMemo(() => stocks.map(viewStock), [stocks])
  const sectors = useMemo(() => ['All', ...new Set(data.map(s => s.sector).filter(Boolean))], [data])

  const [sector, setSector] = useState('All')
  const [sig, setSig] = useState('All')
  const [minScore, setMinScore] = useState(0)
  const [sortK, setSortK] = useState('composite')
  const [sortD, setSortD] = useState(-1)

  const rows = useMemo(() =>
    data
      .filter(s => sector === 'All' || s.sector === sector)
      .filter(s => sig === 'All' || s.signal === sig)
      .filter(s => (s.composite ?? 0) >= minScore)
      .sort((a, b) => {
        const av = sortK === 'pe' ? (a.pe ?? 999) : (a[sortK] ?? 0)
        const bv = sortK === 'pe' ? (b.pe ?? 999) : (b[sortK] ?? 0)
        return (av - bv) * sortD
      })
  , [data, sector, sig, minScore, sortK, sortD])

  const handleSort = (k) => {
    if (sortK === k) setSortD(d => (d === 1 ? -1 : 1))
    else { setSortK(k); setSortD(-1) }
  }

  const Th = ({ k, label }) => (
    <th onClick={() => handleSort(k)} style={{
      padding: '8px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none',
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
      color: sortK === k ? 'var(--accent)' : 'var(--text3)',
      background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
    }}>
      {label}{sortK === k ? (sortD === -1 ? ' ↓' : ' ↑') : ''}
    </th>
  )

  const trendCol = (t) => t === 'Uptrend' ? 'var(--up)' : t === 'Downtrend' ? 'var(--down)' : 'var(--hold)'

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="FUNDAMENTAL + TEKNIKAL · IDX" title="STOCK SCREENER" />

      <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginBottom: 1, background: 'var(--border)' }}>
        {sectors.map(s => <button key={s} onClick={() => setSector(s)} className={`fbtn ${sector === s ? 'active' : ''}`}>{s}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginBottom: 1, background: 'var(--border)' }}>
        {SIGNALS.map(x => <button key={x} onClick={() => setSig(x)} className={`fbtn ${sig === x ? 'active' : ''}`}>{x}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, background: 'var(--border)' }}>
        <span style={{ background: 'var(--bg2)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', padding: '4px 12px', alignSelf: 'center' }}>MIN SKOR</span>
        {MIN_SCORES.map(m => <button key={m} onClick={() => setMinScore(m)} className={`fbtn ${minScore === m ? 'active' : ''}`}>{m === 0 ? 'SEMUA' : `≥ ${m}`}</button>)}
        <button onClick={() => exportCSV(rows)} style={{ marginLeft: 'auto', marginRight: 1, background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.04em' }}>
          ⬇ EXPORT CSV ({rows.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>SAHAM</th>
              <Th k="price" label="HARGA" />
              <Th k="changePct" label="CHG%" />
              <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>SEKTOR</th>
              <Th k="pe" label="P/E" />
              <Th k="roe" label="ROE%" />
              <Th k="growth" label="GROWTH" />
              <Th k="rsi" label="RSI" />
              <th style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>TREND</th>
              <Th k="fundScore" label="FUND." />
              <Th k="techScore" label="TECH." />
              <Th k="composite" label="TOTAL" />
              <th style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>SIGNAL</th>
              <th style={{ padding: '8px 10px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.ticker} className="trow" onClick={() => onSelectStock?.(s)} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Spark data={s.sparkline} up={s.changePct >= 0} w={44} h={22} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{s.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{String(s.name || '').slice(0, 22)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{s.price.toLocaleString('id-ID')}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 500 }}>{pct(s.changePct)}</td>
                <td style={{ padding: '10px 10px', textAlign: 'left' }}><span className="chip">{s.sector}</span></td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>{s.pe != null ? `${s.pe}x` : '—'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>{s.roe != null ? `${s.roe}%` : '—'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: s.growth != null && s.growth > 10 ? 'var(--up)' : 'var(--text2)' }}>{s.growth != null ? `${s.growth}%` : '—'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>{s.rsi ?? '—'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                  {s.trend ? (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', border: '1px solid', borderColor: trendCol(s.trend), color: trendCol(s.trend), letterSpacing: '0.06em' }}>{s.trend}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '10px 10px' }}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><SBar v={s.fundScore} color="var(--accent)" /></div></td>
                <td style={{ padding: '10px 10px' }}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><SBar v={s.techScore} color="var(--up)" /></div></td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: s.composite >= 75 ? 'var(--up)' : s.composite >= 60 ? 'var(--hold)' : 'var(--down)' }}>{s.composite ?? '—'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                  <span className="sig" style={{ color: sigColor(s.signal, theme), background: sigBg(s.signal), borderColor: `${sigColor(s.signal, theme)}40` }}>{s.signal}</span>
                </td>
                <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: favorites.includes(s.ticker) ? 'var(--accent)' : 'var(--text3)', padding: 4, lineHeight: 0 }}
                    aria-label={`Watchlist ${s.ticker}`}
                  >
                    <Star size={15} fill={favorites.includes(s.ticker) ? 'currentColor' : 'none'} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>— TIDAK ADA SAHAM DITEMUKAN —</div>
        )}
      </div>
      <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>
        {rows.length} SAHAM · KLIK KOLOM UNTUK SORTIR
      </div>
    </div>
  )
}
