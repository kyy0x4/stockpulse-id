import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import { accountApi } from '../api/auth'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Avatar, AvatarFallback,
} from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Mail, Lock, Shield, Bell, CreditCard, Download,
  LogOut, Pencil, Star, TrendingUp, Check, Sun, Moon,
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
  const [notifyPrice, setNotifyPrice] = useState(true)
  const [notifyNews, setNotifyNews] = useState(true)
  const [notifySignals, setNotifySignals] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

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
  const alertPct = planMeta.limit === null ? 100 : Math.min(100, Math.round((alerts.length / planMeta.limit) * 100))

  const saveProfile = async () => {
    setSaving(true)
    setEditing(false)
    setSaving(false)
    toast.success('Profil disimpan')
  }

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim border border-accent-line">
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
    <div className="page-wrap pt-2">
      <div className="max-w-[960px] mx-auto flex flex-col gap-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6 flex items-center gap-5 flex-wrap">
              <Avatar className="w-16 h-16 rounded-2xl text-[28px] font-extrabold">
                <AvatarFallback
                  className="text-primary-foreground"
                  style={{ background: 'linear-gradient(135deg, var(--accent-2), var(--accent))' }}
                >
                  {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-[22px] font-extrabold text-foreground m-0">
                    {editing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-[220px] h-9 text-[15px] font-bold bg-secondary"
                      />
                    ) : (user?.name || user?.email?.split('@')[0] || 'Pengguna')}
                    {editing && (
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        {saving ? '…' : 'Simpan'}
                      </Button>
                    )}
                    {!editing && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
                            <Pencil size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ubah nama</TooltipContent>
                      </Tooltip>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Star} label="Watchlist" value={watchlist.length} sub="aset dipantau" />
          <StatCard icon={TrendingUp} label="Portofolio" value={portfolio?.holdings?.length || 0} sub="posisi aktif" />
          <StatCard
            icon={Bell}
            label="Alerts"
            value={`${alerts.length}/${planMeta.limit === null ? '∞' : planMeta.limit}`}
            sub={planMeta.limit === null ? 'unlimited' : 'limit plan'}
          />
          <StatCard icon={Shield} label="Plan" value={planMeta.label} sub={plan === 'free' ? 'upgrade untuk fitur penuh' : 'aktif'} />
        </div>

        {/* Alert usage */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="font-mono text-[11px] tracking-widest text-muted-foreground">
              PENGGUNAAN ALERT
            </CardTitle>
            <CardDescription>
              {alerts.length} dari {planMeta.limit === null ? '∞' : planMeta.limit} slot terpakai
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Progress
              value={alertPct}
              className="h-2 rounded-full"
            />
            <div className="mt-2 text-[11px] text-muted-foreground font-mono">
              {alertPct}% terpakai
              {planMeta.limit !== null && alerts.length >= planMeta.limit && (
                <span className="text-hold ml-2">Limit tercapai — upgrade untuk tambah</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  PENGATURAN AKUN
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-ink-soft" />
                    <div>
                      <div className="text-[13px] text-foreground">{user?.email}</div>
                      <div className="text-[10px] text-muted-foreground">Verified</div>
                    </div>
                  </div>
                  <Badge tone="green"><Check size={11} /> Aktif</Badge>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Password</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Fitur reset password belum tersedia')}>
                    Ubah
                  </Button>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Download size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Ekspor Data</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Ekspor CSV tersedia di plan Pro')}>
                    Ekspor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  PREFERENSI
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Moon size={15} className="text-ink-soft" /> : <Sun size={15} className="text-ink-soft" />}
                    <div>
                      <div className="text-[13px] text-foreground">Mode</div>
                      <div className="text-[10px] text-muted-foreground">{theme === 'dark' ? 'Gelap' : 'Terang'}</div>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-ink-soft" />
                    <div>
                      <div className="text-[13px] text-foreground">Notifikasi Harga</div>
                      <div className="text-[10px] text-muted-foreground">Alert target harga</div>
                    </div>
                  </div>
                  <Switch checked={notifyPrice} onCheckedChange={setNotifyPrice} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-ink-soft" />
                    <div>
                      <div className="text-[13px] text-foreground">Notifikasi Berita</div>
                      <div className="text-[10px] text-muted-foreground">Berita makro & impact</div>
                    </div>
                  </div>
                  <Switch checked={notifyNews} onCheckedChange={setNotifyNews} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-ink-soft" />
                    <div>
                      <div className="text-[13px] text-foreground">Sinyal Teknis</div>
                      <div className="text-[10px] text-muted-foreground">BUY / SELL otomatis</div>
                    </div>
                  </div>
                  <Switch checked={notifySignals} onCheckedChange={setNotifySignals} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-ink-soft" />
                    <div className="text-[13px] text-foreground">Kelola Alerts</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/alerts')}>
                    Buka
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmLogout(true)}
                >
                  <LogOut size={15} /> Keluar
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keluar dari MARKETIQ?</DialogTitle>
              <DialogDescription>
                Kamu akan diarahkan ke halaman login. Data watchlist & portofolio tetap tersimpan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmLogout(false)}>Batal</Button>
              <Button
                variant="destructive"
                onClick={() => { setConfirmLogout(false); logout(); navigate('/') }}
              >
                Keluar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
