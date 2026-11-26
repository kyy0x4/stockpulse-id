import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import { accountApi } from '../api/auth'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail, Lock, Shield, Bell, CreditCard, Download,
  LogOut, Pencil, Star, TrendingUp, Check
} from 'lucide-react'

const PLAN_META = {
  free: { label: 'Free', tone: 'neutral', limit: 3 },
  pro: { label: 'Pro', tone: 'accent', limit: 20 },
  enterprise: { label: 'Enterprise', tone: 'amber', limit: null },
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
    setEditing(false)
    setSaving(false)
    show('Profil disimpan ✓')
  }

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30">
            <Icon size={16} className="text-accent" />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono tracking-wider">{label}</span>
        </div>
        <div>
          <div className="text-[22px] font-bold text-foreground font-mono">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="page-wrap" style={{ paddingTop: 8 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6 flex items-center gap-5 flex-wrap">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 text-[28px] font-extrabold text-primary-foreground" style={{ background: 'linear-gradient(135deg, var(--accent-2), var(--accent))' }}>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-[22px] font-extrabold text-foreground">
                    {editing ? (
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-[20px] font-bold text-foreground bg-secondary border rounded-lg px-2.5 py-1 w-[220px] outline-none focus:border-accent"
                      />
                    ) : (user?.name || user?.email?.split('@')[0] || 'Pengguna')}
                    {editing && (
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        {saving ? '…' : 'Simpan'}
                      </Button>
                    )}
                    {!editing && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
                        <Pencil size={15} />
                      </Button>
                    )}
                  </h1>
                  <Badge tone={planMeta.tone}>{planMeta.label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{user?.email}</div>
              </div>

              <Button variant="secondary" onClick={() => navigate('/pricing')}>
                <CreditCard size={15} className="text-accent" />
                {plan === 'free' ? 'Upgrade Plan' : 'Kelola Subscription'}
              </Button>
            </CardContent>
          </Card>
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
          >
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  PENGATURAN AKUN
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-ink-soft" />
                    <div>
                      <div className="text-[13px] text-foreground">{user?.email}</div>
                      <div className="text-[10px] text-muted-foreground">Verified ✓</div>
                    </div>
                  </div>
                  <Badge tone="green"><Check size={11} /> Aktif</Badge>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Password</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => show('Fitur reset password belum tersedia')}>
                    Ubah
                  </Button>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Download size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Ekspor Data</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => show('Ekspor CSV tersedia di plan Pro')}>
                    Ekspor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  PREFERENSI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Shield size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Mode</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                  </Button>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Notifikasi</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/alerts')}>
                    Kelola Alerts
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full bg-transparent border-deep bg-destructive/10 hover:bg-destructive/20"
                    style={{ background: 'var(--down-dim)', borderColor: 'var(--down)', color: 'var(--down)' }}
                    onClick={() => { logout(); navigate('/') }}
                  >
                    <LogOut size={15} /> Keluar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-lg border bg-card px-4 py-2.5 text-[13px] shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </div>
    </div>
  )
}
