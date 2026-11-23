import { useMemo } from 'react'
import { PH, pct, viewStock, cap, fmtPrice, kindLabel } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'
import { Star, X } from 'lucide-react'

function ScoreCell({ value, color }) {
  const c = value >= 80 ? 'var(--up)' : value >= 60 ? 'var(--hold)' : 'var(--down)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end', minWidth: 74 }}>
      <div className="sbar-track" style={{ width: 38 }}>
        <div className="sbar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || c }} />
      </div>
      <span className="num" style={{ color: c, fontWeight: 600, width: 20, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function WatchlistPage({ onSelectStock, stocks = [], favorites = [], onToggleFav }) {
  const data = useMemo(() => stocks.map(viewStock), [stocks])
  const watched = data.filter((s) => favorites.includes(s.ticker))
  const avail = data.filter((s) => !favorites.includes(s.ticker))

  const up = watched.filter((s) => s.changePct > 0).length
  const down = watched.filter((s) => s.changePct < 0).length

  return (
    <div className="fade-up">
      <PH eyebrow="Portofolio pantauan" title="Watchlist" />

      <div className="stat-grid">
        <div className="stat-card" style={{ '--stat-accent': 'var(--accent)' }}>
          <div className="stat-label"><Star size={12} /> Total Aset</div>
          <div className="stat-value">{watched.length}</div>
          <div className="stat-sub">aset dipantau</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--up)' }}>
          <div className="stat-label">Aset Naik</div>
          <div className="stat-value" style={{ color: 'var(--up)' }}>{up}</div>
          <div className="stat-sub">hari ini</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--down)' }}>
          <div className="stat-label">Aset Turun</div>
          <div className="stat-value" style={{ color: 'var(--down)' }}>{down}</div>
          <div className="stat-sub">hari ini</div>
        </div>
      </div>

      <div className="table-shell">
        <div className="table-scroll" style={{ maxHeight: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="l" style={{ minWidth: 210 }}>Aset</th>
                <th>Harga</th>
                <th>24h %</th>
                <th>Kap.</th>
                <th className="c">Fund.</th>
                <th className="c">Tech.</th>
                <th className="c">Signal</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {watched.map((s) => (
                <tr key={s.ticker} onClick={() => onSelectStock?.(s)}>
                  <td className="l">
                    <div className="cell-ticker">
                      <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="cell-sym">{s.ticker}</span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 4px' }}>
                            {kindLabel(s.kind)}
                          </span>
                        </div>
                        <div className="cell-name">{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num t-strong">{fmtPrice(s.price, s.kind)}</td>
                  <td className="num" style={{ color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>{pct(s.changePct)}</td>
                  <td className="num t-soft">{cap(s.mktCap) ?? '—'}</td>
                  <td className="c"><ScoreCell value={s.fundScore} /></td>
                  <td className="c"><ScoreCell value={s.techScore} color="var(--accent)" /></td>
                  <td className="c">
                    <span className={`tag ${s.signal === 'Buy' ? 'tag-green' : s.signal === 'Sell' ? 'tag-red' : 'tag-amber'} tag-dot`}>{s.signal}</span>
                  </td>
                  <td className="c">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                      className="icon-btn"
                      style={{ width: 26, height: 26 }}
                      aria-label={`Hapus ${s.ticker} dari watchlist`}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {watched.length === 0 && (
          <div className="empty-state">— Watchlist kosong, tambahkan aset di bawah —</div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div className="cg-card-title">Tambah ke Watchlist</div>
          <div className="cg-card-sub">Klik aset untuk mulai memantau</div>
        </div>
        <div className="cg-card" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {avail.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
                SEMUA ASET SUDAH DI WATCHLIST
              </div>
            )}
            {avail.map((s) => (
              <button
                key={s.ticker}
                onClick={() => onToggleFav?.(s.ticker)}
                className="hoverable"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  padding: '8px 10px', cursor: 'pointer', minHeight: 42, textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>+</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.ticker}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.changePct)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
