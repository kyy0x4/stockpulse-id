import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import StockLogo from '../ui/StockLogo'
import { Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StockTable({ stocks, onSelect, onToggleFav, favorites = [] }) {

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div>
          <h3 className="font-semibold">Rekomendasi Saham</h3>
          <p className="text-xs text-ink-faint mt-0.5">Berdasarkan skor fundamental + teknikal jangka panjang</p>
        </div>
        <Badge tone="green" dot>Auto-update</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint border-b border-line">
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
                className="border-b border-line last:border-0 hover:bg-elevated transition-colors cursor-pointer"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} />
                    <div>
                      <p className="font-semibold tracking-tight">{s.ticker}</p>
                      <p className="text-xs text-ink-faint max-w-[180px] truncate">{s.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className="font-mono font-semibold">{s.price != null ? s.price.toLocaleString('id-ID') : '—'}</p>
                  <p className={`font-mono text-xs ${s.change != null && s.change >= 0 ? 'text-up' : 'text-down'}`}>
                    {s.change >= 0 ? '+' : ''}
                    {s.change}%
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">{s.marketCap || '—'}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${s.fundamental.score >= 75 ? 'text-up' : s.fundamental.score >= 60 ? 'text-warning' : 'text-down'}`}>
                    {s.fundamental.score >= 75 && <ArrowUpRight size={14} />}
                    {s.fundamental.score < 60 && <ArrowDownRight size={14} />}
                    {s.fundamental.score ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center font-mono text-sm font-semibold text-ink/70">{s.technical.score ?? '—'}</td>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFav?.(s.ticker)
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      favorites.includes(s.ticker)
                        ? 'text-warning bg-warning/10'
                        : 'text-ink-faint hover:text-warning hover:bg-warning/10'
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
