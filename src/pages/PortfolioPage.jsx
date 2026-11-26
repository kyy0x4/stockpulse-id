import { useState, useCallback, useEffect } from 'react'
import { accountApi } from '../api/auth'
import { PH } from '../components/ui/DashboardComponents'
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'

const fmt = (n) => {
  if (n == null) return '—'
  const v = Number(n)
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const sig = (n) => (n == null || Number(n) === 0 ? 'var(--text3)' : Number(n) > 0 ? 'var(--up)' : 'var(--down)')

export default function PortfolioPage({ stocks, onSelectStock }) {
  const [data, setData] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, t] = await Promise.all([accountApi.portfolio(), accountApi.trades()])
      setData(p)
      setTrades(t.trades || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nameOf = (t) => {
    const s = stocks.find((x) => x.ticker === t)
    return s?.name || t
  }

  const openModal = (holding) => {
    setModal({
      ticker: holding?.ticker || '',
      side: holding?.side || 'buy',
      qty: '',
      price: holding?.price ?? '',
      fee: 0,
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const submitTrade = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await accountApi.addTrade({
        ticker: modal.ticker,
        side: modal.side,
        qty: parseFloat(modal.qty),
        price: parseFloat(modal.price),
        fee: parseFloat(modal.fee || 0),
        trade_date: modal.date,
      })
      setModal(null)
      toast.success('Transaksi dicatat')
      load()
    } catch (err) {
      setError(err.message)
      toast.error(err.message || 'Gagal simpan transaksi')
    }
  }

  const modalInput = (label, value, onChange, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )

  const s = data?.summary || {}
  const holdings = data?.holdings || []

  return (
    <div className="fade-up">
      <PH eyebrow="Portofolio pribadi · realtime" title="Portofolio Saya" />

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
          {error}
        </div>
      )}

      <div className="stat-grid">
        {[
          ['Nilai Portofolio', fmt(s.total_value), sig(s.total_pnl), 'var(--accent)'],
          ['Modal Investasi', fmt(s.total_invested), 'var(--text)', 'var(--border2)'],
          ['Unrealized P&L', fmt(s.total_pnl), sig(s.total_pnl), sig(s.total_pnl)],
          ['Return', s.total_invested ? `${((s.total_pnl / s.total_invested) * 100).toFixed(2)}%` : '—', sig(s.total_pnl), sig(s.total_pnl)],
        ].map(([label, value, color, accent]) => (
          <div key={label} className="stat-card" style={{ '--stat-accent': accent }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2.5">
        <div>
          <div className="text-[14px] font-bold text-foreground">Posisi Terbuka</div>
          <div className="text-xs text-muted-foreground">{holdings.length} aset di portofolio</div>
        </div>
        <Button onClick={() => openModal(null)}>
          <Plus size={15} /> Catat Transaksi
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 min-w-[180px] font-mono text-[10px] tracking-wider text-muted-foreground">ASET</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">HARGA</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">QTY</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">AVG COST</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">NILAI</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">UNREALIZED P&L</TableHead>
                <TableHead className="text-right pr-4 w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => (
                <TableRow
                  key={h.ticker}
                  className="cursor-pointer hover:bg-secondary/40 transition-colors"
                  onClick={() => onSelectStock && onSelectStock({ ticker: h.ticker })}
                >
                  <TableCell className="pl-4">
                    <div className="text-[13px] font-bold text-foreground">{h.ticker}</div>
                    <div className="text-[11px] text-muted-foreground">{nameOf(h.ticker)}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">{fmt(h.price)}</TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{Number(h.qty).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{fmt(h.avg_cost)}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">{fmt(h.value)}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-semibold" style={{ color: sig(h.pnl) }}>
                    {h.pnl == null ? '—' : fmt(h.pnl)}
                    {h.pnl_pct != null && (
                      <span className="ml-1 text-[11px] font-normal" style={{ color: 'var(--text3)' }}>
                        ({h.pnl_pct > 0 ? '+' : ''}{h.pnl_pct}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openModal({ ...h, side: 'sell' })}>
                      Jual
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && holdings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-7">
                    Belum ada posisi. Klik <b className="text-accent">Catat Transaksi</b> untuk mulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mb-2.5">
        <div className="text-[14px] font-bold text-foreground">Riwayat Transaksi</div>
        <div className="text-xs text-muted-foreground">{trades.length} transaksi tercatat</div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 font-mono text-[10px] tracking-wider text-muted-foreground">TANGGAL</TableHead>
                <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground">TICKER</TableHead>
                <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">AKSI</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">QTY</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">HARGA</TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">FEE</TableHead>
                <TableHead className="text-right pr-4 font-mono text-[10px] tracking-wider text-muted-foreground">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="pl-4 font-mono text-[12px] text-muted-foreground">
                    {(t.trade_date || '').slice(0, 10)}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] font-semibold text-foreground">{t.ticker}</TableCell>
                  <TableCell className="text-center">
                    <Badge tone={t.side === 'buy' ? 'green' : 'red'} className="text-[10px]">
                      {String(t.side).toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">
                    {Number(t.qty).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{fmt(t.price)}</TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{fmt(t.fee)}</TableCell>
                  <TableCell className="text-right pr-4 font-mono text-[13px] font-semibold text-foreground">
                    {fmt(Number(t.qty) * Number(t.price) + (t.side === 'buy' ? Number(t.fee) : -Number(t.fee)))}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-7">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                {modal?.side === 'buy' ? <TrendingUp size={16} className="text-up" /> : <TrendingDown size={16} className="text-down" />}
                {modal?.ticker || 'Pilih Ticker'}
              </span>
            </DialogTitle>
            <DialogDescription>Catat transaksi baru ke portofolio</DialogDescription>
          </DialogHeader>

          <Tabs
            value={modal?.side}
            onValueChange={(v) => setModal({ ...modal, side: v })}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="buy" className={modal?.side === 'buy' ? 'text-up' : ''}>
                <TrendingUp size={13} /> Beli
              </TabsTrigger>
              <TabsTrigger value="sell" className={modal?.side === 'sell' ? 'text-down' : ''}>
                <TrendingDown size={13} /> Jual
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {error && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive text-xs">
              {error}
            </div>
          )}

          <form onSubmit={submitTrade} className="flex flex-col gap-3.5">
            {modalInput('Ticker', modal.ticker, (v) => setModal({ ...modal, ticker: v.toUpperCase() }))}
            {modalInput('Qty (unit)', modal.qty, (v) => setModal({ ...modal, qty: v }), 'number')}
            {modalInput('Harga / unit (USD)', modal.price, (v) => setModal({ ...modal, price: v }), 'number')}
            {modalInput('Fee', modal.fee, (v) => setModal({ ...modal, fee: v }), 'number')}
            {modalInput('Tanggal', modal.date, (v) => setModal({ ...modal, date: v }), 'date')}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button type="submit">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
