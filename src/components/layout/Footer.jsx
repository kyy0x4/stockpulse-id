import { Link } from 'react-router-dom'
import {
  Mail, Globe, ShieldAlert, BookOpen, FileText,
  User, MessageCircle, Scale, Bell,
} from 'lucide-react'
import brandLogo from '../../images/Logo MarketIQ Biru-Toska.png'

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', to: '/', icon: null },
      { label: 'Screener', to: '/screener', icon: null },
      { label: 'Market', to: '/market', icon: null },
      { label: 'Watchlist', to: '/watchlist', icon: null },
      { label: 'Portfolio', to: '/portfolio', icon: null },
    ]
  },
  {
    title: 'Informasi',
    links: [
      { label: 'About Us', to: '/about', icon: User },
      { label: 'News', to: '/news', icon: null },
      { label: 'News Impact', to: '/news-impact', icon: null },
      { label: 'Market Pulse', to: '/market-pulse', icon: null },
      { label: 'Alerts', to: '/alerts', icon: Bell },
      { label: 'Macro', to: '/macro', icon: null },
    ]
  },
  {
    title: 'Legal & Dukungan',
    links: [
      { label: 'Contact Us', to: '/contact', icon: MessageCircle },
      { label: 'Disclaimer', to: '/disclaimer', icon: ShieldAlert },
      { label: 'Terms of Use', to: '/terms', icon: Scale },
      { label: 'Privacy Policy', to: '/privacy', icon: BookOpen },
    ]
  }
]

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      marginTop: 40,
      padding: '28px 24px 22px'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 28
      }}>
        {/* Brand + tagline */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <img src={brandLogo} alt="MARKETIQ" style={{ height: 26, width: 26, objectFit: 'contain' }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
              color: 'var(--text)', letterSpacing: 0.3
            }}>
              MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 260 }}>
            Terminal data pasar — saham AS, ETF, dan kripto dalam satu layar. Cepat, transparan, dan dapat diaudit.
          </p>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <a href="https://github.com/marketiq" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 30, width: 30, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text2)', transition: 'all 0.15s',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700
              }} aria-label="GitHub">
              GH
            </a>
            <a href="https://x.com/marketiq" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 30, width: 30, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text2)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700
              }} aria-label="X">
              X
            </a>
            <a href="mailto:support@marketiq.app"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 30, width: 30, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text2)'
              }} aria-label="Email">
              <Mail size={14} />
            </a>
          </div>
        </div>

        {/* Kolom link */}
        {COLS.map((col) => (
          <div key={col.title}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text2)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12
            }}>{col.title}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.links.map((l) => {
                const Icon = l.icon
                const isStatic = ['/about', '/contact', '/disclaimer', '/terms', '/privacy', '/alerts'].includes(l.to)
                const Comp = isStatic ? Link : 'a'
                return (
                  <li key={l.label}>
                    <Comp
                      to={isStatic ? l.to : undefined}
                      href={isStatic ? undefined : l.to}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        fontSize: 13, color: 'var(--text3)', textDecoration: 'none',
                        transition: 'color 0.15s', cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
                    >
                      {Icon && <Icon size={13} style={{ opacity: 0.7 }} />}
                      {l.label}
                    </Comp>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bar bawah */}
      <div style={{
        maxWidth: 1200, margin: '22px auto 0',
        paddingTop: 16, borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 10
      }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          © 2026 MARKETIQ. Data harga: Yahoo Finance, Binance, CoinGecko. Bukan nasihat keuangan.
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
          <Link to="/alerts" style={{ textDecoration: 'none' }}>Alerts</Link>
          <Link to="/disclaimer" style={{ textDecoration: 'none' }}>Disclaimer</Link>
          <Link to="/terms" style={{ textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
