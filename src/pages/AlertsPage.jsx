import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { accountApi } from '../api/auth'
import { Bell, Plus, Trash2, X } from 'lucide-react'
import { api } from '../api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

const ALERT_TYPES = [
  { value: 'price_above', label: 'Harga di atas' },
  { value: 'price_below', label: 'Harga di bawah' },
  { value: 'signal_buy', label: 'Sinyal BUY' },
  { value: 'signal_sell', label: 'Sinyal SELL' },
]

export default function AlertsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [limit, setLimit] = useState(3)
  const [tickers, setTickers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [form, setForm] = useState({
    ticker: '',
    type: 'price_above',
    value: null,
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      accountApi.alerts(),
      api.tickers().then((r) => r.tickers || [])
    ]).then(([al, tk]) => {
      if (!alive) return
      setAlerts(al.alerts || [])
      setLimit(al.limit ?? 3)
      setTickers(tk)
      setLoading(false)
    }).catch(() => {
      if (alive) setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const canAdd = limit === null || alerts.length < limit

  const save = async () => {
    if (!form.ticker) return
    const payload = {
      ticker: form.ticker,
      type: form.type,
      value: form.type.startsWith('price_') ? Number(form.value) : null
    }
    try {
      await accountApi.addAlert(payload)
      const res = await accountApi.alerts()
      setAlerts(res.alerts || [])
      setShowForm(false)
      setForm({ ticker: '', type: 'price_above', value: null })
      toast.success('Alert ditambahkan')
    } catch (e) {
      toast.error(e.message || 'Gagal menambah alert')
    }
  }

  const remove = async (id) => {
    await accountApi.removeAlert(id).catch(() => {})
    setAlerts(alerts.filter((a) => a.id !== id))
    toast.success('Alert dihapus')
  }

  return (
    <div className="page-wrap pt-2 pb-10">
      <div className="max-w-[880px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-[24px] font-extrabold text-foreground m-0 flex items-center gap-2">
              <Bell size={22} className="text-accent" />
              Alerts
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.length} dari {limit === null ? 'unlimited' : limit} alert aktif
              {limit !== null && alerts.length >= limit && (
                <span className="ml-2 text-hold">(limit tercapai)</span>
              )}
            </p>
          </div>
          <Button
            variant={canAdd ? 'default' : 'outline'}
            size="sm"
            onClick={() => canAdd ? setShowForm(true) : navigate('/pricing', { state: { upgrade: true } })}
          >
            <Plus size={14} /> {canAdd ? 'Tambah Alert' : 'Upgrade untuk Limit'}
          </Button>
        </div>

        {/* Add-alert form */}
        {showForm && canAdd && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-4 mb-5"
          >
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[13px] font-semibold text-foreground">Tambah Alert Baru</Label>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}>
                <X size={14} />
              </Button>
            </div>
            <Separator className="mb-4" />
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Ticker</Label>
                <Select
                  value={form.ticker}
                  onValueChange={(v) => setForm({ ...form, ticker: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih ticker…" />
                  </SelectTrigger>
                  <SelectContent>
                    {tickers.map((t) => (
                      <SelectItem key={t.ticker} value={t.ticker}>
                        {t.ticker} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 w-[150px]">
                <Label className="text-xs text-muted-foreground">Jenis</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({
                    ...form, type: v,
                    value: v.startsWith('price_') ? form.value : null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.type.startsWith('price_') && (
                <div className="flex flex-col gap-1.5 w-[140px]">
                  <Label className="text-xs text-muted-foreground">Target harga</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.value ?? ''}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-end gap-2">
                <Button onClick={save}>Simpan</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Memuat alert…</div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card py-12 text-center">
            <Bell size={28} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Belum ada alert. Tambahin yang pertama!</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 font-mono text-[10px] tracking-wider text-muted-foreground">TICKER</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider text-muted-foreground">JENIS</TableHead>
                  <TableHead className="text-right font-mono text-[10px] tracking-wider text-muted-foreground">TARGET</TableHead>
                  <TableHead className="text-center font-mono text-[10px] tracking-wider text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right pr-4 w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((al) => {
                  const typeLabel = ALERT_TYPES.find((t) => t.value === al.type)?.label || al.type
                  const isPrice = al.type.startsWith('price_')
                  return (
                    <TableRow key={al.id}>
                      <TableCell className="pl-4 font-mono text-[13px] font-bold text-accent">
                        {al.ticker}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={al.type === 'signal_buy' ? 'green' : al.type === 'signal_sell' ? 'red' : 'blue'}
                        >
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {isPrice && al.value != null ? `$${al.value}` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {al.triggered ? (
                          <Badge tone="green">Tembus</Badge>
                        ) : (
                          <Badge variant="outline">Menunggu</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(al.id)}
                          aria-label="Hapus alert"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus alert?</DialogTitle>
            <DialogDescription>
              Alert akan dihapus permanen dan tidak bisa dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => { remove(confirmDelete); setConfirmDelete(null) }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
