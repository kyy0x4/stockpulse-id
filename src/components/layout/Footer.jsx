import { Link } from 'react-router-dom'
import {
  Mail, Globe, ShieldAlert, BookOpen, FileText,
  User, MessageCircle, Scale, Bell, UserCog,
} from 'lucide-react'
import brandLogo from '../../images/Logo MarketIQ Biru-Toska.png'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', to: '/' },
      { label: 'Screener', to: '/screener' },
      { label: 'Market', to: '/market' },
      { label: 'Watchlist', to: '/watchlist' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'Profile', to: '/profile', icon: UserCog },
    ]
  },
  {
    title: 'Informasi',
    links: [
      { label: 'About Us', to: '/about', icon: User },
      { label: 'News', to: '/news' },
      { label: 'News Impact', to: '/news-impact' },
      { label: 'Market Pulse', to: '/market-pulse' },
      { label: 'Alerts', to: '/alerts', icon: Bell },
      { label: 'Macro', to: '/macro' },
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
    <footer className="border-t bg-background mt-10 px-6 py-7">
      <div
        className="max-w-[1200px] mx-auto grid gap-7"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <img src={brandLogo} alt="MARKETIQ" className="w-[26px] h-[26px] object-contain" />
            <span className="font-display text-[15px] font-extrabold text-foreground tracking-tight">
              MARKET<span className="text-accent">IQ</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
            Terminal data pasar — saham AS, ETF, dan kripto dalam satu layar.
            Cepat, transparan, dan dapat diaudit.
          </p>

          <div className="mt-3.5 flex gap-2">
            <a
              href="https://github.com/marketiq" target="_blank" rel="noopener noreferrer"
              className="h-[30px] w-[30px] rounded-lg border bg-elevated flex items-center justify-center font-mono text-[11px] font-bold text-ink-soft hover:text-accent transition-colors"
              aria-label="GitHub"
            >
              GH
            </a>
            <a
              href="https://x.com/marketiq" target="_blank" rel="noopener noreferrer"
              className="h-[30px] w-[30px] rounded-lg border bg-elevated flex items-center justify-center font-mono text-[11px] font-bold text-ink-soft hover:text-accent transition-colors"
              aria-label="X"
            >
              X
            </a>
            <a
              href="mailto:support@marketiq.app"
              className="h-[30px] w-[30px] rounded-lg border bg-elevated flex items-center justify-center text-ink-soft hover:text-accent transition-colors"
              aria-label="Email"
            >
              <Mail size={14} />
            </a>
          </div>
        </div>

        {/* Kolom link */}
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-bold text-ink-soft tracking-[0.12em] uppercase mb-3">
              {col.title}
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {col.links.map((l) => {
                const Icon = l.icon
                const isStatic = ['/about', '/contact', '/disclaimer', '/terms', '/privacy', '/alerts', '/profile'].includes(l.to)
                const Comp = isStatic ? Link : 'a'
                return (
                  <li key={l.label}>
                    <Comp
                      to={isStatic ? l.to : undefined}
                      href={isStatic ? undefined : l.to}
                      className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-accent transition-colors no-underline cursor-pointer"
                    >
                      {Icon && <Icon size={13} className="opacity-70" />}
                      {l.label}
                    </Comp>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <Separator className="my-5" />

      <div className="max-w-[1200px] mx-auto flex justify-between items-center flex-wrap gap-2.5">
        <p className="text-[11px] text-muted-foreground font-mono">
          © 2026 MARKETIQ. Data harga: Yahoo Finance, Binance, CoinGecko. Bukan nasihat keuangan.
        </p>
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <Link to="/alerts" className="hover:text-foreground no-underline">Alerts</Link>
          <Link to="/disclaimer" className="hover:text-foreground no-underline">Disclaimer</Link>
          <Link to="/terms" className="hover:text-foreground no-underline">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground no-underline">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
