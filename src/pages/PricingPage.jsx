import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, Zap, ArrowUp, X, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: '',
    cta: 'Mulai Sekarang',
    features: [
      { label: 'Screener 88 aset (saham, ETF, kripto)', included: true },
      { label: 'ChartTradingView real-time', included: true },
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
            style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
              color: 'var(--text)', letterSpacing: 0.2
            }}
          >
            Pilih <span style={{ color: 'var(--accent)' }}>Paket</span> Kamu
          </motion.h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, maxWidth: 520, margin: '8px auto 0' }}>
            Upgrade kapan saja, batalkan kapan saja. Diskon 20% untuk pembayaran tahunan.
          </p>

          <div style={{
            marginTop: 22, display: 'inline-flex', gap: 0, border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden', background: 'var(--bg2)'
          }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '8px 18px', border: 'none', cursor: 'pointer',
                background: billing === 'monthly' ? 'var(--accent-dim)' : 'transparent',
                color: billing === 'monthly' ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s'
              }}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling('yearly')}
              style={{
                padding: '8px 18px', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer',
                background: billing === 'yearly' ? 'var(--accent-dim)' : 'transparent',
                color: billing === 'yearly' ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              Tahunan <span style={{
                background: 'var(--accent)', color: '#0b0e14', borderRadius: 6,
                padding: '2px 7px', fontSize: 10, fontWeight: 700
              }}>HEMAT 20%</span>
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
            const perYear = billing === 'yearly' ? 'ditagih tahunan' : ''
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                style={{
                  border: `1px solid ${p.popular ? 'var(--accent-line)' : 'var(--border)'}`,
                  background: p.popular ? 'var(--bg2)' : 'var(--bg2)',
                  borderRadius: 14, padding: 24,
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    background: 'var(--accent)', color: '#0b0e14',
                    fontSize: 10, fontWeight: 700, padding: '4px 0', textAlign: 'center',
                    letterSpacing: '0.2em', fontFamily: 'var(--font-mono)'
                  }}>
                    PALING LAKU
                  </div>
                )}

                <div style={{ marginTop: p.popular ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)'
                    }}>{p.name}</p>
                    {p.popular && <Crown size={16} style={{ color: 'var(--accent)' }} />}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--text)'
                    }}>${displayPrice}</span>
                    {p.price > 0 && <span style={{ color: 'var(--text3)', fontSize: 13 }}>/{billing === 'yearly' ? 'bln' : 'bln'}</span>}
                    {p.price === 0 && <span style={{ color: 'var(--text3)', fontSize: 13 }}> selamanya</span>}
                    {billing === 'yearly' && p.price > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        ${Math.round(p.price * 12 * discount)}/tahun
                      </div>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map((f) => (
                    <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                      {f.included ? (
                        <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      ) : (
                        <X size={14} style={{ color: 'var(--text3)', opacity: 0.4, flexShrink: 0 }} />
                      )}
                      <span style={{ color: f.included ? 'var(--text2)' : 'var(--text3)', textDecoration: f.included ? 'none' : 'line-through' }}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => p.id === 'enterprise' ? navigate('/contact') : navigate('/pricing/checkout', { state: { plan: p.id, billing } })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: p.popular ? 'var(--accent)' : 'var(--bg3)',
                    color: p.popular ? '#0b0e14' : 'var(--text)',
                    fontSize: 13, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  {p.cta}
                  {p.price > 0 && <ArrowUp size={13} />}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
