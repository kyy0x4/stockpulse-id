import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { motion } from 'framer-motion'
import {
  Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Info,
  TrendingUp, Globe, Users, BarChart3, Activity, Zap, Eye,
} from 'lucide-react'
import brandLogo from '../images/Logo MarketIQ Biru-Toska.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Avatar, AvatarFallback,
} from '@/components/ui/avatar'
import { toast } from 'sonner'

const FEATURES = [
  { icon: TrendingUp, label: '88+ Aset Real-Time', sub: 'Saham AS, ETF & Kripto Spot' },
  { icon: BarChart3, label: 'Skor Teknis & Fundamental', sub: 'Sinyal BUY / HOLD / SELL otomatis' },
  { icon: Activity, label: 'Alerts Harga & Sinyal', sub: 'Notifikasi seketika saat target tembus' },
  { icon: Globe, label: 'Berita & Makro', sub: 'Impact langsung ke aset yang kamu pantau' },
  { icon: Eye, label: 'Watchlist & Portfolio', sub: 'Tracking P&L real-time' },
  { icon: Zap, label: 'TradingView Charts', sub: 'Interval 1M – 5Y, crosshair & volume' },
]

const LIVE_STATS = [
  { label: 'BTC', value: '$60,428', change: '+2.34%' },
  { label: 'S&P 500', value: '5,842', change: '+0.81%' },
  { label: 'SOL', value: '$71.78', change: '+1.12%' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, verify, resend, googleLogin, initializing } = useAuth()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const res = await login(email, password)
        if (res && res.needsVerification) {
          setVerifyEmail(res.email)
          toast.info('Kode verifikasi sudah dikirim')
        } else {
          toast.success('Selamat datang kembali!')
          navigate('/')
        }
      } else {
        await register({ name, email, password })
        setVerifyEmail(email)
        toast.info('Kode verifikasi sudah dikirim')
      }
    } catch (err) {
      toast.error(err.message || 'Gagal login')
    } finally {
      setBusy(false)
    }
  }

  const submitVerify = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await verify(verifyEmail, code)
      toast.success('Email terverifikasi. Selamat datang!')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Kode salah')
    } finally {
      setBusy(false)
    }
  }

  const doResend = async () => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await resend(verifyEmail)
      toast.success('Kode baru sudah dikirim')
    } catch (err) {
      toast.error(err.message || 'Gagal kirim ulang')
    } finally {
      setBusy(false)
    }
  }

  const doGoogle = async () => {
    setError('')
    try {
      await googleLogin()
    } catch (err) {
      toast.error(err.message || 'Gagal login Google')
    }
  }

  const isGoogleLoading = (() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('google') === '1'
  })()

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* ── LEFT PANEL: Branding + Features + Live Stats ── */}
      <div className="hidden lg:flex flex-col justify-center w-[52%] px-16 py-12 relative">
        <div className="grid-bg opacity-[0.06] absolute inset-0" />
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: '10%', left: '20%', width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(34,227,213,0.06) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ bottom: '10%', right: '10%', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(13,196,233,0.05) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Brand */}
            <div className="flex items-center gap-3 mb-9">
              <img src={brandLogo} alt="MARKETIQ" className="h-10 w-auto" />
              <span className="font-display text-[28px] font-black text-foreground -tracking-wide">
                MARKET<span className="text-accent">IQ</span>
              </span>
              <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] tracking-[0.1em]">
                LIVE TERMINAL
              </Badge>
            </div>

            <h1 className="text-[42px] font-black text-foreground leading-[1.1] mb-4 max-w-[460px]">
              Data Pasar Global<br />di <span className="text-accent">Ujung Jari</span> Kamu.
            </h1>
            <p className="text-[15px] text-ink-soft leading-[1.7] max-w-[440px] mb-9">
              Screener, chart, berita, dan alert — semua dalam satu terminal.
              Saham AS, ETF, dan 39 kripto spot.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  className="flex items-start gap-2.5 p-3.5 bg-card rounded-lg border"
                >
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                    <f.icon size={14} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-foreground">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{f.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live ticker strip */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex gap-3 items-center px-3.5 py-2.5 bg-elevated rounded-lg border"
            >
              <Badge variant="default" className="font-mono text-[9px] tracking-[0.12em]">LIVE</Badge>
              {LIVE_STATS.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="text-foreground font-semibold">{s.value}</span>
                  <span className="text-up text-[11px]">{s.change}</span>
                </div>
              ))}
            </motion.div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-3.5">
              <div className="flex">
                {['A', 'B', 'R', 'S'].map((ch, i) => (
                  <Avatar key={i} className="w-8 h-8">
                    <AvatarFallback
                      className="text-[11px] font-bold text-white"
                      style={{ background: `hsl(${180 + i * 30}, 60%, 45%)`, border: '2px solid var(--bg)', marginLeft: i > 0 ? -8 : 0 }}
                    >
                      {ch}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <b className="text-foreground">1,200+ trader</b> sudah bergabung
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <div className="flex-1 flex items-center justify-center p-10 relative bg-background">
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: '30%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(34,227,213,0.04) 0%, transparent 70%)' }} />

        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden text-center mb-7">
            <img src={brandLogo} alt="MARKETIQ" className="h-9 w-auto mx-auto my-2.5 block" />
            <div className="font-display text-2xl font-black text-foreground">
              MARKET<span className="text-accent">IQ</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Terminal Analisa Pasar Global</div>
          </div>

          <Card className="p-0 overflow-hidden">
            {!verifyEmail ? (
              <>
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-[22px] font-extrabold">
                    {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                  </CardTitle>
                  <CardDescription>
                    {mode === 'login' ? 'Masuk untuk akses terminal kamu.' : 'Daftar gratis & mulai pantau pasar.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6 flex flex-col gap-4">
                  <Tabs
                    value={mode}
                    onValueChange={(v) => { setMode(v); setError(''); setInfo('') }}
                  >
                    <TabsList className="grid w-full grid-cols-2 h-10">
                      <TabsTrigger value="login" className="text-[13px] font-semibold">
                        Masuk
                      </TabsTrigger>
                      <TabsTrigger value="register" className="text-[13px] font-semibold">
                        Daftar
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {error && (
                    <div className="mb-1 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs flex items-center gap-2.5">
                      <Info size={14} /> {error}
                    </div>
                  )}

                  <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
                    {mode === 'register' && (
                      <div className="flex flex-col gap-2">
                        <Label className="text-[11px] font-semibold text-muted-foreground">NAMA LENGKAP</Label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                          <Input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Budi Santoso"
                            className="pl-9 h-[42px] text-[13.5px] bg-elevated border-border"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Label className="text-[11px] font-semibold text-muted-foreground">EMAIL</Label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                        <Input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="pl-9 h-[42px] text-[13.5px] bg-elevated border-border"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-[11px] font-semibold text-muted-foreground">PASSWORD</Label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                        <Input
                          required
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-9 h-[42px] text-[13.5px] bg-elevated border-border"
                        />
                      </div>
                      {mode === 'register' && (
                        <p className="text-[10px] text-muted-foreground">Minimal 8 karakter.</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-11 rounded-lg text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)' }}
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Masuk' : 'Buat Akun'}
                      {!busy && <ArrowRight size={16} />}
                    </Button>
                  </form>

                  <div className="my-2 flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-bold text-muted-foreground tracking-[0.12em]">ATAU</span>
                    <Separator className="flex-1" />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={doGoogle}
                    disabled={busy || initializing || isGoogleLoading}
                    className="w-full h-[42px] text-[13px] font-semibold"
                  >
                    <svg width="16" height="16" viewBox="0 0 18 18">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.991 8.991 0 0 0 0 8.088l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    {isGoogleLoading ? 'Menghubungkan…' : 'Lanjut dengan Google'}
                  </Button>
                </CardContent>
              </>
            ) : (
              /* ── OTP Verification ── */
              <CardContent className="p-6">
                <form onSubmit={submitVerify} className="flex flex-col gap-4">
                  <div className="text-center">
                    <Avatar className="w-14 h-14 rounded-[14px] bg-accent-dim border border-accent-line mx-auto mb-4">
                      <AvatarFallback className="text-accent bg-transparent flex items-center justify-center">
                        <ShieldCheck size={28} />
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-extrabold text-foreground">Cek Email Kamu</h2>
                    <p className="text-[12.5px] text-muted-foreground mt-1.5">
                      Kode 6 digit dikirim ke <b className="text-foreground">{verifyEmail}</b>
                    </p>
                  </div>

                  <Input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="h-[54px] rounded-xl bg-elevated border-border text-[28px] font-bold tracking-[0.5em] text-center font-mono"
                  />

                  <Button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className="w-full h-11 rounded-lg text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)' }}
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : 'Verifikasi'}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto px-0"
                      onClick={doResend}
                      disabled={busy}
                    >
                      Tidak terima? <span className="text-accent">Kirim ulang</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            {[
              { icon: ShieldCheck, text: 'Enkripsi SSL' },
              { icon: Users, text: '1,200+ Trader' },
              { icon: Activity, text: 'Update Real-Time' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <b.icon size={12} className="text-accent opacity-60" />
                {b.text}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-[11px] text-muted-foreground">
            Dengan masuk, kamu setujui{' '}
            <a href="/terms" className="text-ink-soft hover:text-foreground">Ketentuan</a>{' '}
            &{' '}
            <a href="/privacy" className="text-ink-soft hover:text-foreground">Privasi</a>
          </div>
        </div>
      </div>
    </div>
  )
}
