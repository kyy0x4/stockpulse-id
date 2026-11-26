import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, ArrowUp, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: '',
    cta: 'Mulai Sekarang',
    features: [
      { label: 'Screener 88 aset (saham, ETF, kripto)', included: true },
      { label: 'Chart TradingView real-time', included: true },
      { label: 'Watchlist & Portofolio dasar', included: true },
      { label: '3 Alert aktif', included: true },
      { label: 'Berita makro & impact', included: true },
      { label: 'Alert Pro (20+ alert)', included: false },
      { label: 'API access & export CSV', included: false },
      { label: 'Priority support < 4 jam', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: '/bulan',
    popular: true,
    cta: 'Upgrade ke Pro',
    features: [
      { label: 'Semua fitur Free', included: true },
      { label: '20 Alert aktif + sinyal berubah', included: true },
      { label: 'API access & export CSV', included: true },
      { label: 'Perbandingan multi-aset', included: true },
      { label: 'Email alert 24/7', included: true },
      { label: 'Priority support < 4 jam', included: true },
      { label: 'Early access fitur baru', included: true },
      { label: 'Tim/enterprise plan', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: '/bulan',
    cta: 'Hubungi Kami',
    features: [
      { label: 'Semua fitur Pro', included: true },
      { label: 'Unlimited alert', included: true },
      { label: 'Tim (hingga 10 seat)', included: true },
      { label: 'Custom API & white label', included: true },
      { label: 'Dedicated SLA 99.9%', included: true },
      { label: 'Onboarding & training', included: true },
    ],
  },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')

  return (
    <div className="page-wrap" style={{ paddingTop: 8, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="font-display text-[32px] font-black text-foreground"
            style={{ letterSpacing: 0.2 }}
          >
            Pilih <span className="text-accent">Paket</span> Kamu
          </motion.h1>
          <p className="text-sm text-ink-soft max-w-[520px] mx-auto" style={{ marginTop: 8 }}>
            Upgrade kapan saja, batalkan kapan saja. Diskon 20% untuk pembayaran tahunan.
          </p>

          {/* Billing toggle */}
          <div className="mt-5 inline-flex rounded-lg border bg-card p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all ${billing === 'monthly' ? 'bg-accent-dim text-accent' : 'text-ink-soft hover:text-foreground'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all inline-flex items-center gap-2 ${billing === 'yearly' ? 'bg-accent-dim text-accent' : 'text-ink-soft hover:text-foreground'}`}
            >
              Tahunan
              <span className="bg-accent text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                HEMAT 20%
              </span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20, alignItems: 'stretch'
        }}>
          {PLANS.map((p) => {
            const discount = billing === 'yearly' ? 0.8 : 1
            const displayPrice = p.price === 0 ? 0 : Math.round(p.price * discount)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              >
                <Card
                  className="relative h-full overflow-hidden"
                  style={{
                    borderColor: p.popular ? 'var(--accent-line)' : undefined,
                    background: p.popular ? 'var(--bg2)' : undefined,
                  }}
                >
                  {p.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-primary-foreground text-[10px] font-bold py-1 text-center tracking-[0.2em] font-mono">
                      PALING LAKU
                    </div>
                  )}

                  <Card
                    className="border-0 bg-transparent p-6"
                    style={{ marginTop: p.popular ? 14 : 0 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-[20px] font-extrabold text-foreground">{p.name}</h3>
                      {p.popular && <Crown size={16} className="text-accent" />}
                    </div>
                    <div className="mb-4">
                      <span className="font-mono text-[32px] font-bold text-foreground">${displayPrice}</span>
                      {p.price > 0 && <span className="text-muted-foreground text-[13px]">/bln</span>}
                      {p.price === 0 && <span className="text-muted-foreground text-[13px]"> selamanya</span>}
                      {billing === 'yearly' && p.price > 0 && (
                        <div className="text-[10px] text-accent font-mono mt-0.5">
                          ${Math.round(p.price * 12 * discount)}/tahun
                        </div>
                      )}
                    </div>

                    <ul className="flex flex-col gap-2.5 mb-5">
                      {p.features.map((f) => (
                        <li key={f.label} className="flex items-center gap-2 text-[13px]">
                          {f.included ? (
                            <Check size={14} className="text-accent shrink-0" />
                          ) : (
                            <X size={14} className="text-muted-foreground opacity-40 shrink-0" />
                          )}
                          <span
                            className={f.included ? 'text-ink-soft' : 'text-muted-foreground line-through'}
                          >
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={p.popular ? 'default' : 'secondary'}
                      className="w-full"
                      onClick={() => p.id === 'enterprise' ? navigate('/contact') : navigate('/pricing/checkout', { state: { plan: p.id, billing } })}
                    >
                      {p.cta}
                      {p.price > 0 && <ArrowUp size={13} />}
                    </Button>
                  </Card>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
