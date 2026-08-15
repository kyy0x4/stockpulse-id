import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-mono)',
}
const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.12em',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
}
const tabStyle = (active) => ({
  flex: 1,
  padding: '9px 0',
  textAlign: 'center',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.14em',
  cursor: 'pointer',
  color: active ? 'var(--text)' : 'var(--text3)',
  background: active ? 'var(--bg3)' : 'var(--bg2)',
  border: '1px solid var(--border)',
  textTransform: 'uppercase',
})
const btnStyle = {
  width: '100%',
  padding: '11px 0',
  background: 'var(--up)',
  color: '#080809',
  border: 'none',
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: '0.06em',
  cursor: 'pointer',
  textTransform: 'uppercase',
}

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

  const field = (label, value, onChange, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

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
    <div className="fixed inset-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="fixed inset-0 grid-bg pointer-events-none" aria-hidden="true" />
      <div className="fade-up" style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.3em', color: 'var(--text3)', marginBottom: 6 }}>
            BURSA EFEK INDONESIA · REAL-TIME
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 900, letterSpacing: '0.06em', color: 'var(--text)' }}>
            PLOTFINANSIAL
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', background: 'var(--bg2)', padding: 22 }}>
          {!verifyEmail && (
            <>
              <div style={{ display: 'flex', marginBottom: 20 }}>
                <button type="button" style={tabStyle(mode === 'login')} onClick={() => { setMode('login'); setError(''); setInfo('') }}>
                  Masuk
                </button>
                <button type="button" style={tabStyle(mode === 'register')} onClick={() => { setMode('register'); setError(''); setInfo('') }}>
                  Daftar
                </button>
              </div>

              {info && <div style={{ fontSize: 12, color: 'var(--up)', lineHeight: 1.5, marginBottom: 12 }}>{info}</div>}
              {error && <div style={{ fontSize: 12, color: 'var(--down)', lineHeight: 1.5, marginBottom: 12 }}>{error}</div>}

              <form onSubmit={submit}>
                {mode === 'register' && field('Nama', name, setName)}
                {field('Email', email, setEmail, 'email')}
                {field('Password', password, setPassword, 'password', mode === 'register' ? 'minimal 8 karakter' : '')}
                <button type="submit" style={btnStyle} disabled={busy}>
                  {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar & Kirim Kode'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em' }}>ATAU</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <button
                type="button"
                onClick={doGoogle}
                disabled={busy || initializing || onGoogleParam()}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {onGoogleParam() ? 'Memproses login Google…' : 'Lanjut dengan Google'}
              </button>
            </>
          )}

          {verifyEmail && (
            <form onSubmit={submitVerify}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 8 }}>
                VERIFIKASI KODE
              </div>
              {info && <div style={{ fontSize: 12, color: 'var(--up)', lineHeight: 1.5, marginBottom: 12 }}>{info}</div>}
              {error && <div style={{ fontSize: 12, color: 'var(--down)', lineHeight: 1.5, marginBottom: 12 }}>{error}</div>}
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                Kode 6 digit sudah dikirim ke <b style={{ color: 'var(--text)' }}>{verifyEmail}</b>.
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Kode Verifikasi</label>
                <input
                  style={{ ...inputStyle, fontSize: 26, letterSpacing: '0.6em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" style={btnStyle} disabled={busy || code.length !== 6}>
                {busy ? 'Memverifikasi…' : 'Aktifkan Akun'}
              </button>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button type="button" onClick={doResend} disabled={busy} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}>
                  Kirim ulang kode
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em' }}>
            WATCHLIST · PORTFOLIO · ANALISA BERITA
          </span>
        </div>
      </div>
    </div>
  )
}
