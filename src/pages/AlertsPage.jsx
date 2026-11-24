import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { accountApi } from '../api/auth'
import { Bell, Plus, Trash2, X } from 'lucide-react'
import { api } from '../api/client'

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
    } catch (e) {
      alert(e.message || 'Gagal menambah alert')
    }
  }

  const remove = async (id) => {
    await accountApi.removeAlert(id).catch(() => {})
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 8, paddingBottom: 40 }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
              color: 'var(--text)', margin: 0
            }}>
              <Bell size={22} style={{ color: 'var(--accent)', verticalAlign: '-3px', marginRight: 6 }} />
              Alerts
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              {alerts.length} dari {limit === null ? 'unlimited' : limit} alert aktif
              {limit !== null && alerts.length >= limit && (
                <span style={{ color: 'var(--hold)', marginLeft: 8 }}>(limit tercapai)</span>
              )}
            </p>
          </div>
          <button
            onClick={() => canAdd ? setShowForm(true) : navigate('/pricing', { state: { upgrade: true } })}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--accent-line)',
              background: canAdd ? 'var(--accent-dim)' : 'var(--bg3)',
              color: canAdd ? 'var(--accent)' : 'var(--text3)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <Plus size={14} /> {canAdd ? 'Tambah Alert' : 'Upgrade untuk Limit'}
          </button>
        </div>

        {showForm && canAdd && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, marginBottom: 16,
              display: 'flex', gap: 10, flexWrap: 'wrap'
            }}
          >
            <select
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              style={{
                flex: 1, minWidth: 120, padding: '8px 10px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text)', fontSize: 13
              }}
            >
              <option value="">Pilih ticker…</option>
              {tickers.map((t) => (
                <option key={t.ticker} value={t.ticker}>{t.ticker} — {t.name}</option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, value: e.target.value.startsWith('price_') ? form.value : null })}
              style={{
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text)', fontSize: 13
              }}
            >
              {ALERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {form.type.startsWith('price_') && (
              <input
                type="number"
                placeholder="Target harga"
                value={form.value ?? ''}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                style={{
                  width: 130, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg3)',
                  color: 'var(--text)', fontSize: 13
                }}
              />
            )}
            <button
              onClick={save}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#0b0e14',
                fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text2)', cursor: 'pointer'
              }}
            >
              Batal
            </button>
          </motion.div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Memuat alert…</div>
        ) : alerts.length === 0 ? (
          <div style={{
            padding: 50, textAlign: 'center', background: 'var(--bg2)',
            border: '1px dashed var(--border)', borderRadius: 14
          }}>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Belum ada alert. Tambahin yang pertama!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((al) => {
              const typeLabel = ALERT_TYPES.find((t) => t.value === al.type)?.label || al.type
              return (
                <div key={al.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'var(--bg2)',
                  border: '1px solid var(--border)', borderRadius: 10
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                    color: 'var(--accent)', minWidth: 70
                  }}>{al.ticker}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>
                    {typeLabel}
                    {al.value != null && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', marginLeft: 6 }}>${al.value}</span>}
                  </span>
                  {al.triggered && (
                    <span className="tag tag-green" style={{ fontSize: 10 }}>Tembus</span>
                  )}
                  <button onClick={() => remove(al.id)} style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--down)', padding: 4, borderRadius: 6
                  }} aria-label="Hapus alert">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
