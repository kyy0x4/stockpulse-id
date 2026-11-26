import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PH, Spark, PriceChart } from '../components/ui/DashboardComponents'
import { Activity, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

const GROUPS = [
  { id: 'inflation', label: 'Inflasi' },
  { id: 'labor', label: 'Tenaga Kerja' },
  { id: 'growth', label: 'Pertumbuhan' },
  { id: 'rate', label: 'Suku Bunga & Yield' },
  { id: 'sentiment', label: 'Sentimen' },
  { id: 'commodity', label: 'Komoditas' },
]

function fmtValue(ind) {
  if (ind?.value == null) return '—'
  const v = Number(ind.value)
  const d = Math.abs(v) >= 100 ? 0 : 2
  const n = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  if (ind.unit === '%') return `${n}%`
  if (ind.unit === 'USD') return `$${n}`
  if (ind.unit === 'ribu') return `${n}K`
  return n
}

function fmtChange(v) {
  if (v == null) return '—'
  const n = Number(v)
  return `${n > 0 ? '+' : ''}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function IndicatorCard({ ind, active, onClick }) {
  const series = (ind.series || []).map((p) => (Array.isArray(p) ? p[1] : p.value)).filter((n) => n != null)
  const up = (ind.change ?? 0) >= 0
  const col = up ? 'var(--up)' : 'var(--down)'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="w-full text-left cursor-pointer transition-all duration-150"
          style={{
            background: active ? 'var(--bg3)' : 'var(--bg2)',
            border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border)'}`,
            borderRadius: 11,
            padding: '13px 14px',
            minHeight: 112,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div className="flex items-start gap-2">
            <span className="flex-1 font-mono text-[9px] tracking-[0.08em] text-muted-foreground leading-[1.5] uppercase">
              {ind.label}
            </span>
            {series.length > 1 && <Spark data={series.slice(-12)} up={up} w={48} h={18} />}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[23px] font-extrabold text-foreground tracking-tight">
              {fmtValue(ind)}
            </span>
            <span className="font-mono text-[10px]" style={{ color: col }}>
              {fmtChange(ind.change)}
            </span>
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-muted-foreground">{ind.id}</span>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">{ind.date || '—'}</span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{ind.label} — {fmtValue(ind)}</TooltipContent>
    </Tooltip>
  )
}

export default function MacroPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.macro()
      .then((res) => {
        if (!alive) return
        setData(res)
        setSelected(res?.indicators?.[0]?.id || null)
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const indicators = data?.indicators || []
  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: indicators.filter((i) => i.kind === g.id) })).filter((g) => g.items.length > 0),
    [indicators],
  )

  const active = indicators.find((i) => i.id === selected) || indicators[0] || null
  const activeUp = (active?.change ?? 0) >= 0
  const activeRows = (active?.series || [])
    .map((p) => ({
      date: Array.isArray(p) ? p[0] : p.date,
      close: Array.isArray(p) ? p[1] : p.value,
    }))
    .filter((r) => r.close != null)
    .sort((a, b) => {
      const toTime = (v) => {
        if (typeof v === 'number') return v < 1e12 ? v * 1000 : v
        const t = new Date(String(v).length === 10 ? `${v}T00:00:00` : String(v)).getTime()
        return Number.isNaN(t) ? 0 : t
      }
      return toTime(a.date) - toTime(b.date)
    })

  return (
    <div className="fade-up">
      <PH eyebrow="FRED · Federal Reserve Bank of St. Louis" title="Makro Monitor" />

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4.5">
        <div className="flex gap-1.5 flex-wrap">
          {['Inflasi', 'Tenaga Kerja', 'GDP', 'Suku Bunga', 'Yield', 'Komoditas'].map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] font-mono uppercase">{t}</Badge>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] text-ink-soft">
          <RefreshCw size={11} className="text-accent" />
          {loading
            ? 'SYNCING…'
            : data?.updated
              ? `UPDATE ${new Date(data.updated).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
              : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
          Gagal memuat data makro: {error}
        </div>
      )}

      {loading && indicators.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Memuat data FRED…</CardContent></Card>
      )}

      {active && (
        <Card className="mb-5.5">
          <CardHeader className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Activity size={15} className="text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[14px] font-bold text-foreground">{active.label}</CardTitle>
                <CardDescription>
                  {activeRows.length} observasi terakhir · satuan {String(active.unit || '—').toUpperCase()}
                </CardDescription>
              </div>
              <Badge tone={activeUp ? 'green' : 'red'} className="text-[10px] font-mono">
                {fmtValue(active)} · {fmtChange(active.change)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {activeRows.length >= 2 ? (
              <PriceChart rows={activeRows} height={280} />
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Belum ada observasi</div>
            )}
          </CardContent>
        </Card>
      )}

      {grouped.map((g) => (
        <section key={g.id} className="mb-5.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="h-[14px] w-[3px] rounded-sm bg-accent" />
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase">{g.label}</span>
            <Badge variant="secondary" className="text-[10px]">{g.items.length}</Badge>
            <span className="flex-1 h-px bg-border" />
          </div>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {g.items.map((ind) => (
              <IndicatorCard key={ind.id} ind={ind} active={active?.id === ind.id} onClick={() => setSelected(ind.id)} />
            ))}
          </div>
        </section>
      ))}

      <div className="mt-4 font-mono text-[9px] text-muted-foreground tracking-[0.06em]">
        SUMBER: {data?.source || 'FRED'} · DATA MAKRO DIPERBARUI HARIAN/BULANAN, DI-CACHE 1 JAM
      </div>
    </div>
  )
}
