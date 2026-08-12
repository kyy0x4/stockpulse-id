import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { TrendingUp } from 'lucide-react'
import { ihsgHistory } from '../../data/stocks'
import IHSGChart from '../charts/IHSGChart'

export default function MarketChart() {
  const last = ihsgHistory[ihsgHistory.length - 1]
  const first = ihsgHistory[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
      className="lg:col-span-2"
    >
      <Card className="p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Indeks Harga Saham Gabungan</h3>
              <span className="rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-slate-400">
                1D · 1M · 6M · 1Y
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight font-mono">7.840</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-sm">
                <TrendingUp size={14} /> +0,82%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Naik {((last.value - first.value) / first.value * 100).toFixed(2)}% dalam 12 bulan terakhir
            </p>
          </div>
        </div>
        <div className="h-[260px]">
          <IHSGChart />
        </div>
      </Card>
    </motion.div>
  )
}
