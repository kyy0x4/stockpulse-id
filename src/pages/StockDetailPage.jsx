import { useState, useEffect } from 'react'
import { Spark, SBar, viewStock, fmtPrice, kindLabel, PriceChart } from '../components/ui/DashboardComponents'
import { ChevronLeft, Star, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react'
import { api } from '../api/client'

function Metric({ label, value, good }) {
  const color = value == null ? 'var(--text3)' : good === true ? 'var(--up)' : good === false ? 'var(--down)' : 'var(--text)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )
}

const fmtNum = (v, d = 1) => (v == null || Number.isNaN(Number(v)) ? null : Number(v).toFixed(d))

export default function StockDetailPage({ stock, onClose, onToggleFav, favorites }) {
  const s = viewStock(stock || {})
  const isFav = favorites.includes(s.ticker)

  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    let alive = true
    setLoadingDetail(true)
    api.detail(s.ticker)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null))
      .finally(() => alive && setLoadingDetail(false))
    return () => { alive = false }
  }, [s.ticker])

  const merged = detail
    ? viewStock({
        ...s,
        ...detail,
        fundamental: { ...(s.fundamental || {}), ...(detail.fundamental || {}) },
        technical: { ...(s.technical || {}), ...(detail.technical || {}) },
      })
    : s
  const history = detail?.history || []
  const series = history.slice(-90).map(h => h.close).filter(n => n != null)
  const seasonality = detail?.seasonality
  const price = detail?.price ?? s.price
  const change = detail?.change ?? s.changePct
  const name = detail?.name ?? s.name
  const sector = detail?.sector ?? s.sector
  const trendPositive = series.length >= 2 ? series[series.length - 1] >= series[0] : (change ?? 0) >= 0
  const positive = (change ?? 0) >= 0
  const periodReturn = series.length >= 2 && series[0] ? ((series[series.length - 1] - series[0]) / series[0]) * 100 : null

  const f = merged.fundamental || {}
  const t = merged.technical || {}
  const isProfile = merged.kind === 'crypto' || merged.kind === 'etf'
  const pillarEntries = Object.entries(f.pillars || {})

  const emaDaily = t.ema21 != null ? `${t.ema21} / ${t.ema34} / ${t.ema55}` : null
  const emaWeekly = t.ema21w != null ? `${t.ema21w} / ${t.ema34w} / ${t.ema55w}` : null
  const emaBull = () => {
    const a = parseFloat(t.ema21), b = parseFloat(t.ema34), c = parseFloat(t.ema55)
    return Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && a > b && b > c
  }

  return (
    <div className="fade-up">
      <div className="sm:px-5 lg:px-7" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button
          onClick={onClose}
          style={{ border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', padding: '7px 10px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          aria-label="Kembali"
        >
          <ChevronLeft size={15} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em' }}>KEMBALI</span>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em' }}>ANALISA ASET · HALAMAN DETAIL</div>
      </div>

      <div className="card sm:px-6" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>{s.ticker}</h2>
                <span className={`tag ${merged.signal === 'Buy' ? 'tag-green' : merged.signal === 'Sell' ? 'tag-red' : 'tag-amber'} tag-dot`}>
                  {merged.signal}
                </span>
                <span className="chip">{kindLabel(merged.kind)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{name} · {sector}</p>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={11} /> Update: data real & analisa otomatis
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => onToggleFav(s.ticker)}
                style={{
                  border: isFav ? '1px solid var(--up)' : '1px solid var(--border2)',
                  background: isFav ? 'var(--up-dim)' : 'var(--bg3)',
                  color: isFav ? 'var(--up)' : 'var(--text2)',
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'Di Watchlist' : 'Watchlist'}
              </button>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{price != null ? fmtPrice(price, merged.kind) : '—'}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: positive ? 'var(--up)' : 'var(--down)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {change != null ? `${positive ? '+' : ''}${change}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, border: '1px solid var(--border)', background: 'var(--bg3)', padding: 16, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Performa Harga {history.length > 0 ? '· 3 bulan' : '· 7 sesi terakhir'}</p>
              {loadingDetail && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)', marginLeft: 4 }} />}
              {periodReturn != null && (
                <span className={`tag ${periodReturn >= 0 ? 'tag-green' : 'tag-red'}`} style={{ marginLeft: 'auto' }}>
                  {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}% dalam 3 bulan
                </span>
              )}
            </div>
            {series.length >= 2 ? (
              <>
                <PriceChart rows={history.slice(-90)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>{series.length} sesi perdagangan</span>
                  <span>Low {fmtPrice(Math.min(...series), merged.kind)} · High {fmtPrice(Math.max(...series), merged.kind)}</span>
                </div>
              </>
            ) : (
              <Spark data={s.sparkline} up={trendPositive} w={800} h={120} fluid />
            )}
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{isProfile ? 'Profil Pasar' : 'Fundamental'}</p>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Skor: {merged.fundScore}/100</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isProfile ? (
                  <>
                    <Metric label="Return 30 hari" value={f.return_30d != null ? `${f.return_30d > 0 ? '+' : ''}${f.return_30d}%` : (f.metrics?.return_30d ?? null)} good={(f.return_30d ?? 0) > 0} />
                    <Metric label="Return 90 hari" value={f.return_90d != null ? `${f.return_90d > 0 ? '+' : ''}${f.return_90d}%` : (f.metrics?.return_90d ?? null)} good={(f.return_90d ?? 0) > 0} />
                    <Metric label="Return 1 tahun" value={f.return_1y != null ? `${f.return_1y > 0 ? '+' : ''}${f.return_1y}%` : (f.metrics?.return_1y ?? null)} good={(f.return_1y ?? 0) > 0} />
                    <Metric label="Drawdown dari puncak 52m" value={f.drawdown_52w != null ? `${f.drawdown_52w}%` : (f.metrics?.drawdown_52w ?? null)} good={(f.drawdown_52w ?? -100) > -20} />
                    <Metric label="Kapitalisasi / AUM" value={s.mktCap} good={null} />
                  </>
                ) : (
                  <>
                    <Metric label="PER (Price to Earnings)" value={f.per != null ? `${fmtNum(f.per, 1)}x` : null} good={f.per > 0 && f.per < 25} />
                    <Metric label="PBV (Price to Book)" value={f.pbv != null ? `${fmtNum(f.pbv, 2)}x` : null} good={f.pbv < 5} />
                    <Metric label="ROE (Return on Equity)" value={f.roe != null ? `${fmtNum(f.roe, 1)}%` : null} good={f.roe > 15} />
                    <Metric label="DER (Debt to Equity)" value={f.der != null ? `${fmtNum(f.der, 2)}x` : null} good={f.der < 1} />
                    <Metric label="Pertumbuhan Laba" value={f.growth != null ? `${fmtNum(f.growth, 1)}%` : null} good={f.growth > 10} />
                  </>
                )}
              </div>
              {pillarEntries.length > 0 && (
                <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                  {pillarEntries.map(([label, value]) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>{String(label).toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)' }}>{value}</span>
                      </div>
                      <div className="sbar-track" style={{ width: '100%' }}>
                        <div className="sbar-fill" style={{ width: `${Math.min(100, Math.max(0, Number(value) || 0))}%`, background: 'var(--accent)', opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <SBar v={merged.fundScore} color="var(--accent)" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Teknikal</p>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--up)' }}>Skor: {merged.techScore}/100</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Metric label="Tren (EMA D+W)" value={t.trend || null} good={t.trend === 'Uptrend'} />
                <Metric label="EMA Cross" value={t.ema_cross || null} good={t.ema_cross === 'Bullish' || t.ema_cross === 'Golden Cross'} />
                <Metric label="EMA Daily 21/34/55" value={emaDaily} good={emaBull()} />
                <Metric label="EMA Weekly 21/34/55" value={emaWeekly} good={t.ema21w != null && parseFloat(t.ema21w) > parseFloat(t.ema34w) && parseFloat(t.ema34w) > parseFloat(t.ema55w)} />
                <Metric label="RSI (14 hari)" value={t.rsi != null ? `${t.rsi}` : null} good={t.rsi > 40 && t.rsi < 70} />
                <Metric label="MACD" value={t.macd || null} good={t.macd === 'Bullish'} />
                <Metric label="Rasio Volume" value={t.vol != null ? `${t.vol}x` : null} good={t.vol >= 1} />
              </div>
              <div style={{ marginTop: 12 }}>
                <SBar v={merged.techScore} color="var(--up)" />
              </div>
            </div>
          </div>

          {seasonality?.monthly?.length > 0 && (
            <div style={{ marginTop: 20, border: '1px solid var(--border)', background: 'var(--bg3)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Seasonality</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
                  {seasonality.last_date ? `update ${seasonality.last_date}` : 'historical pattern'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                {seasonality.summary || 'Data seasonality tersedia.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {seasonality.monthly
                  .filter((m) => m.avg_return != null)
                  .sort((a, b) => a.month - b.month)
                  .map((m) => {
                    const positiveMonth = (m.avg_return ?? 0) >= 0
                    return (
                      <div key={m.month} style={{ padding: '10px 10px 9px', border: '1px solid var(--border)', background: 'var(--bg2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{m.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: positiveMonth ? 'var(--up)' : 'var(--down)' }}>
                            {m.prob_positive != null ? `${m.prob_positive.toFixed(0)}%` : '—'}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1, color: positiveMonth ? 'var(--up)' : 'var(--down)' }}>
                          {m.avg_return > 0 ? '+' : ''}{m.avg_return.toFixed(2)}%
                        </div>
                        <div style={{ marginTop: 6, height: 3, background: 'var(--border)' }}>
                          <div style={{ width: `${Math.min(100, Math.max(10, 50 + m.avg_return * 6))}%`, height: '100%', background: positiveMonth ? 'var(--up)' : 'var(--down)' }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderLeftWidth: 4, borderRadius: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>Skor Total Composite</p>
              <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text2)' }}>
                {merged.composite >= 75
                  ? 'Aset ini lolos seleksi profil & teknikal jangka panjang. Cocok untuk kandidat beli.'
                  : merged.composite >= 60
                    ? 'Cukup solid, tapi belum ideal. Tunggu koreksi sebelum masuk.'
                    : 'Di bawah standar. Hindari untuk portofolio jangka panjang saat ini.'}
              </p>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{merged.composite}</div>
          </div>
        </div>
      </div>
  )
}
