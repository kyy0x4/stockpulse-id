import { useMemo } from 'react'
import { PH, pct, viewStock, cap, fmtPrice, kindLabel } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'
import { Star, X, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'

function ScoreCell({ value, color }) {
  const c = value >= 80 ? 'var(--up)' : value >= 60 ? 'var(--hold)' : 'var(--down)'
  return (
    <div className="inline-flex items-center gap-1.5 justify-end min-w-[74px]">
      <Progress value={Math.max(0, Math.min(100, value))} className="w-[38px] h-1.5 rounded-full" />
      <span className="font-mono text-[12px] font-semibold w-5 text-right" style={{ color: c }}>{value}</span>
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
          <div className="stat-label"><TrendingUp size={12} /> Aset Naik</div>
          <div className="stat-value" style={{ color: 'var(--up)' }}>{up}</div>
          <div className="stat-sub">hari ini</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--down)' }}>
          <div className="stat-label"><TrendingDown size={12} /> Aset Turun</div>
          <div className="stat-value" style={{ color: 'var(--down)' }}>{down}</div>
          <div className="stat-sub">hari ini</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 min-w-[210px] font-mono text-[10px] tracking-wider text-muted-foreground">ASET</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">HARGA</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">24H %</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">KAP.</TableHead>
                <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">FUND.</TableHead>
                <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">TECH.</TableHead>
                <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">SIGNAL</TableHead>
                <TableHead className="text-right pr-4 w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {watched.map((s) => (
                <TableRow
                  key={s.ticker}
                  className="cursor-pointer hover:bg-secondary/40 transition-colors"
                  onClick={() => onSelectStock?.(s)}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-foreground">{s.ticker}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{kindLabel(s.kind)}</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{s.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">
                    {fmtPrice(s.price, s.kind)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] font-semibold" style={{ color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {pct(s.changePct)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{cap(s.mktCap) ?? '—'}</TableCell>
                  <TableCell className="text-center">
                    <ScoreCell value={s.fundScore} />
                  </TableCell>
                  <TableCell className="text-center">
                    <ScoreCell value={s.techScore} color="var(--accent)" />
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
                          className="h-7 w-7 border-0 bg-transparent text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                        >
                          <X size={13} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hapus dari watchlist</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {watched.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Watchlist kosong, tambahkan aset di bawah
            </div>
          )}
        </div>
      </Card>

      <div className="mt-5">
        <Card>
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-[14px] font-semibold text-foreground">Tambah ke Watchlist</CardTitle>
            <CardDescription>Klik aset untuk mulai memantau</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {avail.length === 0 ? (
              <div className="py-4 text-center font-mono text-[10px] text-muted-foreground tracking-wider">
                SEMUA ASET SUDAH DI WATCHLIST
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {avail.map((s) => (
                  <Button
                    key={s.ticker}
                    variant="outline"
                    size="sm"
                    className="justify-between h-10 text-xs font-mono"
                    onClick={() => onToggleFav?.(s.ticker)}
                  >
                    <span className="flex items-center gap-2">
                      <Plus size={13} className="text-accent" />
                      <span className="text-foreground font-semibold">{s.ticker}</span>
                    </span>
                    <span style={{ color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>
                      {pct(s.changePct)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
