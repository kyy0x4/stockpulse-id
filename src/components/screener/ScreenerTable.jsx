import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import { Star, ArrowUpDown, Filter } from 'lucide-react'

export default function ScreenerTable({ stocks, onSelect, onToggleFav, favorites }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-emerald-400" />
          <div>
            <h3 className="font-semibold">Hasil Screener</h3>
            <p className="text-xs text-slate-500 mt-0.5">{stocks.length} saham memenuhi filter</p>
          </div>
        </div>
        <Badge tone="blue" dot>Data real-time</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-white/[0.06]">
              <th className="px-6 py-3 font-medium">
                <button className="inline-flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer">
                  Saham <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-3 font-medium text-right">Harga</th>
              <th className="px-4 py-3 font-medium text-center">Sektor</th>
              <th className="px-4 py-3 font-medium text-right">PER</th>
              <th className="px-4 py-3 font-medium text-right">ROE</th>
              <th className="px-4 py-3 font-medium text-right">Growth</th>
              <th className="px-4 py-3 font-medium text-center">RSI</th>
              <th className="px-4 py-3 font-medium text-center">Trend</th>
              <th className="px-4 py-3 font-medium text-center">Skor Total</th>
              <th className="px-6 py-3 font-medium text-center">Signal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => (
              <motion.tr
                key={s.ticker + i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => onSelect?.(s)}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/15 font-mono text-xs font-bold text-emerald-400">
                      {s.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold tracking-tight">{s.ticker}</p>
                      <p className="text-xs text-slate-500 max-w-[160px] truncate">{s.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className="font-mono font-semibold">{s.price.toLocaleString('id-ID')}</p>
                  <p className={`font-mono text-xs ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </p>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Badge tone="neutral">{s.sector}</Badge>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-300">{s.fundamental.per || '—'}</td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-300">{s.fundamental.roe != null ? `${s.fundamental.roe}%` : '—'}</td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-400">{s.fundamental.growth != null ? `${s.fundamental.growth}%` : '—'}</td>
                <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-300">{s.technical.rsi ?? '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  <Badge tone={s.technical.trend === 'Uptrend' ? 'green' : s.technical.trend === 'Downtrend' ? 'red' : 'amber'}>
                    {s.technical.trend}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <ScoreRing value={s.composite ?? 0} size={42} stroke={4} />
                  </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <Badge tone={s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'amber'} dot>
                    {s.signal}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      favorites.includes(s.ticker) ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                    }`}
                    aria-label="Watchlist"
                  >
                    <Star size={16} fill={favorites.includes(s.ticker) ? 'currentColor' : 'none'} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
