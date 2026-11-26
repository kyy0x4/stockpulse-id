import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, ArrowUp, X, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '../auth/AuthContext'

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
  const { user } = useAuth()
  const [billing, setBilling] = useState('monthly')
  const [dialogPlan, setDialogPlan] = useState(null)

  const handleSelect = (planId) => {
    if (planId === 'free') {
      if (user?.plan === 'free') {
        navigate('/')
      } else {
        setDialogPlan(planId)
      }
      return
    }
    if (planId === 'enterprise') {
      navigate('/contact')
      return
    }
    setDialogPlan(planId)
  }

  const plan = PLANS.find((p) => p.id === dialogPlan)

  return (
    <div className="page-wrap pt-2 pb-10">
      <div className="mx-auto max-w-[1080px]">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="font-display text-[32px] font-black text-foreground"
          >
            Pilih <span className="text-accent">Paket</span> Kamu
          </motion.h1>
          <p className="text-sm text-ink-soft max-w-[520px] mx-auto mt-2">
            Upgrade kapan saja, batalkan kapan saja. Diskon 20% untuk pembayaran tahunan.
          </p>

          <Tabs
            value={billing}
            onValueChange={setBilling}
            className="mt-6 w-fit mx-auto"
          >
            <TabsList className="h-10">
              <TabsTrigger value="monthly" className="text-[13px] font-semibold">
                Bulanan
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-[13px] font-semibold gap-1.5">
                Tahunan
                <Badge variant="default" className="h-[16px] px-1.5 py-0 text-[9px] rounded">
                  HEMAT 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {PLANS.map((p, i) => {
            const discount = billing === 'yearly' ? 0.8 : 1
            const displayPrice = p.price === 0 ? 0 : Math.round(p.price * discount)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card
                  className={`relative h-full overflow-hidden ${p.popular ? 'border-accent ring-1 ring-accent/30' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-primary-foreground text-[10px] font-bold py-1 text-center tracking-[0.2em] font-mono">
                      PALING LAKU
                    </div>
                  )}

                  <CardHeader className={`px-6 pt-6 ${p.popular ? 'pt-9' : ''}`}>
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-display text-[20px] font-extrabold">{p.name}</CardTitle>
                      {p.popular && <Crown size={16} className="text-accent" />}
                    </div>
                    <div>
                      <span className="font-mono text-[32px] font-bold text-foreground">${displayPrice}</span>
                      {p.price > 0
                        ? <span className="text-muted-foreground text-[13px]">/bln</span>
                        : <span className="text-muted-foreground text-[13px]"> selamanya</span>}
                      {billing === 'yearly' && p.price > 0 && (
                        <div className="text-[10px] text-accent font-mono mt-0.5">
                          ${Math.round(p.price * 12 * discount)}/tahun
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-2 flex flex-col gap-2.5">
                    {p.features.map((f) => (
                      <div key={f.label} className="flex items-center gap-2 text-[13px]">
                        {f.included ? (
                          <Check size={14} className="text-accent shrink-0" />
                        ) : (
                          <X size={14} className="text-muted-foreground opacity-40 shrink-0" />
                        )}
                        <span className={f.included ? 'text-ink-soft' : 'text-muted-foreground line-through'}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter className="px-6 pb-6">
                    <Button
                      variant={p.popular ? 'default' : 'secondary'}
                      className="w-full"
                      onClick={() => handleSelect(p.id)}
                    >
                      {p.cta}
                      {p.price > 0 && <ArrowUp size={13} />}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-help">
                <Sparkles size={12} className="text-accent" />
                Kenapa pilih MARKETIQ?
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Screener 88 aset, chart TradingView, berita makro, alert real-time, skor teknikal + fundamental.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={!!dialogPlan} onOpenChange={(o) => !o && setDialogPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {plan?.name} Plan
              {plan?.popular && <Badge variant="default"><Crown size={10} /></Badge>}
            </DialogTitle>
            <DialogDescription>
              Kamu akan dialihkan ke halaman checkout untuk menyelesaikan pembayaran {plan?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-muted-foreground">Paket</span>
                <span className="text-[15px] font-bold text-foreground">{plan?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Periode</span>
                <span className="text-[15px] font-bold text-foreground capitalize">{billing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Harga</span>
                <span className="text-[15px] font-bold text-accent font-mono">
                  ${plan ? Math.round(plan.price * (billing === 'yearly' ? 0.8 : 1)) : 0}/bln
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPlan(null)}>Batal</Button>
            <Button
              onClick={() => {
                setDialogPlan(null)
                navigate('/pricing/checkout', { state: { plan: plan?.id, billing } })
              }}
            >
              Lanjut ke Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
