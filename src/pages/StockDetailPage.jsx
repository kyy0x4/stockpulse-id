import { useState, useEffect } from 'react'
import { Spark, SBar, sigColor, sigBg, viewStock, LineChart } from '../components/ui/DashboardComponents'
import { ChevronLeft, Star, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react'
import { api } from '../api/client'

function Metric({ label, value, good }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: value == null ? 'var(--text3)' : good ? 'var(--up)' : 'var(--down)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )
}

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

  const f = merged.fundamental || {}
  const t = merged.technical || {}

  const emaDaily = t.ema21 != null ? `${t.ema21} / ${t.ema34} / ${t.ema55}` : null
  const emaWeekly = t.ema21w != null ? `${t.ema21w} / ${t.ema34w} / ${t.ema55w}` : null
  const emaBull = () => {
    const a = parseFloat(t.ema21), b = parseFloat(t.ema34), c = parseFloat(t.ema55)
    return Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && a > b && b > c
  }

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <div className="sm:px-5 lg:px-7" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button
          onClick={onClose}
          style={{ border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', padding: '7px 10px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          aria-label="Kembali"
        >
          <ChevronLeft size={15} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em' }}>KEMBALI</span>
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em' }}>ANALISA SAHAM · HALAMAN DETAIL</div>
      </div>

      <div className="card sm:px-6" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>{s.ticker}</h2>
                <span className="sig" style={{ color: sigColor(s.signal, 'dark'), background: sigBg(s.signal), borderColor: `${sigColor(s.signal, 'dark')}40` }}>
                  {s.signal}
                </span>
                {detail?.signal && (
                  <span className="chip" style={{ color: 'var(--text2)' }}>{String(detail.signal).toUpperCase()}</span>
                )}
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
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{price != null ? price.toLocaleString('id-ID') : '—'}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: trendPositive ? 'var(--up)' : 'var(--down)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {trendPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {change != null ? `${positive ? '+' : ''}${change}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, border: '1px solid var(--border)', background: 'var(--bg3)', padding: 16, borderRadius: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Performa Harga {history.length > 0 ? '(3 bulan)' : '(7 sessie)'}</p>
              {loadingDetail && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)', marginLeft: 4 }} />}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: trendPositive ? 'var(--up)' : 'var(--down)' }}>TREN</span>
            </div>
            {series.length >= 2 ? (
              <LineChart values={series} up={trendPositive} h={200} />
            ) : (
              <Spark data={s.sparkline} up={trendPositive} w={800} h={120} fluid />
            )}
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Fundamental</p>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Skor: {s.fundScore}/100</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Metric label="PER (Price to Earnings)" value={f.per != null ? `${f.per}x` : null} good={f.per > 0 && f.per < 15} />
                <Metric label="PBV (Price to Book)" value={f.pbv != null ? `${f.pbv}x` : null} good={f.pbv < 3} />
                <Metric label="ROE (Return on Equity)" value={f.roe != null ? `${f.roe}%` : null} good={f.roe > 15} />
                <Metric label="DER (Debt to Equity)" value={f.der != null ? `${f.der}x` : null} good={f.der < 1} />
                <Metric label="Pertumbuhan Laba" value={f.growth != null ? `${f.growth}%` : null} good={f.growth > 10} />
              </div>
              <div style={{ marginTop: 12 }}>
                <SBar v={s.fundScore} color="var(--accent)" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Teknikal</p>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--up)' }}>Skor: {s.techScore}/100</span>
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
                <SBar v={s.techScore} color="var(--up)" />
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
                {s.composite >= 75
                  ? 'Saham ini lolos seleksi fundamental & teknikal jangka panjang. Cocok untuk kandidat beli.'
                  : s.composite >= 60
                    ? 'Cukup solid, tapi belum ideal. Tunggu koreksi sebelum masuk.'
                    : 'Di bawah standar. Hindari untuk portofolio jangka panjang saat ini.'}
              </p>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{s.composite}</div>
          </div>
        </div>
      </div>
  )
}
