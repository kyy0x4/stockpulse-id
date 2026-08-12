import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import { Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StockTable({ stocks, onSelect }) {
  const fav = (e) => {
    e.stopPropagation()
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="font-semibold">Rekomendasi Saham</h3>
          <p className="text-xs text-slate-500 mt-0.5">Berdasarkan skor fundamental + teknikal jangka panjang</p>
        </div>
        <Badge tone="green" dot>Auto-update</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-white/[0.06]">
              <th className="px-6 py-3 font-medium">Saham</th>
              <th className="px-4 py-3 font-medium text-right">Harga</th>
              <th className="px-4 py-3 font-medium text-right">Kapitalisasi</th>
              <th className="px-4 py-3 font-medium text-center">Skor Fundamental</th>
              <th className="px-4 py-3 font-medium text-center">Skor Teknikal</th>
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
                transition={{ delay: i * 0.04, duration: 0.3 }}
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
                      <p className="text-xs text-slate-500 max-w-[180px] truncate">{s.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className="font-mono font-semibold">{s.price != null ? s.price.toLocaleString('id-ID') : '—'}</p>
                  <p className={`font-mono text-xs ${s.change != null && s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}
                    {s.change}%
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-400">{s.marketCap || '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${s.fundamental.score >= 75 ? 'text-emerald-400' : s.fundamental.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {s.fundamental.score >= 75 && <ArrowUpRight size={14} />}
                    {s.fundamental.score < 60 && <ArrowDownRight size={14} />}
                    {s.fundamental.score ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center font-mono text-sm font-semibold text-slate-300">{s.technical.score ?? '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <ScoreRing value={s.composite ?? 0} size={42} stroke={4} />
                  </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <Badge
                    tone={s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'amber'}
                    dot
                  >
                    {s.signal}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={(e) => fav(e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    aria-label="Tambahkan ke watchlist"
                  >
                    <Star size={16} />
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
