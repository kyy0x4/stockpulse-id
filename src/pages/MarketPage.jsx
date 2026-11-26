import { useMemo, useState } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Spark, pct, viewStock, fmtPrice, PriceChart } from '../components/ui/DashboardComponents'
import { Activity, Layers, TrendingUp, TrendingDown } from 'lucide-react'
import StockLogo from '../components/ui/StockLogo'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Progress,
} from '@/components/ui/progress'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

const MARKET_ASSETS = [
  { code: 'SPX', label: 'S&P 500' },
  { code: 'IXIC', label: 'Nasdaq' },
  { code: 'DJI', label: 'Dow Jones' },
  { code: 'BTC', label: 'Bitcoin' },
  { code: 'ETH', label: 'Ethereum' },
]

export default function MarketPage({ onSelectStock, stocks = [] }) {
  const [code, setCode] = useState('SPX')
  const { index, loading: indexLoading } = useMarketIndex(code)
  const data = useMemo(() => stocks.map(viewStock), [stocks])

  const sectorPerf = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
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

  const withPrice = data.filter((s) => s.changePct != null)
  const adv = withPrice.filter((s) => s.changePct > 0).length
  const dec = withPrice.filter((s) => s.changePct < 0).length
  const breadth = withPrice.length ? Math.round(((adv - dec) / withPrice.length) * 100) : 0
  const indexPos = (index?.change ?? 0) >= 0
  const indexHistory = (index?.history || []).slice(-60)

  const gainers = withPrice.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5)
  const losers = withPrice.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5)

  const stats = [
    {
      label: index?.name || code,
      val: indexLoading ? '…' : (index?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 }),
      sub: indexLoading ? 'memuat…' : `${indexPos ? '+' : ''}${(index?.change ?? 0).toFixed(2)}% hari ini`,
      c: indexPos ? 'var(--up)' : 'var(--down)',
    },
    { label: 'Aset Naik', val: adv, sub: `${withPrice.length ? Math.round((adv / withPrice.length) * 100) : 0}% universe`, c: 'var(--up)' },
    { label: 'Aset Turun', val: dec, sub: `${withPrice.length ? Math.round((dec / withPrice.length) * 100) : 0}% universe`, c: 'var(--down)' },
    { label: 'Breadth', val: `${breadth >= 0 ? '+' : ''}${breadth}`, sub: 'advancing − declining', c: breadth >= 0 ? 'var(--up)' : 'var(--down)' },
  ]

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <div className="page-head-eyebrow">Pasar global · Saham AS &amp; Kripto</div>
          <h1 className="page-head-title">Market Overview</h1>
          <p className="page-head-sub">Ringkasan indeks, breadth, dan rotasi sektor.</p>
        </div>
        <Badge tone="green" dot>Live</Badge>
      </div>

      <Tabs value={code} onValueChange={setCode} className="mb-4">
        <TabsList className="h-9">
          {MARKET_ASSETS.map((a) => (
            <TabsTrigger key={a.code} value={a.code} className="text-[13px]">{a.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="stat-grid">
        {stats.map((x) => (
          <div key={x.label} className="stat-card" style={{ '--stat-accent': x.c }}>
            <div className="stat-label">{x.label}</div>
            <div className="stat-value" style={{ color: x.c }}>{x.val}</div>
            <div className="stat-sub">{x.sub}</div>
          </div>
        ))}
      </div>

      <div
        className="dash-grid mb-4"
        style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2.5fr) minmax(0, 1fr)' }}
      >
        <Card>
          <CardHeader className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Activity size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[14px] font-bold text-foreground">{index?.name || code}</CardTitle>
                <CardDescription>60 sesi terakhir</CardDescription>
              </div>
              <Badge tone={indexPos ? 'green' : 'red'} className="text-[11px] font-mono">
                {indexLoading ? '…' : `${indexPos ? '+' : ''}${(index?.change ?? 0).toFixed(2)}%`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {indexHistory.length >= 2 ? (
              <PriceChart rows={indexHistory} height={400} />
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">Memuat data indeks</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Layers size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[14px] font-bold text-foreground">Performa Sektor</CardTitle>
                <CardDescription>avg %</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 max-h-[360px] overflow-y-auto">
            {sectorPerf.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">Belum ada data</div>
            )}
            <div className="flex flex-col gap-1">
              {sectorPerf.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2.5 py-2"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <span className="text-[12px] text-foreground font-medium truncate">{s.name}</span>
                      <span className="font-mono text-[11px]" style={{ color: s.change >= 0 ? 'var(--up)' : 'var(--down)' }}>
                        {pct(s.change)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(3, 50 + s.change * 12))}
                      className="h-1.5 rounded-full"
                    />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground w-[18px] text-right">{s.stocks}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {[
          { key: 'gainers', label: 'Top Gainers', list: gainers, color: 'var(--up)', icon: TrendingUp, tone: 'green' },
          { key: 'losers', label: 'Top Losers', list: losers, color: 'var(--down)', icon: TrendingDown, tone: 'red' },
        ].map((block) => {
          const Icon = block.icon
          return (
            <Card key={block.key}>
              <CardHeader className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: block.key === 'gainers' ? 'var(--up-dim)' : 'var(--down-dim)', border: `1px solid ${block.key === 'gainers' ? 'var(--up-line)' : 'var(--down-line)'}` }}>
                    <Icon size={15} style={{ color: block.color }} />
                  </div>
                  <CardTitle className="text-[14px] font-bold text-foreground">{block.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                {block.list.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">Tidak ada</div>
                )}
                <div className="flex flex-col gap-0.5">
                  {block.list.map((s) => (
                    <Tooltip key={s.ticker}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelectStock?.(s)}
                          className="flex items-center gap-2.5 py-2 px-1.5 -mx-1.5 rounded-lg cursor-pointer hover:bg-secondary/40 transition-colors"
                        >
                          <Spark data={s.sparkline} up={block.key === 'gainers'} w={40} h={20} />
                          <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-foreground">{s.ticker}</div>
                            <div className="text-[11px] text-muted-foreground">{s.sector}</div>
                          </div>
                          <span className="font-mono text-[12.5px] font-semibold" style={{ color: block.color }}>
                            {pct(s.changePct)}
                          </span>
                          <span className="font-mono text-[11px] text-ink-soft min-w-[66px] text-right">
                            {fmtPrice(s.price, s.kind)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Klik untuk lihat detail {s.ticker}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
