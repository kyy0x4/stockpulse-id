import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { accountApi } from '../api/auth'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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

  const canAdd = alerts.length < limit

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
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 8, paddingBottom: 40 }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12
        }}>
          <div>
            <h1 className="font-display text-[24px] font-extrabold text-foreground" style={{ margin: 0 }}>
              <Bell size={22} className="text-accent" style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Alerts
            </h1>
            <p className="text-xs text-muted-foreground" style={{ marginTop: 4 }}>
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
            className="rounded-xl border bg-card p-4"
          >
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
            <p className="text-sm text-muted-foreground">Belum ada alert. Tambahin yang pertama!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {alerts.map((al) => {
              const typeLabel = ALERT_TYPES.find((t) => t.value === al.type)?.label || al.type
              return (
                <div
                  key={al.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3.5 py-3"
                >
                  <span className="font-mono text-[13px] font-bold text-accent min-w-[70px]">
                    {al.ticker}
                  </span>
                  <span className="text-[13px] text-ink-soft flex-1">
                    {typeLabel}
                    {al.value != null && (
                      <span className="ml-1.5 font-mono text-foreground">${al.value}</span>
                    )}
                  </span>
                  {al.triggered && (
                    <Badge tone="green">Tembus</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(al.id)}
                    aria-label="Hapus alert"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
