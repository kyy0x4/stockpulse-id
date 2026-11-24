import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Info, ChevronRight, Globe, TrendingUp } from 'lucide-react'
import brandLogo from '../images/Logo MarketIQ Biru-Toska.png'

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

  const onGoogleParam = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('google') === '1'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative background grid */}
      <div className="grid-bg" style={{ opacity: 0.12 }} />
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Left side: branding & info (Desktop only) */}
      <div className="hidden lg:flex" style={{
        flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '0 80px',
        borderRight: '1px solid var(--border)', zIndex: 1, position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          <img src={brandLogo} alt="MARKETIQ" style={{ height: 42, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', letterSpacing: -1 }}>
            MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 44, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, marginBottom: 24, maxWidth: 480 }}
        >
          Data Pasar Global di <span style={{ color: 'var(--accent)' }}>Ujung Jari</span> Kamu.
        </motion.h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: TrendingUp, label: 'Screener saham AS, ETF & kripto real-time.' },
            { icon: Globe, label: 'Berita makro ekonomi & sentimen pasar.' },
            { icon: ShieldCheck, label: 'Analisis teknikal & fundamental otomatis.' },
          ].map((item, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text2)' }}
            >
              <div style={{
                height: 36, width: 36, borderRadius: 10, background: 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
              }}>
                <item.icon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</span>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text3)' }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>TRUSTED BY RETAIL TRADERS</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, zIndex: 1, position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile brand header */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
             <img src={brandLogo} alt="MARKETIQ" style={{ height: 34, width: 'auto', margin: '0 auto 12px' }} />
             <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
              MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
            </div>
          </div>

          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-pop)'
          }}>
            {!verifyEmail ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                    {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                    {mode === 'login' ? 'Masuk untuk akses terminal kamu.' : 'Daftar sekarang & mulai pantau pasar.'}
                  </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                  display: 'flex', background: 'var(--bg3)', borderRadius: 10,
                  padding: 4, marginBottom: 24, border: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => { setMode('login'); setError(''); setInfo('') }}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      background: mode === 'login' ? 'var(--bg2)' : 'transparent',
                      color: mode === 'login' ? 'var(--text)' : 'var(--text3)',
                      boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >Masuk</button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setInfo('') }}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      background: mode === 'register' ? 'var(--bg2)' : 'transparent',
                      color: mode === 'register' ? 'var(--text)' : 'var(--text3)',
                      boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >Daftar</button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'var(--down)',
                      fontSize: 12, display: 'flex', gap: 10, alignItems: 'center'
                    }}
                  >
                    <Info size={14} /> {error}
                  </motion.div>
                )}

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {mode === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Lengkap</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                        <input
                          required value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="Budi Santoso"
                          style={{
                            width: '100%', height: 42, padding: '0 12px 0 40px', borderRadius: 10,
                            background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                            fontSize: 14, outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        style={{
                          width: '100%', height: 42, padding: '0 12px 0 40px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                          fontSize: 14, outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input
                        required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%', height: 42, padding: '0 12px 0 40px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                          fontSize: 14, outline: 'none'
                        }}
                      />
                    </div>
                    {mode === 'register' && <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>Gunakan minimal 8 karakter.</p>}
                  </div>

                  <button
                    type="submit" disabled={busy}
                    style={{
                      height: 46, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'var(--accent)', color: '#0b0e14', fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      marginTop: 8, transition: 'all 0.2s', filter: busy ? 'opacity(0.7)' : 'none'
                    }}
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Masuk' : 'Buat Akun'}
                    {!busy && <ArrowRight size={18} />}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>ATAU</span>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                <button
                  type="button" onClick={doGoogle} disabled={busy || initializing || onGoogleParam()}
                  style={{
                    width: '100%', height: 42, borderRadius: 10, border: '1px solid var(--border)',
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
                  {onGoogleParam() ? 'Menghubungkan…' : 'Lanjut dengan Google'}
                </button>
              </>
            ) : (
              <form onSubmit={submitVerify}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    height: 54, width: 54, borderRadius: 16, background: 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    border: '1px solid var(--accent-line)'
                  }}>
                    <ShieldCheck size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Cek Email Kamu</h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
                    Kami sudah mengirim kode 6-digit ke<br/><b style={{ color: 'var(--text)' }}>{verifyEmail}</b>
                  </p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase' }}>Kode Verifikasi</label>
                  <input
                    required inputMode="numeric" maxLength={6}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                      width: '100%', height: 56, borderRadius: 12, background: 'var(--bg3)',
                      border: '1px solid var(--border)', color: 'var(--text)', fontSize: 32,
                      fontWeight: 700, letterSpacing: '0.4em', textAlign: 'center', outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <button
                  type="submit" disabled={busy || code.length !== 6}
                  style={{
                    width: '100%', height: 46, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'var(--accent)', color: '#0b0e14', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : 'Verifikasi Akun'}
                </button>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <button
                    type="button" onClick={doResend} disabled={busy}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text3)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto'
                    }}
                  >
                    Tidak terima kode? <span style={{ color: 'var(--accent)' }}>Kirim ulang</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom links */}
          <div style={{
            marginTop: 32, display: 'flex', justifyContent: 'center', gap: 20,
            fontSize: 12, color: 'var(--text3)', fontWeight: 500
          }}>
            <a href="/terms" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:text-white">Ketentuan</a>
            <a href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:text-white">Privasi</a>
            <a href="/contact" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:text-white">Bantuan</a>
          </div>
        </div>
      </div>
    </div>
  )
}
