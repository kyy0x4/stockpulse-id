import { useMemo, useState } from 'react'
import {
  Star, Download, ArrowUpDown, ChevronDown, ChevronUp, Activity,
  TrendingUp, TrendingDown, Layers, Target,
} from 'lucide-react'
import { Spark, pct, viewStock, cap, vol, fmtPrice, kindLabel } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'

const KINDS = [
  { id: 'all', label: 'Semua' },
  { id: 'us_stock', label: 'Saham AS' },
  { id: 'etf', label: 'ETF' },
  { id: 'crypto', label: 'Kripto' },
]
const SIGNALS = [
  { id: 'All', label: 'Semua' },
  { id: 'Buy', label: 'Buy' },
  { id: 'Hold', label: 'Hold' },
  { id: 'Sell', label: 'Sell' },
]
const MIN_SCORES = [
  { v: 0, label: 'Semua' },
  { v: 60, label: '≥ 60' },
  { v: 75, label: '≥ 75' },
]

const COLUMNS = [
  { k: 'ticker', label: 'Aset', cls: 'l sticky-col' },
  { k: 'price', label: 'Harga', cls: 'r' },
  { k: 'changePct', label: '24h %', cls: 'r' },
  { k: 'volume', label: 'Volume', cls: 'r' },
  { k: 'mktCap', label: 'Kap.', cls: 'r' },
  { k: 'sector', label: 'Sektor', cls: 'l' },
  { k: 'pe', label: 'P/E', cls: 'r' },
  { k: 'roe', label: 'ROE%', cls: 'r' },
  { k: 'growth', label: 'Growth', cls: 'r' },
  { k: 'rsi', label: 'RSI', cls: 'c' },
  { k: 'trend', label: 'Trend', cls: 'c' },
  { k: 'composite', label: 'Skor', cls: 'c' },
  { k: 'signal', label: 'Signal', cls: 'c' },
]

export default function ScreenerPage({ onSelectStock, onToggleFav, favorites = [], stocks = [] }) {
  const data = useMemo(() => stocks.map(viewStock), [stocks])
  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(data.map((s) => s.sector).filter(Boolean)))].sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b))),
    [data],
  )

  const [kind, setKind] = useState('all')
  const [sector, setSector] = useState('All')
  const [sig, setSig] = useState('All')
  const [minScore, setMinScore] = useState(0)
  const [sortK, setSortK] = useState('composite')
  const [sortD, setSortD] = useState(-1)

  const filtered = useMemo(
    () =>
      data
        .filter((s) => kind === 'all' || s.kind === kind)
        .filter((s) => sector === 'All' || s.sector === sector)
        .filter((s) => sig === 'All' || s.signal === sig)
        .filter((s) => (s.composite ?? 0) >= minScore),
    [data, kind, sector, sig, minScore],
  )

  const rows = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      const av = a[sortK] ?? (sortK === 'pe' ? 999999 : 0)
      const bv = b[sortK] ?? (sortK === 'pe' ? 999999 : 0)
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * sortD
      }
      return (av - bv) * sortD
    })
    return list
  }, [filtered, sortK, sortD])

  const stats = useMemo(() => {
    const n = data.length
    const avg = n ? Math.round(data.reduce((sum, s) => sum + (s.composite ?? 0), 0) / n) : 0
    const buy = data.filter((s) => s.signal === 'Buy' || s.signal === 'Strong Buy').length
    const gainers = data.filter((s) => (s.changePct ?? 0) > 0).length
    return { n, avg, buy, gainers }
  }, [data])

  const handleSort = (k) => {
    if (sortK === k) setSortD((d) => (d === 1 ? -1 : 1))
    else { setSortK(k); setSortD(-1) }
  }

  const exportCSV = () => {
    const header = ['Ticker', 'Nama', 'Jenis', 'Sektor', 'Harga', 'Change%', 'Volume', 'Kapitalisasi', 'P/E', 'ROE%', 'Growth%', 'RSI', 'Trend', 'Skor', 'Signal']
    const lines = rows.map((s) => [
      s.ticker,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      kindLabel(s.kind),
      `"${s.sector || ''}"`,
      s.price ?? '',
      s.changePct ?? '',
      s.volume ?? '',
      s.mktCap ?? '',
      s.pe ?? '',
      s.roe ?? '',
      s.growth ?? '',
      s.rsi ?? '',
      s.trend ?? '',
      s.composite ?? '',
      s.signal ?? '',
    ])
    const csv = [header, ...lines].map((r) => r.join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `screener-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="fade-up">
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="page-head-eyebrow">Real-time · US Stock · ETF · Crypto</div>
          <h1 className="page-head-title">Asset Screener</h1>
          <p className="page-head-sub">Filter, urutkan, dan analisa {stats.n} aset dengan skor fundamental + teknikal.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="tag tag-green tag-dot">Live</span>
          <button className="pill" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <StatCard label="Total Aset" value={stats.n} sub={`${data.filter((s) => s.kind === 'crypto').length} kripto · ${data.filter((s) => s.kind === 'etf').length} ETF`} icon={<Layers size={13} />} accent="var(--accent)" />
        <StatCard label="Rata-rata Skor" value={stats.avg} sub="composite 0–100" icon={<Target size={13} />} accent="var(--accent)" />
        <StatCard label="Sinyal Buy" value={stats.buy} sub={`${stats.n ? Math.round((stats.buy / stats.n) * 100) : 0}% dari universe`} icon={<TrendingUp size={13} />} accent="var(--up)" valueColor="var(--up)" />
        <StatCard label="Menguat Hari Ini" value={stats.gainers} sub={`${stats.n ? Math.round((stats.gainers / stats.n) * 100) : 0}% aset hijau`} icon={<Activity size={13} />} accent="var(--down)" valueColor="var(--text)" />
      </div>

      {/* Kind tabs */}
      <div className="tabstrip">
        {KINDS.map((k) => (
          <button key={k.id} className={`tabstrip-tab ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)}>
            {k.label}
            <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              {k.id === 'all' ? data.length : data.filter((s) => s.kind === k.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginRight: 2 }}>SEKTOR</span>
          {sectors.map((s) => (
            <button key={s} className={`pill ${sector === s ? 'active' : ''}`} onClick={() => setSector(s)} style={{ height: 25, fontSize: 11.5 }}>
              {s === 'All' ? 'Semua' : s}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="seg">
            {SIGNALS.map((s) => (
              <button key={s.id} className={`seg-item ${sig === s.id ? 'active' : ''}`} onClick={() => setSig(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="seg">
            {MIN_SCORES.map((m) => (
              <button key={m.v} className={`seg-item ${minScore === m.v ? 'active' : ''}`} onClick={() => setMinScore(m.v)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-shell">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="l sticky-col" style={{ minWidth: 210 }}>
                  <button onClick={() => handleSort('ticker')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }} className={sortK === 'ticker' ? 'sorted' : ''}>
                    Aset <SortIcon active={sortK === 'ticker'} dir={sortD} />
                  </button>
                </th>
                {COLUMNS.slice(1).map((c) => (
                  <th key={c.k} className={`${c.cls} ${sortK === c.k ? 'sorted' : ''}`} onClick={() => handleSort(c.k)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {c.label} <SortIcon active={sortK === c.k} dir={sortD} />
                    </span>
                  </th>
                ))}
                <th className="c" style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const isFav = favorites.includes(s.ticker)
                const up = (s.changePct ?? 0) >= 0
                return (
                  <tr key={s.ticker} onClick={() => onSelectStock?.(s)}>
                    <td className="l sticky-col">
                      <div className="cell-ticker">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', width: 18, textAlign: 'right' }}>{i + 1}</span>
                        <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="cell-sym">{s.ticker}</span>
                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 4px' }}>
                              {s.kind === 'crypto' ? 'KRP' : s.kind === 'etf' ? 'ETF' : 'US'}
                            </span>
                          </div>
                          <div className="cell-name">{s.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="num t-strong">{fmtPrice(s.price, s.kind)}</td>

                    <td className="num" style={{ color: up ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pct(s.changePct)}
                      </span>
                    </td>

                    <td className="num t-soft">{vol(s.volume) ?? '—'}</td>
                    <td className="num t-soft">{cap(s.mktCap) ?? '—'}</td>
                    <td className="l">
                      <span className="tag tag-neutral">{s.sector}</span>
                    </td>
                    <td className="num t-soft">{s.pe != null ? `${Number(s.pe).toFixed(1)}x` : '—'}</td>
                    <td className="num t-soft">{s.roe != null ? `${Number(s.roe).toFixed(1)}%` : '—'}</td>
                    <td className="num" style={{ color: s.growth != null && s.growth > 10 ? 'var(--up)' : 'var(--text2)' }}>
                      {s.growth != null ? `${Number(s.growth).toFixed(1)}%` : '—'}
                    </td>
                    <td className="c num" style={{ color: rsiColor(s.rsi) }}>{s.rsi != null ? Number(s.rsi).toFixed(0) : '—'}</td>
                    <td className="c">
                      {s.trend ? (
                        <span className={`tag ${s.trend === 'Uptrend' ? 'tag-green' : s.trend === 'Downtrend' ? 'tag-red' : 'tag-amber'}`}>
                          {s.trend}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="c">
                      <ScoreCell value={s.composite ?? 0} />
                    </td>
                    <td className="c">
                      <span className={`tag ${s.signal === 'Buy' ? 'tag-green' : s.signal === 'Sell' ? 'tag-red' : 'tag-amber'} tag-dot`}>
                        {s.signal}
                      </span>
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

          {rows.length === 0 && (
            <div className="empty-state">— Tidak ada aset yang cocok dengan filter —</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
        <span>{rows.length} / {data.length} aset ditampilkan</span>
        <span>Klik header kolom untuk mengurutkan</span>
      </div>
    </div>
  )
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown size={10} style={{ opacity: 0.4 }} />
  return dir === -1 ? <ChevronDown size={11} color="var(--accent)" /> : <ChevronUp size={11} color="var(--accent)" />
}

function rsiColor(rsi) {
  if (rsi == null) return 'var(--text3)'
  if (rsi >= 70) return 'var(--down)'
  if (rsi <= 30) return 'var(--up)'
  return 'var(--text2)'
}

function ScoreCell({ value }) {
  const color = value >= 80 ? 'var(--up)' : value >= 60 ? 'var(--hold)' : 'var(--down)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 84 }}>
      <div className="sbar-track" style={{ width: 44 }}>
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
