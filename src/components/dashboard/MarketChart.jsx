import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useIHSG } from '../../hooks/useIHSG'
import IHSGChart from '../charts/IHSGChart'

export default function MarketChart() {
  const { ihsg, loading } = useIHSG()
  const history = ihsg?.history || []
  const last = history[history.length - 1]
  const first = history[0]
  const positive = (ihsg?.change ?? 0) >= 0
  const ChangeIcon = positive ? TrendingUp : TrendingDown

  const ytdPct = (() => {
    if (!last || !first || !first.close) return null
    return ((last.close - first.close) / first.close * 100).toFixed(2)
  })()

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
              <span className="rounded-md bg-elevated border border-line-strong px-2 py-0.5 font-mono text-[10px] text-ink-soft">
                1Y
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight font-mono">
                {loading ? '…' : (ihsg?.price ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </span>
              <span className={`flex items-center gap-1 font-mono text-sm ${positive ? 'text-up' : 'text-down'}`}>
                <ChangeIcon size={14} /> {positive ? '+' : ''}{(ihsg?.change ?? 0).toLocaleString('id-ID')}%
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-faint font-mono">
              {ytdPct != null
                ? `${positive ? 'Naik' : 'Turun'} ${ytdPct}% sepanjang 1 tahun terakhir`
                : 'memuat data…'}
            </p>
          </div>
        </div>
        <div className="h-[260px]">
          <IHSGChart history={history} />
        </div>
      </Card>
    </motion.div>
  )
}
