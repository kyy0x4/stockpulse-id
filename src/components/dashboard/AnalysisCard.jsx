import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import ProgressBar from '../ui/ProgressBar'
import { TrendingUp, TrendingDown, Activity, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

function Metric({ label, value, good }) {
  const color = good ? 'text-up' : 'text-down'
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function TrendBadge({ trend }) {
  if (trend === 'Uptrend')
    return <Badge tone="green"><TrendingUp size={12} /> Uptrend</Badge>
  if (trend === 'Downtrend')
    return <Badge tone="red"><TrendingDown size={12} /> Downtrend</Badge>
  return <Badge tone="amber"><Activity size={12} /> Sideways</Badge>
}

export default function AnalysisCard({ stock }) {
  const f = stock.fundamental
  const t = stock.technical

  const num = (v) => (v == null || v === '—' ? null : parseFloat(String(v).replace(/[^\d.-]/g, '')))
  const e21 = num(t.ema21), e34 = num(t.ema34), e55 = num(t.ema55)
  const w21 = num(t.ema21w), w34 = num(t.ema34w), w55 = num(t.ema55w)
  const emaStackGood = e21 != null && e21 > e34 && e34 > e55
  const emaWeekGood = w21 != null && w21 > w34 && w34 > w55
  const crossLabel = t.ema_cross === 'Golden Cross' ? 'Bull Cross' : t.ema_cross

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="lg:col-span-1 h-full"
    >
      <Card className="p-6 h-full overflow-y-auto max-h-[420px]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{stock.ticker}</h3>
              <TrendBadge trend={t.trend} />
            </div>
            <p className="text-xs text-ink-faint mt-1">{stock.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing value={stock.composite} size={48} />
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          {stock.signal === 'BUY' && <Badge tone="green" dot><CheckCircle2 size={12} /> Layak Beli</Badge>}
          {stock.signal === 'SELL' && <Badge tone="red" dot><XCircle size={12} /> Jual / Hindari</Badge>}
          {stock.signal === 'HOLD' && <Badge tone="amber" dot><MinusCircle size={12} /> Tahan</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-faint mb-2 font-medium">Fundamental</p>
            <Metric label="PER" value={f.per} good={f.per > 0 && f.per < 15} />
            <Metric label="PBV" value={f.pbv} good={f.pbv < 3} />
            <Metric label="ROE" value={`${f.roe}%`} good={f.roe > 15} />
            <Metric label="DER" value={f.der} good={f.der < 1} />
            <Metric label="Growth" value={`${f.growth}%`} good={f.growth > 10} />
            <Metric label="FCF Yield" value={f.fcf_yield != null ? `${f.fcf_yield}%` : '—'} good={f.fcf_yield > 3} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-faint mb-2 font-medium">Teknikal (Daily + Weekly)</p>
            <Metric label="Tren (EMA)" value={t.trend} good={t.trend === 'Uptrend'} />
            <Metric label="EMA Cross" value={crossLabel || '—'} good={t.ema_cross === 'Golden Cross' || t.ema_cross === 'Bullish'} />
            <Metric label="EMA Daily 21/34/55" value={e21 != null ? `${e21} / ${e34} / ${e55}` : '—'} good={emaStackGood} />
            <Metric label="EMA Weekly 21/34/55" value={w21 != null ? `${w21} / ${w34} / ${w55}` : '—'} good={emaWeekGood} />
            <Metric label="Struktur" value={t.structure || '—'} good={t.structure === 'Uptrend'} />
            <Metric label="RSI (14)" value={t.rsi} good={t.rsi > 40 && t.rsi < 70} />
            <Metric label="MACD" value={t.macd} good={t.macd === 'Bullish'} />
            <Metric label="Volume" value={`${t.vol}x`} good={t.vol >= 1} />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-ink-soft">Skor Fundamental</span>
              <span className="font-mono text-up">{f.score}</span>
            </div>
            <ProgressBar value={f.score} color={f.score >= 75 ? '#22c55e' : f.score >= 60 ? '#f59e0b' : '#ef4444'} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-ink-soft">Skor Teknikal</span>
              <span className="font-mono text-up">{t.score}</span>
            </div>
            <ProgressBar value={t.score} color={t.score >= 75 ? '#22c55e' : t.score >= 60 ? '#f59e0b' : '#ef4444'} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
