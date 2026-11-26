import { useState, useEffect, useMemo } from 'react'
import { Spark, SBar, viewStock, fmtPrice, kindLabel, PriceChart } from '../components/ui/DashboardComponents'
import { ChevronLeft, Star, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

function Metric({ label, value, good }) {
  const color = value == null ? 'var(--text3)' : good === true ? 'var(--up)' : good === false ? 'var(--down)' : 'var(--text)'
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-card border rounded-lg">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="font-mono text-xs font-semibold text-right" style={{ color }}>{value ?? '—'}</span>
    </div>
  )
}

const fmtNum = (v, d = 1) => (v == null || Number.isNaN(Number(v)) ? null : Number(v).toFixed(d))

export default function StockDetailPage({ stock, onClose, onToggleFav, favorites }) {
  const s = viewStock(stock || {})
  const isFav = (favorites || []).includes(s.ticker)

  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [period, setPeriod] = useState('3mo')
  const [loadingHistory, setLoadingHistory] = useState(false)

  const PERIODS = [
    { id: '1mo', label: '1M' },
    { id: '3mo', label: '3M' },
    { id: '6mo', label: '6M' },
    { id: '1y', label: '12M' },
    { id: '5y', label: '5Y' },
  ]

  useEffect(() => {
    let alive = true
    setLoadingDetail(true)
    setLoadingHistory(true)
    api.detail(s.ticker)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null))
      .finally(() => {
        if (alive) {
          setLoadingDetail(false)
          setLoadingHistory(false)
        }
      })
    return () => { alive = false }
  }, [s.ticker])

  useEffect(() => {
    if (period !== '3mo') {
      setLoadingHistory(true)
      const t = setTimeout(() => setLoadingHistory(false), 300)
      return () => clearTimeout(t)
    }
  }, [period])

  const merged = detail
    ? viewStock({
        ...s,
        ...detail,
        fundamental: { ...(s.fundamental || {}), ...(detail.fundamental || {}) },
        technical: { ...(s.technical || {}), ...(detail.technical || {}) },
      })
    : s
  const history = detail?.history || []
  const seasonality = detail?.seasonality
  const price = detail?.price ?? s.price
  const change = detail?.change ?? s.changePct
  const name = detail?.name ?? s.name
  const sector = detail?.sector ?? s.sector
  const positive = (change ?? 0) >= 0

  const series = useMemo(() => {
    if (!history || history.length === 0) return []
    const daysMap = { '1mo': 21, '3mo': 63, '6mo': 126, '1y': 252, '5y': 1260 }
    const n = daysMap[period] || 126
    return history.slice(-n).map((h) => h.close).filter((v) => v != null)
  }, [history, period])

  const trendPositive = series.length >= 2 ? series[series.length - 1] >= series[0] : positive
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
      <div className="sm:px-5 lg:px-7 flex items-center gap-2.5 mb-4.5 flex-wrap">
        <Button variant="outline" size="sm" onClick={onClose} aria-label="Kembali">
          <ChevronLeft size={15} />
          <span className="font-mono text-[10px] tracking-[0.06em]">KEMBALI</span>
        </Button>
        <div className="font-mono text-[10px] text-ink-faint tracking-[0.08em]">ANALISA ASET · HALAMAN DETAIL</div>
      </div>

      <Card className="sm:px-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[32px] font-extrabold text-foreground" style={{ letterSpacing: '-0.02em', margin: 0 }}>{s.ticker}</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge tone={merged.signal === 'Buy' ? 'green' : merged.signal === 'Sell' ? 'red' : 'amber'} dot>
                    {merged.signal}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Sinyal berbasis skor teknikal & fundamental</TooltipContent>
              </Tooltip>
              <Badge variant="outline">{kindLabel(merged.kind)}</Badge>
            </div>
            <p className="text-[13px] text-ink-soft mt-0.5">{name} · {sector}</p>
            <p className="text-[11px] text-ink-soft mt-1.5 flex items-center gap-1.5">
              <Clock size={11} /> Update: data real & analisa otomatis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isFav ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onToggleFav(s.ticker)}
              className={isFav ? 'border-up bg-up-dim text-up' : ''}
            >
              <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'Di Watchlist' : 'Watchlist'}
            </Button>
            <div className="text-right">
              <p className="font-display text-[28px] font-extrabold text-foreground" style={{ letterSpacing: '-0.02em', lineHeight: 1 }}>
                {price != null ? fmtPrice(price, merged.kind) : '—'}
              </p>
              <p className="font-mono text-xs mt-1 flex items-center justify-end gap-1" style={{ color: positive ? 'var(--up)' : 'var(--down)' }}>
                {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {change != null ? `${positive ? '+' : ''}${change}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Price performance chart */}
        <Card className="border bg-elevated p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <p className="text-[13px] font-semibold text-foreground">
              Performa Harga
            </p>
            {loadingHistory && <Loader2 size={14} className="animate-spin text-ink-faint mr-2" />}
            {periodReturn != null && (
              <Badge tone={periodReturn >= 0 ? 'green' : 'red'} className="ml-auto">
                {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}%
              </Badge>
            )}
          </div>

          <Tabs
            value={period}
            onValueChange={setPeriod}
            className="mb-3.5"
          >
            <TabsList className="h-8">
              {PERIODS.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="font-mono text-[11px] font-semibold h-6 px-3">
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {series.length >= 2 ? (
            <>
              <PriceChart rows={history} height={380} range={period} />
              <div className="flex justify-between gap-3 mt-2 font-mono text-[10px] text-ink-faint flex-wrap">
                <span>{series.length} sesi · {PERIODS.find((p) => p.id === period)?.label || period}</span>
                <span>Low {fmtPrice(Math.min(...series), merged.kind)} · High {fmtPrice(Math.max(...series), merged.kind)}</span>
              </div>
            </>
          ) : (
            <Spark data={s.sparkline} up={trendPositive} w={800} h={200} fluid />
          )}
        </Card>

        <Separator className="my-5" />

        {/* Fundamental + Teknikal grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <Card>
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-[13px] font-semibold text-foreground">
                {isProfile ? 'Profil Pasar' : 'Fundamental'}
              </CardTitle>
              <CardDescription className="text-[11px] font-mono text-accent">
                Skor: {merged.fundScore}/100
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex flex-col gap-1.5">
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
              {pillarEntries.length > 0 && (
                <div className="mt-3.5 grid gap-2">
                  {pillarEntries.map(([label, value]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-[3px]">
                        <span className="font-mono text-[9px] text-ink-faint tracking-[0.06em]">{String(label).toUpperCase()}</span>
                        <span className="font-mono text-[9px] text-ink-soft">{value}</span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.max(0, Number(value) || 0))}
                        className="h-1.5 rounded-full"
                        style={{ background: 'var(--line)' }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Progress
                  value={merged.fundScore}
                  className="h-2 rounded-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-[13px] font-semibold text-foreground">
                Teknikal
              </CardTitle>
              <CardDescription className="text-[11px] font-mono text-up">
                Skor: {merged.techScore}/100
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex flex-col gap-1.5">
              <Metric label="Tren (EMA D+W)" value={t.trend || null} good={t.trend === 'Uptrend'} />
              <Metric label="EMA Cross" value={t.ema_cross || null} good={t.ema_cross === 'Bullish' || t.ema_cross === 'Golden Cross'} />
              <Metric label="EMA Daily 21/34/55" value={emaDaily} good={emaBull()} />
              <Metric label="EMA Weekly 21/34/55" value={emaWeekly} good={t.ema21w != null && parseFloat(t.ema21w) > parseFloat(t.ema34w) && parseFloat(t.ema34w) > parseFloat(t.ema55w)} />
              <Metric label="RSI (14 hari)" value={t.rsi != null ? `${t.rsi}` : null} good={t.rsi > 40 && t.rsi < 70} />
              <Metric label="MACD" value={t.macd || null} good={t.macd === 'Bullish'} />
              <Metric label="Rasio Volume" value={t.vol != null ? `${t.vol}x` : null} good={t.vol >= 1} />
              <div className="mt-3">
                <Progress value={merged.techScore} className="h-2 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seasonality */}
        {seasonality?.monthly?.length > 0 && (
          <Card className="mt-5 border bg-elevated p-4">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <p className="text-[13px] font-semibold text-foreground">Seasonality</p>
              <span className="font-mono text-[10px] text-ink-faint">
                {seasonality.last_date ? `update ${seasonality.last_date}` : 'historical pattern'}
              </span>
            </div>
            <p className="text-xs text-ink-soft leading-[1.6] mb-3.5">
              {seasonality.summary || 'Data seasonality tersedia.'}
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
              {seasonality.monthly
                .filter((m) => m.avg_return != null)
                .sort((a, b) => a.month - b.month)
                .map((m) => {
                  const positiveMonth = (m.avg_return ?? 0) >= 0
                  return (
                    <div key={m.month} className="p-2.5 border bg-card">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-[9px] text-ink-faint">{m.label}</span>
                        <span className="font-mono text-[9px]" style={{ color: positiveMonth ? 'var(--up)' : 'var(--down)' }}>
                          {m.prob_positive != null ? `${m.prob_positive.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                      <div className="font-display text-[18px] font-bold leading-none" style={{ color: positiveMonth ? 'var(--up)' : 'var(--down)' }}>
                        {m.avg_return > 0 ? '+' : ''}{m.avg_return.toFixed(2)}%
                      </div>
                      <div className="mt-1.5 h-[3px] bg-line rounded-full overflow-hidden">
                        <div style={{ width: `${Math.min(100, Math.max(10, 50 + m.avg_return * 6))}%`, height: '100%', background: positiveMonth ? 'var(--up)' : 'var(--down)' }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </Card>
        )}

        {/* Composite score banner */}
        <div
          className="mt-5 flex items-center justify-between gap-4 flex-wrap p-4 bg-accent-dim border border-accent rounded-2xl"
          style={{ borderLeftWidth: 4 }}
        >
          <div>
            <p className="text-[11px] font-mono tracking-[0.1em] text-accent uppercase">Skor Total Composite</p>
            <p className="mt-1 text-xs text-ink-soft">
              {merged.composite >= 75
                ? 'Aset ini lolos seleksi profil & teknikal jangka panjang. Cocok untuk kandidat beli.'
                : merged.composite >= 60
                  ? 'Cukup solid, tapi belum ideal. Tunggu koreksi sebelum masuk.'
                  : 'Di bawah standar. Hindari untuk portofolio jangka panjang saat ini.'}
            </p>
          </div>
          <div className="font-display text-[56px] font-extrabold text-accent leading-none">{merged.composite}</div>
        </div>
      </Card>
    </div>
  )
}
