import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import StockLogo from '../ui/StockLogo'
import { Star, ArrowUpDown, Filter } from 'lucide-react'

export default function ScreenerTable({ stocks, onSelect, onToggleFav, favorites }) {
  return (
    <div className="table-container">
      <Card className="p-0">
        {/* CoinGlass-style header */}
        <div className="thead">
          <tr>
            <th className="table-cell ticker-cell" style={{ width: '200px' }}>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-accent" />
                <button className="inline-flex items-center gap-1 text-ink hover:text-accent transition-colors cursor-pointer">
                  Saham <ArrowUpDown size={12} />
                </button>
              </div>
            </th>
            <th className="table-cell text-right font-medium" style={{ width: '100px' }}>
              <Badge tone="blue" dot>Data real-time</Badge>
            </th>
            <th className="table-cell text-right font-medium" style={{ width: '80px' }}>Harga</th>
            <th className="table-cell text-center font-medium" style={{ width: '80px' }}>Sektor</th>
            <th className="table-cell text-right font-medium" style={{ width: '70px' }}>PER</th>
            <th className="table-cell text-right font-medium" style={{ width: '70px' }}>ROE</th>
            <th className="table-cell text-right font-medium" style={{ width: '80px' }}>Growth</th>
            <th className="table-cell text-center font-medium" style={{ width: '65px' }}>RSI</th>
            <th className="table-cell text-center font-medium" style={{ width: '85px' }}>Trend</th>
            <th className="table-cell text-center font-medium" style={{ width: '90px' }}>Skor</th>
            <th className="table-cell text-center font-medium" style={{ width: '90px' }}>Signal</th>
            <th className="table-cell" style={{ width: '50px' }} />
          </tr>
        </thead>
        
        <tbody>
          {stocks.map((s, i) => (
            <motion.tr
              key={s.ticker + i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.015, duration: 0.3 }}
              onClick={() => onSelect?.(s)}
              className="trow"
            >
              {/* Ticker & Name */}
              <td className="table-cell ticker-cell">
                <StockLogo ticker={s.ticker} name={s.name} logoUrl={s.logoUrl} />
                <div>
                  <p className="ticker-symbol">{s.ticker}</p>
                  <p className="ticker-name truncate max-w-[140px]">{s.name}</p>
                </div>
              </td>
              
              {/* Status badge */}
              <td className="table-cell text-right">
                <Badge tone="blue" dot>{s.kind === 'crypto' ? 'Kripto' : s.kind === 'etf' ? 'ETF' : 'Saham'}</Badge>
              </td>
              
              {/* Price */}
              <td className="table-cell text-right">
                <p className="font-mono font-semibold">{s.price?.toLocaleString('id-ID')}</p>
                <p className={`font-mono text-xs ${s.change >= 0 ? 'pos' : 'neg'}`}>
                  {s.change >= 0 ? '+' : ''}{s.change}%
                </p>
              </td>
              
              {/* Sector */}
              <td className="table-cell text-center">
                <span className="badge badge--neutral text-xs">{s.sector}</span>
              </td>
              
              {/* PER */}
              <td className="table-cell text-right font-mono text-xs">
                {s.fundamental?.per != null ? `${s.fundamental.per?.toFixed(1)}x` : '—'}
              </td>
              
              {/* ROE */}
              <td className="table-cell text-right font-mono text-xs">
                {s.fundamental?.roe != null ? `${s.fundamental.roe?.toFixed(1)}%` : '—'}
              </td>
              
              {/* Growth */}
              <td className="table-cell text-right font-mono text-xs">
                {s.fundamental?.growth != null ? `${s.fundamental.growth?.toFixed(1)}%` : '—'}
              </td>
              
              {/* RSI */}
              <td className="table-cell text-center font-mono text-xs">
                {s.technical?.rsi?.toFixed(0) ?? '—'}
              </td>
              
              {/* Trend */}
              <td className="table-cell text-center">
                <Badge tone={s.technical?.trend === 'Uptrend' ? 'green' : s.technical?.trend === 'Downtrend' ? 'red' : 'yellow'}>
                  {s.technical?.trend ?? '—'}
                </Badge>
              </td>
              
              {/* Score Ring */}
              <td className="table-cell text-center">
                <ScoreRing value={s.composite ?? 0} size={46} stroke={4} />
              </td>
              
              {/* Signal */}
              <td className="table-cell text-center">
                <Badge tone={s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'yellow'} dot>
                  {s.signal}
                </Badge>
              </td>
              
              {/* Favorite button */}
              <td className="table-cell">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    favorites.includes(s.ticker) 
                      ? 'text-warning bg-warning/10' 
                      : 'text-ink-faint hover:text-accent hover:bg-accent/10'
                  }`}
                  aria-label="Watchlist"
                >
                  <Star size={16} fill={favorites.includes(s.ticker) ? 'currentColor' : 'none'} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </Card>
    </div>
  )
}