import { useMemo } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Spark, PH, pct, viewStock, fmtPrice } from '../components/ui/DashboardComponents'
import SectorBars from '../components/ui/SectorBars'
import StockLogo from '../components/ui/StockLogo'
import { Activity, Layers, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

function FlowRow({ s, up, onSelect }) {
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-secondary/40 transition-colors"
          onClick={() => onSelect?.(s)}
        >
          <Spark data={s.sparkline} up={up} w={40} h={20} />
          <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-foreground">{s.ticker}</div>
            <div className="text-[11px] text-muted-foreground truncate">{s.sector || s.name}</div>
          </div>
          <span className="font-mono text-[12.5px] font-semibold" style={{ color: col }}>{pct(s.changePct)}</span>
          <span className="font-mono text-[11px] text-ink-soft min-w-[68px] text-right">{fmtPrice(s.price, s.kind)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Klik untuk lihat detail {s.ticker}</TooltipContent>
    </Tooltip>
  )
}

export default function MarketPulsePage({ stocks = [], onSelectStock }) {
  const { index: spx, loading } = useMarketIndex('SPX')
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const withChange = data.filter((s) => s.changePct != null)
  const adv = withChange.filter((s) => s.changePct > 0).length
  const dec = withChange.filter((s) => s.changePct < 0).length
  const breadth = withChange.length ? Math.round(((adv - dec) / withChange.length) * 100) : 0
  const positive = (spx?.change ?? 0) >= 0

  const sectorMap = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
      if (!s.sector) return
      const g = m.get(s.sector) || { n: 0, up: 0, down: 0, sum: 0 }
      g.n += 1
      g.sum += s.changePct || 0
      if ((s.changePct || 0) > 0) g.up += 1
      if ((s.changePct || 0) < 0) g.down += 1
      m.set(s.sector, g)
    })
    return [...m.entries()]
      .map(([name, g]) => ({ name, avg: g.n ? g.sum / g.n : 0, up: g.up, down: g.down, n: g.n }))
      .sort((a, b) => b.avg - a.avg)
  }, [data])

  const gainers = [...withChange].filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 6)
  const losers = [...withChange].filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 6)
  const bestSector = sectorMap[0]

  const stats = [
    { label: 'S&P 500', val: loading ? '…' : (spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 }), sub: loading ? 'memuat data real' : `${positive ? '+' : ''}${(spx?.change ?? 0).toLocaleString('en-US')}% hari ini`, c: positive ? 'var(--up)' : 'var(--down)' },
    { label: 'Breadth', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', c: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
    { label: 'Aset Naik', val: adv, sub: `${withChange.length ? Math.round((adv / withChange.length) * 100) : 0}% dari aset aktif`, c: 'var(--up)' },
    { label: 'Aset Turun', val: dec, sub: `${withChange.length ? Math.round((dec / withChange.length) * 100) : 0}% dari aset aktif`, c: 'var(--down)' },
  ]

  return (
    <div className="fade-up">
      <PH eyebrow="Global market flow" title="Market Pulse" />

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4.5">
        <span className="text-xs text-ink-soft">Data real-time dari S&amp;P 500 dan seluruh aset.</span>
        <Badge tone="green" dot>Live</Badge>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-accent': s.c }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.c }}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div
        className="dash-grid"
        style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}
      >
        <Card>
          <CardHeader className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Layers size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[14px] font-bold text-foreground">Sektor Terkuat</CardTitle>
                <CardDescription>
                  {bestSector ? `${bestSector.name} terkorelasi` : 'rata-rata perubahan'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">avg %</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {sectorMap.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">Belum ada data</div>
            )}
            <div className="flex flex-col">
              {sectorMap.slice(0, 8).map((s) => (
                <SectorBars key={s.name} name={s.name} change={s.avg} count={s.n} up={s.up} down={s.down} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-up-dim border border-up-line flex items-center justify-center">
                  <TrendingUp size={15} className="text-up" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-[14px] font-bold text-foreground">Top Gainers</CardTitle>
                  <CardDescription>real movers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {gainers.length === 0 && (
                <div className="py-5 text-center text-xs text-muted-foreground">Tidak ada</div>
              )}
              <div className="flex flex-col">
                {gainers.map((s) => <FlowRow key={s.ticker} s={s} up onSelect={onSelectStock} />)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-down-dim border border-down-line flex items-center justify-center">
                  <TrendingDown size={15} className="text-down" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-[14px] font-bold text-foreground">Top Losers</CardTitle>
                  <CardDescription>real movers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {losers.length === 0 && (
                <div className="py-5 text-center text-xs text-muted-foreground">Tidak ada</div>
              )}
              <div className="flex flex-col">
                {losers.map((s) => <FlowRow key={s.ticker} s={s} up={false} onSelect={onSelectStock} />)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.05em] text-muted-foreground">
        <Activity size={10} />
        BREADTH = ADVANCING − DECLINING · DIHITUNG DARI RATA-RATA PERUBAHAN ASET YANG TERSEDIA
      </div>
    </div>
  )
}
