import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Info, TrendingUp, Globe, Users, BarChart3, Activity } from 'lucide-react'
import brandLogo from '../images/Logo MarketIQ Biru-Toska.png'

const FEATURES = [
  { icon: TrendingUp, label: '88+ Aset', sub: 'Saham AS, ETF & Kripto' },
  { icon: Activity, label: 'Real-time', sub: 'Data pasar langsung' },
  { icon: Globe, label: 'Berita Global', sub: 'Dari sumber terpercaya' },
  { icon: BarChart3, label: 'Analisis Otomatis', sub: 'Skor BUY/HOLD/SELL' },
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
      {/* Decorative gradient orbs */}
      <div className="grid-bg" style={{ opacity: 0.08 }} />
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(34, 227, 213, 0.08) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(13, 196, 233, 0.06) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Left side: branding & benefits (Desktop only) */}
      <div className="hidden lg:flex" style={{
        flex: '0 0 55%', flexDirection: 'column', justifyContent: 'center', padding: '0 100px',
        borderRight: '1px solid var(--border)', zIndex: 1, position: 'relative',
        background: 'linear-gradient(180deg, rgba(3,13,30,0) 0%, rgba(26,38,56,0.3) 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 50 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <img src={brandLogo} alt="MARKETIQ" style={{ height: 44, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: 'var(--text)', letterSpacing: -1 }}>
              MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
            </span>
          </div>

          <h1 style={{ fontSize: 48, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginBottom: 24 }}>
            Trading Tanpa<br /><span style={{ color: 'var(--accent)' }}>Batas</span>.
          </h1>

          <p style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 480, marginBottom: 48 }}>
            Platform analisis pasar saham AS, ETF, & kripto paling lengkap. 
            Data real-time, sinyal otomatis, dan berita global — satu terminal untuk semua.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <f.icon size={18} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)', paddingLeft: 28 }}>{f.sub}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: 50, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: '50%', background: `hsl(${i * 60}, 70%, 55%)`,
                  border: '2px solid var(--bg)', marginLeft: i > 1 ? -10 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff'
                }}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>1,200+ Trader Aktif</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>bergabung bulan ini</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side: Auth Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', zIndex: 1, position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile brand header */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
             <img src={brandLogo} alt="MARKETIQ" style={{ height: 40, width: 'auto', margin: '0 auto 12px', display: 'block' }} />
             <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
              MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Terminal Analisa Pasar Global</div>
          </div>

          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '32px 28px', boxShadow: 'var(--shadow-pop)',
            backdropFilter: 'blur(10px)'
          }}>
            {!verifyEmail ? (
              <>
                <div style={{ marginBottom: 26 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                    {mode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text3)', lineHeight: 1.6 }}>
                    {mode === 'login' 
                      ? 'Selamat datang kembali. Pantau pasar mulai sekarang.' 
                      : 'Daftar gratis & akses semua fitur screener & alert.'}
                  </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                  display: 'flex', background: 'var(--bg3)', borderRadius: 12,
                  padding: 5, marginBottom: 24, border: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => { setMode('login'); setError(''); setInfo('') }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      background: mode === 'login' ? 'var(--accent-dim)' : 'transparent',
                      color: mode === 'login' ? 'var(--accent)' : 'var(--text3)'
                    }}
                  >Masuk</button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setInfo('') }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      background: mode === 'register' ? 'var(--accent-dim)' : 'transparent',
                      color: mode === 'register' ? 'var(--accent)' : 'var(--text3)'
                    }}
                  >Daftar</button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(244, 67, 54, 0.08)', border: '1px solid rgba(244, 67, 54, 0.25)',
                      borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: 'var(--down)',
                      fontSize: 12.5, display: 'flex', gap: 12, alignItems: 'flex-start'
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {info && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(34, 227, 213, 0.08)', border: '1px solid rgba(34, 227, 213, 0.25)',
                      borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: 'var(--up)',
                      fontSize: 12.5, display: 'flex', gap: 12, alignItems: 'flex-start'
                    }}
                  >
                    <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{info}</span>
                  </motion.div>
                )}

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {mode === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nama Lengkap</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                        <input
                          required value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="cth. Ahmad Rizky"
                          style={{
                            width: '100%', height: 44, padding: '0 14px 0 44px', borderRadius: 10,
                            background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                            fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-line)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        style={{
                          width: '100%', height: 44, padding: '0 14px 0 44px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                          fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent-line)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%', height: 44, padding: '0 14px 0 44px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                          fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent-line)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    {mode === 'register' && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Minimal 8 karakter dengan huruf & angka.</p>}
                  </div>

                  <button
                    type="submit" disabled={busy || (mode === 'login' && !email) || (mode === 'login' && !password)}
                    style={{
                      height: 48, borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                      background: busy ? 'var(--bg4)' : 'linear-gradient(135deg, #22E3D5 0%, #0DC4E9 100%)',
                      color: '#0b0e14', fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      marginTop: 6, transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(34, 227, 213, 0.25)'
                    }}
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Masuk Sekarang' : 'Daftar & Mulai Gratis'}
                    {!busy && <ArrowRight size={18} />}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em' }}>ATAU LANJUT DENGAN</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <button
                  type="button" onClick={doGoogle} disabled={busy || initializing || isGoogleLoading}
                  style={{
                    width: '100%', height: 46, borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.15s'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.991 8.991 0 0 0 0 8.088l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  {isGoogleLoading ? <><Loader2 size={14} className="animate-spin" /> Menghubungkan…</> : 'Lanjut dengan Google'}
                </button>
              </>
            ) : (
              <form onSubmit={submitVerify}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    height: 64, width: 64, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent-dim), rgba(13,196,233,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
                    border: '2px solid var(--accent-line)'
                  }}>
                    <ShieldCheck size={32} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Verifikasi Akun</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text3)', lineHeight: 1.6 }}>
                    Kami mengirim kode 6 digit ke <br/><b style={{ color: 'var(--accent)' }}>{verifyEmail}</b>
                  </p>
                </div>

                <div style={{ marginBottom: 26 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kode Verifikasi</label>
                  <input
                    required inputMode="numeric" maxLength={6}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                      width: '100%', height: 60, borderRadius: 14, background: 'var(--bg3)',
                      border: '2px solid var(--border)', color: 'var(--text)', fontSize: 34,
                      fontWeight: 700, letterSpacing: '0.35em', textAlign: 'center', outline: 'none',
                      fontFamily: 'var(--font-mono)', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <button
                  type="submit" disabled={busy || code.length !== 6}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #22E3D5 0%, #0DC4E9 100%)',
                    color: '#0b0e14', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 4px 16px rgba(34, 227, 213, 0.25)'
                  }}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : 'Verifikasi & Masuk'}
                  <ArrowRight size={18} />
                </button>

                <div style={{ marginTop: 26, textAlign: 'center' }}>
                  <button
                    type="button" onClick={doResend} disabled={busy}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text3)',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Kirim ulang kode</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom trust badges */}
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: ShieldCheck, label: 'Keamanan enkripsi' },
              { icon: Users, label: '1,200+ trader' },
              { icon: Activity, label: 'Update realtime' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text3)', fontSize: 12 }}>
                <item.icon size={14} style={{ color: 'var(--accent)' }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11.5, color: 'var(--text3)' }}>
            Dengan masuk, kamu menyetujui{' '}
            <a href="/terms" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Ketentuan</a> &{' '}
            <a href="/privacy" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Privasi</a> kami.
          </div>
        </div>
      </div>
    </div>
  )
}
