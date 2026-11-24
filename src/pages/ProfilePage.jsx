import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import { accountApi } from '../api/auth'
import { motion } from 'framer-motion'
import {
  Mail, Lock, Shield, Bell, CreditCard, Download,
  LogOut, Pencil, Star, TrendingUp, AlertTriangle, Check
} from 'lucide-react'

const PLAN_META = {
  free: { label: 'Free', color: 'var(--text3)', limit: 3 },
  pro: { label: 'Pro', color: 'var(--accent)', limit: 20 },
  enterprise: { label: 'Enterprise', color: 'var(--hold)', limit: null },
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([
      accountApi.alerts().then((r) => r.alerts || []),
      accountApi.watchlist().then((r) => r.tickers || []),
      accountApi.portfolio().catch(() => null)
    ]).then(([al, wl, pf]) => {
      if (!alive) return
      setAlerts(al)
      setWatchlist(wl)
      setPortfolio(pf)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const plan = user?.plan || 'free'
  const planMeta = PLAN_META[plan]

  const show = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const saveProfile = async () => {
    setSaving(true)
    // Stub: update name (requires a backend endpoint; keep local state for now)
    setEditing(false)
    setSaving(false)
    show('Profil disimpan ✓')
  }

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="cg-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          height: 32, width: 32, borderRadius: 8, background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--accent-line)'
        }}>
          <Icon size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )

  return (
    <div className="page-wrap" style={{ paddingTop: 8 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="cg-card"
          style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}
        >
          <div style={{
            height: 64, width: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent-2), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#0b0e14'
          }}>
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      fontSize: 20, fontWeight: 700, color: 'var(--text)',
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '4px 10px', width: 220, outline: 'none'
                    }}
                  />
                ) : (user?.name || user?.email?.split('@')[0] || 'Pengguna')}
                {editing && (
                  <button onClick={saveProfile} disabled={saving} style={{
                    background: 'var(--accent)', color: '#0b0e14', border: 'none',
                    borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}>
                    {saving ? '…' : 'Simpan'}
                  </button>
                )}
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{
                    background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer'
                  }} title="Edit nama">
                    <Pencil size={15} />
                  </button>
                )}
              </h1>
              <span className={`tag ${plan === 'free' ? 'tag-neutral' : plan === 'pro' ? 'tag-accent' : 'tag-amber'}`}>
                {planMeta.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {user?.email}
            </div>
          </div>

          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600
            }}
          >
            <CreditCard size={15} style={{ color: 'var(--accent)' }} />
            {plan === 'free' ? 'Upgrade Plan' : 'Kelola Subscription'}
          </button>
        </motion.div>

        {/* Stats grid */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <StatCard
            icon={Star}
            label="Watchlist"
            value={watchlist.length}
            sub="aset dipantau"
          />
          <StatCard
            icon={TrendingUp}
            label="Portofolio"
            value={portfolio?.holdings?.length || 0}
            sub="posisi aktif"
          />
          <StatCard
            icon={Bell}
            label="Alerts"
            value={`${alerts.length}/${planMeta.limit === null ? '∞' : planMeta.limit}`}
            sub={planMeta.limit === null ? 'unlimited' : 'limit plan'}
          />
          <StatCard
            icon={Shield}
            label="Plan"
            value={planMeta.label}
            sub={plan === 'free' ? 'upgrade untuk fitur penuh' : 'aktif'}
          />
        </div>

        {/* Account settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="cg-card" style={{ padding: 20 }}
          >
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 14 }}>
              PENGATURAN AKUN
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={15} style={{ color: 'var(--text2)' }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{user?.email}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>Verified ✓</div>
                  </div>
                </div>
                <span className="tag tag-green"><Check size={11} /> Aktif</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock size={15} style={{ color: 'var(--text2)' }} />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>Password</div>
                </div>
                <button
                  onClick={() => show('Fitur reset password belum tersedia')}
                  style={{
                    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
                    borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer'
                  }}
                >
                  Ubah
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Download size={15} style={{ color: 'var(--text2)' }} />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>Ekspor Data</div>
                </div>
                <button
                  onClick={() => show('Ekspor CSV tersedia di plan Pro')}
                  style={{
                    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
                    borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer'
                  }}
                >
                  Ekspor
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="cg-card" style={{ padding: 20 }}
          >
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 14 }}>
              PREFERENSI
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={15} style={{ color: 'var(--text2)' }} />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>Mode</div>
                </div>
                <button
                  onClick={toggleTheme}
                  style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)'
                  }}
                >
                  {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bell size={15} style={{ color: 'var(--text2)' }} />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>Notifikasi</div>
                </div>
                <button
                  onClick={() => navigate('/alerts')}
                  style={{
                    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
                    borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer'
                  }}
                >
                  Kelola Alerts
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { logout(); navigate('/') }}
                style={{
                  width: '100%', background: 'var(--down-dim)', border: '1px solid var(--down)',
                  color: 'var(--down)', borderRadius: 8, padding: '10px 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </motion.div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 16px', fontSize: 13,
              boxShadow: 'var(--shadow-pop)', zIndex: 100, color: 'var(--text)'
            }}
          >
            {toast}
          </motion.div>
        )}
      </div>
    </div>
  )
}
