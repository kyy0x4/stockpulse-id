import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Badge from '../components/ui/Badge'
import ScoreRing from '../components/ui/ScoreRing'
import ProgressBar from '../components/ui/ProgressBar'
import PriceTrendChart from '../components/charts/PriceTrendChart'
import { X, Star, TrendingUp, TrendingDown, Clock, BarChart3, PieChart, Loader2 } from 'lucide-react'
import { api } from '../api/client'

const mockSeries = [
  { d: 'H1', close: 8920 }, { d: 'H2', close: 9080 }, { d: 'H3', close: 9180 },
  { d: 'H4', close: 9120 }, { d: 'H5', close: 9300 }, { d: 'H6', close: 9380 },
  { d: 'H7', close: 9250 }, { d: 'H8', close: 9440 }, { d: 'H9', close: 9520 },
  { d: 'H10', close: 9650 },
]

function MetricRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`font-mono text-sm font-semibold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function StockDetailPage({ stock, onClose, onToggleFav, favorites }) {
  const f = stock.fundamental
  const t = stock.technical
  const isFav = favorites.includes(stock.ticker)

  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    let alive = true
    setLoadingDetail(true)
    api.detail(stock.ticker)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null))
      .finally(() => alive && setLoadingDetail(false))
    return () => { alive = false }
  }, [stock.ticker])

  const history = detail?.history || []
  const chartData =
    history.length > 0
      ? history.slice(-30).map((h) => ({ date: h.date?.slice(5) || '—', close: h.close }))
      : mockSeries

  const price = detail?.price ?? stock.price
  const change = detail?.change ?? stock.change
  const name = detail?.name ?? stock.name
  const sector = detail?.sector ?? stock.sector

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-[#060d1c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 font-mono text-lg font-bold text-emerald-400">
                {stock.ticker.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight">{stock.ticker}</h2>
                  <Badge tone={stock.signal === 'BUY' ? 'green' : stock.signal === 'SELL' ? 'red' : 'amber'} dot>
                    {stock.signal === 'BUY' ? 'Layak Beli' : stock.signal === 'SELL' ? 'Hindari' : 'Tahan'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{name} · {sector}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Clock size={11} /> Update: data real & analisa otomatis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleFav(stock.ticker)}
                className={`rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer ${
                  isFav
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                <Star size={14} className="inline mr-1.5" fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'Di Watchlist' : 'Watchlist'}
              </button>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold tracking-tight">{price != null ? price.toLocaleString('id-ID') : '—'}</p>
                <p className={`flex items-center justify-end gap-1 font-mono text-sm ${change != null && change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {change != null && change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {change != null ? `${change >= 0 ? '+' : ''}${change}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} className="text-sky-400" />
              <p className="text-sm font-semibold">Performa Harga {history.length > 0 ? '(30 hari)' : '(10 hari)'}</p>
              {loadingDetail && <Loader2 size={14} className="ml-auto animate-spin text-slate-500" />}
            </div>
            <div className="h-[180px]">
              <PriceTrendChart data={chartData} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={15} className="text-emerald-400" />
                <h3 className="text-sm font-semibold">Fundamental</h3>
                <span className="ml-auto font-mono text-xs text-slate-500">Skor: {f.score ?? '—'}/100</span>
              </div>
              <div className="space-y-2">
                <MetricRow label="PER (Price to Earnings)" value={f.per} good={f.per > 0 && f.per < 15} />
                <MetricRow label="PBV (Price to Book)" value={f.pbv} good={f.pbv < 3} />
                <MetricRow label="ROE (Return on Equity)" value={f.roe != null ? `${f.roe}%` : null} good={f.roe > 15} />
                <MetricRow label="DER (Debt to Equity)" value={f.der} good={f.der < 1} />
                <MetricRow label="Pertumbuhan Laba" value={f.growth != null ? `${f.growth}%` : null} good={f.growth > 10} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Skor Fundamental</span>
                  <span className="font-mono text-emerald-400">{f.score ?? '—'}</span>
                </div>
                <ProgressBar value={f.score ?? 0} color={f.score >= 75 ? '#22c55e' : f.score >= 60 ? '#f59e0b' : '#ef4444'} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-sky-400" />
                <h3 className="text-sm font-semibold">Teknikal</h3>
                <span className="ml-auto font-mono text-xs text-slate-500">Skor: {t.score ?? '—'}/100</span>
              </div>
              <div className="space-y-2">
                <MetricRow label="RSI (14 hari)" value={t.rsi} good={t.rsi > 40 && t.rsi < 70} />
                <MetricRow label="MACD" value={t.macd} good={t.macd === 'Bullish'} />
                <MetricRow label="Trend" value={t.trend} good={t.trend === 'Uptrend'} />
                <MetricRow label="Rasio Volume" value={t.vol != null ? `${t.vol}x` : null} good={t.vol >= 1} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Skor Teknikal</span>
                  <span className="font-mono text-sky-400">{t.score ?? '—'}</span>
                </div>
                <ProgressBar value={t.score ?? 0} color={t.score >= 75 ? '#22c55e' : t.score >= 60 ? '#f59e0b' : '#ef4444'} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5">
            <div>
              <p className="text-xs text-emerald-400/80 uppercase tracking-widest font-medium">Skor Total Composite</p>
              <p className="mt-1 text-sm text-slate-400 max-w-sm">
                {stock.composite >= 75
                  ? 'Saham ini lolos seleksi fundamental & teknikal jangka panjang. Cocok untuk masuk daftar kandidat beli.'
                  : stock.composite >= 60
                    ? 'Cukup solid, tapi belum ideal. Tunggu koreksi atau perbaikan fundamental sebelum masuk.'
                    : 'Di bawah standar. Hindari untuk portofolio jangka panjang saat ini.'}
              </p>
            </div>
            <ScoreRing value={stock.composite ?? 0} size={64} stroke={6} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
