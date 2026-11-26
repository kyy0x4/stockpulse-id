import { useMemo, useState } from 'react'
import {
  Star, Download, ArrowUpDown, ChevronDown, ChevronUp, Activity,
  TrendingUp, TrendingDown, Layers, Target,
} from 'lucide-react'
import { Spark, pct, viewStock, cap, vol, fmtPrice, kindLabel } from '../components/ui/DashboardComponents'
import StockLogo from '../components/ui/StockLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

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

const COLUMNS = [
  { k: 'ticker', label: 'Aset', cls: 'text-left' },
  { k: 'price', label: 'Harga', cls: 'text-right' },
  { k: 'changePct', label: '24h %', cls: 'text-right' },
  { k: 'volume', label: 'Volume', cls: 'text-right' },
  { k: 'mktCap', label: 'Kap.', cls: 'text-right' },
  { k: 'sector', label: 'Sektor', cls: 'text-left' },
  { k: 'pe', label: 'P/E', cls: 'text-right' },
  { k: 'roe', label: 'ROE%', cls: 'text-right' },
  { k: 'growth', label: 'Growth', cls: 'text-right' },
  { k: 'rsi', label: 'RSI', cls: 'text-center' },
  { k: 'trend', label: 'Trend', cls: 'text-center' },
  { k: 'composite', label: 'Skor', cls: 'text-center' },
  { k: 'signal', label: 'Signal', cls: 'text-center' },
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
        <div className="flex gap-2 items-center">
          <Badge tone="green" dot>Live</Badge>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </Button>
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
      <Tabs value={kind} onValueChange={setKind} className="w-full">
        <TabsList className="h-9 w-full sm:w-fit">
          {KINDS.map((k) => (
            <TabsTrigger key={k.id} value={k.id} className="text-[13px] gap-1.5">
              {k.label}
              <span className="font-mono text-[10px] text-muted-foreground">
                {k.id === 'all' ? data.length : data.filter((s) => s.kind === k.id).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center my-4">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-mono text-[11px] text-ink-faint">SEKTOR</span>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>{s === 'All' ? 'Semua' : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sig} onValueChange={setSig}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGNALS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3 min-w-[220px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] font-mono text-ink-faint">SKOR MIN</span>
            </TooltipTrigger>
            <TooltipContent>Skrining aset dengan skor composite minimal</TooltipContent>
          </Tooltip>
          <Slider
            value={[minScore]}
            onValueChange={(v) => setMinScore(v[0])}
            max={100}
            step={5}
            className="w-[140px]"
          />
          <span className="font-mono text-[11px] text-foreground w-[30px]">
            {minScore === 0 ? '—' : `≥ ${minScore}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className={`pl-4 text-left font-mono text-[10px] tracking-wider text-muted-foreground min-w-[210px] ${sortK === 'ticker' ? 'text-accent' : ''}`}
                  onClick={() => handleSort('ticker')}
                >
                  <span className="inline-flex items-center gap-1 cursor-pointer">
                    Aset <SortIcon active={sortK === 'ticker'} dir={sortD} />
                  </span>
                </TableHead>
                {COLUMNS.slice(1).map((c) => (
                  <TableHead
                    key={c.k}
                    className={`font-mono text-[10px] tracking-wider text-muted-foreground ${c.cls} ${sortK === c.k ? 'text-accent' : ''}`}
                    onClick={() => handleSort(c.k)}
                  >
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      {c.label} <SortIcon active={sortK === c.k} dir={sortD} />
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-center w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s, i) => {
                const isFav = favorites.includes(s.ticker)
                const up = (s.changePct ?? 0) >= 0
                return (
                  <TableRow
                    key={s.ticker}
                    className="cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => onSelectStock?.(s)}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-ink-faint w-[18px] text-right">{i + 1}</span>
                        <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} logoFallback={s.logoFallback} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-foreground">{s.ticker}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {s.kind === 'crypto' ? 'KRP' : s.kind === 'etf' ? 'ETF' : 'US'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{s.name}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">
                      {fmtPrice(s.price, s.kind)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-[12px] font-semibold" style={{ color: up ? 'var(--up)' : 'var(--down)' }}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {pct(s.changePct)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{vol(s.volume) ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{cap(s.mktCap) ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[11px]">{s.sector}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] text-muted-foreground">
                      {s.pe != null ? `${Number(s.pe).toFixed(1)}x` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] text-muted-foreground">
                      {s.roe != null ? `${Number(s.roe).toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px]" style={{ color: s.growth != null && s.growth > 10 ? 'var(--up)' : 'var(--text2)' }}>
                      {s.growth != null ? `${Number(s.growth).toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-[12px] font-medium" style={{ color: rsiColor(s.rsi) }}>
                      {s.rsi != null ? Number(s.rsi).toFixed(0) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.trend ? (
                        <Badge tone={s.trend === 'Uptrend' ? 'green' : s.trend === 'Downtrend' ? 'red' : 'amber'} className="text-[11px]">
                          {s.trend}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreCell value={s.composite ?? 0} />
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
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 border-0 bg-transparent cursor-pointer"
                        style={{ color: isFav ? 'var(--accent)' : 'var(--text3)' }}
                        onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                        aria-label="Watchlist"
                      >
                        <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {rows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Tidak ada aset yang cocok dengan filter
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between font-mono text-[11px] text-ink-faint">
        <span>{rows.length} / {data.length} aset ditampilkan</span>
        <span>Klik header kolom untuk mengurutkan</span>
      </div>
    </div>
  )
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown size={10} style={{ opacity: 0.4 }} />
  return dir === -1
    ? <ChevronDown size={11} className="text-accent" />
    : <ChevronUp size={11} className="text-accent" />
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
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2 justify-end min-w-[84px]">
          <Progress value={Math.max(0, Math.min(100, value))} className="w-[44px] h-1.5 rounded-full" />
          <span className="font-mono text-[12px] font-semibold w-[22px] text-right" style={{ color }}>{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Skor composite {value}/100</TooltipContent>
    </Tooltip>
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
