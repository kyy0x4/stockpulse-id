import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { motion } from 'framer-motion'
import {
  Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Info,
  TrendingUp, Globe, Users, BarChart3, Activity, Zap, Eye
} from 'lucide-react'
import brandLogo from '../images/Logo MarketIQ Biru-Toska.png'

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
          setInfo('Akun belum aktif. Masukkan kode verifikasi yang dikirim ke email kamu.')
        } else {
          navigate('/')
        }
      } else {
        await register({ name, email, password })
        setVerifyEmail(email)
        setInfo('Kode verifikasi sudah dikirim ke email kamu. Cek inbox/spam.')
      }
    } catch (err) {
      setError(err.message)
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
      navigate('/')
    } catch (err) {
      setError(err.message)
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
      setInfo('Kode baru sudah dikirim.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doGoogle = async () => {
    setError('')
    try {
      await googleLogin()
    } catch (err) {
      setError(err.message)
    }
  }

  const isGoogleLoading = (() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('google') === '1'
  })()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* ── LEFT PANEL: Branding + Features + Live Stats ── */}
      <div className="hidden lg:flex" style={{
        flex: '0 0 52%', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 64px', position: 'relative',
        background: 'var(--bg)', overflow: 'hidden'
      }}>
        {/* Decorative: grid + glow orbs */}
        <div className="grid-bg" style={{ opacity: 0.06, position: 'absolute', inset: 0 }} />
        <div style={{
          position: 'absolute', top: '10%', left: '20%', width: 300, height: 300,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,227,213,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,196,233,0.05) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
              <img src={brandLogo} alt="MARKETIQ" style={{ height: 40, width: 'auto' }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
                color: 'var(--text)', letterSpacing: -1
              }}>
                MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 42, fontWeight: 900, color: 'var(--text)',
              lineHeight: 1.1, marginBottom: 16, maxWidth: 460
            }}>
              Data Pasar Global<br />di <span style={{ color: 'var(--accent)' }}>Ujung Jari</span> Kamu.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 440, marginBottom: 36 }}>
              Screener, chart, berita, dan alert — semua dalam satu terminal.
              Saham AS, ETF, dan 39 kripto spot.
            </p>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 14px', background: 'var(--bg2)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{
                    height: 28, width: 28, borderRadius: 7, background: 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--accent-line)', flexShrink: 0
                  }}>
                    <f.icon size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{f.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live ticker strip */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg3)',
                border: '1px solid var(--border)', borderRadius: 10
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                color: 'var(--accent)', fontWeight: 700
              }}>LIVE</span>
              {LIVE_STATS.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontFamily: 'var(--font-mono)'
                }}>
                  <span style={{ color: 'var(--text3)' }}>{s.label}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.value}</span>
                  <span style={{ color: 'var(--up)', fontSize: 11 }}>{s.change}</span>
                </div>
              ))}
            </motion.div>

            {/* Social proof */}
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {['A', 'B', 'R', 'S'].map((ch, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `hsl(${180 + i * 30}, 60%, 45%)`,
                    border: '2px solid var(--bg)', marginLeft: i > 0 ? -8 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff'
                  }}>{ch}</div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                <b style={{ color: 'var(--text)' }}>1,200+ trader</b> sudah bergabung
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative',
        background: 'var(--bg)'
      }}>
        {/* Subtle glow behind form */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,227,213,0.04) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
          {/* Mobile brand */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src={brandLogo} alt="MARKETIQ" style={{ height: 36, width: 'auto', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
              MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Terminal Analisa Pasar Global</div>
          </div>

          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '28px 24px', boxShadow: 'var(--shadow-pop)'
          }}>
            {!verifyEmail ? (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                    {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                    {mode === 'login' ? 'Masuk untuk akses terminal kamu.' : 'Daftar gratis & mulai pantau pasar.'}
                  </p>
                </div>

                {/* Tabs */}
                <div style={{
                  display: 'flex', background: 'var(--bg3)', borderRadius: 10,
                  padding: 4, marginBottom: 22, border: '1px solid var(--border)'
                }}>
                  {['login', 'register'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setMode(tab); setError(''); setInfo('') }}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        background: mode === tab ? 'var(--bg2)' : 'transparent',
                        color: mode === tab ? 'var(--accent)' : 'var(--text3)',
                        boxShadow: mode === tab ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {tab === 'login' ? 'Masuk' : 'Daftar'}
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.25)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                    color: 'var(--down)', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center'
                  }}>
                    <Info size={14} /> {error}
                  </div>
                )}

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {mode === 'register' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, display: 'block' }}>NAMA LENGKAP</label>
                      <div style={{ position: 'relative' }}>
                        <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                        <input
                          required value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="Budi Santoso"
                          style={{
                            width: '100%', height: 42, padding: '0 12px 0 38px', borderRadius: 10,
                            background: 'var(--bg3)', border: '1px solid var(--border)',
                            color: 'var(--text)', fontSize: 13.5, outline: 'none', transition: 'border-color 0.15s'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, display: 'block' }}>EMAIL</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        style={{
                          width: '100%', height: 42, padding: '0 12px 0 38px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 13.5, outline: 'none', transition: 'border-color 0.15s'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, display: 'block' }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%', height: 42, padding: '0 12px 0 38px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 13.5, outline: 'none', transition: 'border-color 0.15s'
                        }}
                      />
                    </div>
                    {mode === 'register' && <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Minimal 8 karakter.</p>}
                  </div>

                  <button
                    type="submit" disabled={busy}
                    style={{
                      height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                      color: '#0b0e14', fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s', opacity: busy ? 0.7 : 1
                    }}
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Masuk' : 'Buat Akun'}
                    {!busy && <ArrowRight size={16} />}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em' }}>ATAU</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Google */}
                <button
                  type="button" onClick={doGoogle} disabled={busy || initializing || isGoogleLoading}
                  style={{
                    width: '100%', height: 42, borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.991 8.991 0 0 0 0 8.088l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  {isGoogleLoading ? 'Menghubungkan…' : 'Lanjut dengan Google'}
                </button>
              </>
            ) : (
              /* ── OTP Verification ── */
              <form onSubmit={submitVerify}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    height: 56, width: 56, borderRadius: 14, background: 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', border: '1px solid var(--accent-line)'
                  }}>
                    <ShieldCheck size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Cek Email Kamu</h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 6 }}>
                    Kode 6 digit dikirim ke <b style={{ color: 'var(--text)' }}>{verifyEmail}</b>
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <input
                    required inputMode="numeric" maxLength={6}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                      width: '100%', height: 54, borderRadius: 12, background: 'var(--bg3)',
                      border: '1px solid var(--border)', color: 'var(--text)', fontSize: 28,
                      fontWeight: 700, letterSpacing: '0.5em', textAlign: 'center',
                      outline: 'none', fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <button
                  type="submit" disabled={busy || code.length !== 6}
                  style={{
                    width: '100%', height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                    color: '#0b0e14', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: code.length !== 6 ? 0.5 : 1
                  }}
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : 'Verifikasi'}
                </button>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    type="button" onClick={doResend} disabled={busy}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}
                  >
                    Tidak terima? <span style={{ color: 'var(--accent)' }}>Kirim ulang</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Trust bar */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {[
              { icon: ShieldCheck, text: 'Enkripsi SSL' },
              { icon: Users, text: '1,200+ Trader' },
              { icon: Activity, text: 'Update Real-Time' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
                <b.icon size={12} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                {b.text}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
            Dengan masuk, kamu setujui <a href="/terms" style={{ color: 'var(--text2)' }}>Ketentuan</a> & <a href="/privacy" style={{ color: 'var(--text2)' }}>Privasi</a>
          </div>
        </div>
      </div>
    </div>
  )
}
