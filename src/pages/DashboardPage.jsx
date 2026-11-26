import { useMemo } from 'react'
import { useMarketIndex } from '../hooks/useMarketIndex'
import { Star, TrendingUp, TrendingDown, Layers, Target, Flame, Trophy } from 'lucide-react'
import { Spark, pct, cap, fmtPrice, viewStock } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

export default function DashboardPage({ onSelectStock, onToggleFav, favorites = [], stocks = [] }) {
  const { index: spx } = useMarketIndex('SPX')
  const { index: btc } = useMarketIndex('BTC')
  const data = useMemo(() => stocks.map(viewStock).filter((s) => s.composite != null), [stocks])

  const recs = useMemo(() => [...data].sort((a, b) => b.composite - a.composite).slice(0, 9), [data])
  const buys = data.filter((s) => s.signal === 'Buy' || s.signal === 'Strong Buy')
  const gainers = useMemo(
    () => [...data].filter((s) => (s.changePct ?? 0) > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    [data],
  )

  const bestSector = useMemo(() => {
    const m = new Map()
    data.forEach((s) => {
      if (!s.sector) return
      const g = m.get(s.sector) || { sum: 0, n: 0 }
      g.sum += s.composite
      g.n += 1
      m.set(s.sector, g)
    })
    return [...m.entries()]
      .map(([name, g]) => ({ name, avg: Math.round(g.sum / g.n), n: g.n }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
  }, [data])

  const spxPos = (spx?.change ?? 0) >= 0
  const btcPos = (btc?.change ?? 0) >= 0
  const avgScore = data.length ? Math.round(data.reduce((a, s) => a + s.composite, 0) / data.length) : 0

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <div className="page-head-eyebrow">Real-time · US Stock · ETF · Crypto</div>
          <h1 className="page-head-title">Market Dashboard</h1>
          <p className="page-head-sub">Ringkasan pasar dan kandidat terkuat berdasarkan skor composite.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge tone="green" dot>Live</Badge>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="S&P 500"
          value={(spx?.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          sub={<span style={{ color: spxPos ? 'var(--up)' : 'var(--down)' }}>{spxPos ? '+' : ''}{(spx?.change ?? 0).toFixed(2)}% hari ini</span>}
          icon={<TrendingUp size={13} />}
          accent={spxPos ? 'var(--up)' : 'var(--down)'}
        />
        <StatCard
          label="Bitcoin"
          value={btc?.price ? `$${(btc.price).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          sub={<span style={{ color: btcPos ? 'var(--up)' : 'var(--down)' }}>{btcPos ? '+' : ''}{(btc?.change ?? 0).toFixed(2)}% 24 jam</span>}
          icon={<Flame size={13} />}
          accent={btcPos ? 'var(--up)' : 'var(--down)'}
        />
        <StatCard label="Aset Dianalisa" value={data.length} sub="saham AS · ETF · kripto" icon={<Layers size={13} />} accent="var(--accent)" />
        <StatCard label="Sinyal Buy" value={buys.length} sub={`rata-rata skor ${avgScore}`} icon={<Target size={13} />} accent="var(--accent)" valueColor="var(--up)" />
      </div>

      <div className="dash-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.9fr) minmax(0, 1fr)' }}>
        {/* Top composite table */}
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Trophy size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[14px] font-bold text-foreground">Rekomendasi Teratas</CardTitle>
                <CardDescription>Skor composite tertinggi hari ini</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">{recs.length} aset</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 min-w-[220px] font-mono text-[10px] tracking-wider text-muted-foreground">ASET</TableHead>
                    <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">HARGA</TableHead>
                    <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">24H %</TableHead>
                    <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">KAP.</TableHead>
                    <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">SKOR</TableHead>
                    <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">SIGNAL</TableHead>
                    <TableHead className="text-right pr-4 w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recs.map((s) => {
                    const isFav = favorites.includes(s.ticker)
                    const up = (s.changePct ?? 0) >= 0
                    return (
                      <TableRow
                        key={s.ticker}
                        className="cursor-pointer hover:bg-secondary/40 transition-colors"
                        onClick={() => onSelectStock?.(s)}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex">
                              <Spark data={s.sparkline} up={up} w={40} h={20} />
                            </span>
                            <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold text-foreground">{s.ticker}</div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[120px]">{s.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">
                          {fmtPrice(s.price, s.kind)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[12px] font-semibold" style={{ color: up ? 'var(--up)' : 'var(--down)' }}>
                          <span className="inline-flex items-center gap-1">
                            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {pct(s.changePct)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{cap(s.mktCap) ?? '—'}</TableCell>
                        <TableCell className="text-center">
                          <ScoreCell value={s.composite} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            tone={s.signal === 'Buy' ? 'green' : s.signal === 'Sell' ? 'red' : 'amber'}
                            dot
                            className="text-[11px]"
                          >
                            {s.signal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 border-0 bg-transparent"
                                style={{ color: isFav ? 'var(--accent)' : 'var(--text3)' }}
                                onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                              >
                                <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isFav ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {recs.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">Belum ada data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side panels */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                  <Layers size={15} className="text-accent" />
                </div>
                <CardTitle className="text-[14px] font-bold text-foreground">Sektor Terkuat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {bestSector.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <span className="font-mono text-[10px] text-muted-foreground w-[18px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-foreground font-medium truncate">{r.name}</div>
                    <Progress
                      value={r.avg}
                      className="mt-1.5 h-1.5 rounded-full"
                    />
                  </div>
                  <span className="font-mono text-[12px] font-semibold text-accent w-[28px] text-right">
                    {r.avg}
                  </span>
                </div>
              ))}
              {bestSector.length === 0 && (
                <div className="py-5 text-center text-xs text-muted-foreground">Belum ada data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-up-dim border border-up-line flex items-center justify-center">
                  <TrendingUp size={15} className="text-up" />
                </div>
                <CardTitle className="text-[14px] font-bold text-foreground">Top Gainers</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex flex-col gap-1">
                {gainers.map((s) => (
                  <Button
                    key={s.ticker}
                    variant="ghost"
                    className="justify-start h-auto py-2 px-2.5 rounded-lg w-full"
                    onClick={() => onSelectStock?.(s)}
                  >
                    <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[13px] font-bold text-foreground">{s.ticker}</div>
                      <div className="text-[11px] text-muted-foreground">{s.sector}</div>
                    </div>
                    <span className="font-mono text-[12.5px] font-semibold text-up">{pct(s.changePct)}</span>
                  </Button>
                ))}
                {gainers.length === 0 && (
                  <div className="py-5 text-center text-xs text-muted-foreground">Belum ada gainer</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ScoreCell({ value }) {
  const color = value >= 80 ? 'var(--up)' : value >= 60 ? 'var(--hold)' : 'var(--down)'
  return (
    <div className="inline-flex items-center gap-2 justify-end min-w-[78px]">
      <Progress value={Math.max(0, Math.min(100, value))} className="w-[40px] h-1.5 rounded-full" />
      <span className="font-mono text-[12px] font-semibold w-[22px] text-right" style={{ color }}>{value}</span>
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
