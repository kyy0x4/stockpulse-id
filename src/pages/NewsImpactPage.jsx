import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'
import { Clock, ExternalLink, TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Progress,
} from '@/components/ui/progress'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const CATS = [
  { id: 'all', label: 'Semua' },
  { id: 'us', label: 'Saham AS' },
  { id: 'crypto', label: 'Kripto' },
  { id: 'macro', label: 'Makro AS' },
  { id: 'geopolitik', label: 'Geopolitik' },
]

const sentOf = (v) => {
  const s = String(v || '').toLowerCase()
  if (s === 'positif' || s === 'positive') return 'positive'
  if (s === 'negatif' || s === 'negative') return 'negative'
  return 'neutral'
}
const toneOf = (s) => (s === 'positive' ? 'var(--up)' : s === 'negative' ? 'var(--down)' : 'var(--text3)')

function NewsCard({ item, stocks, onOpenStock }) {
  const imp = item?.impact || {}
  const related = item?.related || []
  const sentiment = sentOf(item?.sentiment)
  const dirSent = sentOf(imp.direction || item?.sentiment)
  const tone = toneOf(dirSent)
  const relatedTickers = related.slice(0, 5)
  const sentimentTone = sentiment === 'positive' ? 'green' : sentiment === 'negative' ? 'red' : 'neutral'

  const openStock = (ticker) => {
    const found = stocks.find((s) => s.ticker === ticker)
    if (found) onOpenStock?.(viewStock(found))
  }

  return (
    <Card>
      <CardContent className="p-4.5 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] font-mono uppercase">{item.category || 'us'}</Badge>
          <Badge tone={sentimentTone} className="text-[10px]">{sentiment.toUpperCase()}</Badge>
          <a
            href={item.link} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors inline-flex"
            aria-label="Buka berita"
          >
            <ExternalLink size={12} />
          </a>
        </div>

        <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-foreground no-underline hover:text-accent transition-colors">
          <h3 className="text-[14px] font-semibold leading-[1.45] tracking-tight m-0">{item.title}</h3>
        </a>

        <div className="rounded-lg border bg-background p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground">DAMPAK</span>
            <Badge variant="outline" className="text-[9px] font-mono" style={{ color: tone }}>
              {String(imp.direction || item.sentiment || 'netral').toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-[9px]">{imp.scope_label || 'UMUM'}</Badge>
            {imp.event && <Badge variant="outline" className="text-[9px]">{imp.event}</Badge>}
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">
              KEKUATAN {imp.strength ?? 0}%
            </span>
          </div>
          <div className="font-mono text-[10.5px] tracking-wide" style={{ color: tone }}>
            {String(imp.asset || imp.ihsg || 'netral untuk pasar global').toUpperCase()}
          </div>
          <div className="text-[12px] text-ink-soft leading-[1.5]">
            {imp.market_move || 'Dampaknya terbatas dan selektif.'}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {relatedTickers.length > 0 ? relatedTickers.map((r) => {
              const dcol = toneOf(sentOf(r.direction))
              const dTone = r.direction === 'positif' ? 'green' : r.direction === 'negatif' ? 'red' : 'neutral'
              return (
                <Tooltip key={r.ticker}>
                  <TooltipTrigger asChild>
                    <Badge tone={dTone} className="text-[10px] font-mono gap-1 cursor-pointer" style={{ color: dcol }}>
                      {r.ticker}
                      {r.direction === 'positif' && <ArrowUpRight size={10} />}
                      {r.direction === 'negatif' && <ArrowDownRight size={10} />}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Klik untuk lihat detail {r.ticker}</TooltipContent>
                </Tooltip>
              )
            }) : (
              <span className="font-mono text-[9px] text-muted-foreground">TIDAK ADA ASET SPESIFIK</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t font-mono text-[9.5px] text-muted-foreground">
          <span>{item.source || 'news feed'}</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={10} />
            {item.published
              ? new Date(item.published).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NewsImpactPage({ stocks = [], onSelectStock }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cat, setCat] = useState('all')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    api.news(cat, 30)
      .then((res) => alive && setItems(res.items || []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [cat])

  const sectors = useMemo(() => {
    const m = new Map()
    items.forEach((item) => {
      ;(item.related || []).forEach((r) => {
        if (!r.ticker) return
        const found = stocks.find((s) => s.ticker === r.ticker)
        const sector = r.sector || found?.sector || 'Lainnya'
        const g = m.get(sector) || { count: 0, bull: 0, bear: 0 }
        g.count += 1
        if (sentOf(item.sentiment) === 'positive') g.bull += 1
        if (sentOf(item.sentiment) === 'negative') g.bear += 1
        m.set(sector, g)
      })
    })
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [items, stocks])

  const totalMentions = sectors.reduce((a, s) => a + s.count, 0)

  return (
    <div className="fade-up">
      <PH eyebrow="News impact · global feeds" title="News Impact" />

      <Tabs value={cat} onValueChange={setCat} className="mb-4">
        <TabsList className="h-9">
          {CATS.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-[13px]">{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <span className="text-xs text-ink-soft">Arah dampak berita ke aset, sektor, dan pasar global.</span>
        <Badge tone="accent" className="text-[10px]">Impact on asset + market</Badge>
      </div>

      {loading && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Mengambil analisa berita…</CardContent></Card>
      )}
      {error && !loading && (
        <Card><CardContent className="py-10 text-center text-sm text-destructive">Berita gagal dimuat: {error}</CardContent></Card>
      )}

      {!loading && !error && (
        <div className="split-grid">
          <div className="flex flex-col gap-3.5">
            {items.slice(0, 12).map((item) => (
              <NewsCard key={item.link} item={item} stocks={stocks} onOpenStock={onSelectStock} />
            ))}
            {items.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada berita.</CardContent></Card>
            )}
          </div>

          <aside className="flex flex-col gap-3.5">
            <Card>
              <CardHeader className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-up-dim border border-up-line flex items-center justify-center">
                    <TrendingUp size={15} className="text-up" />
                  </div>
                  <div>
                    <CardTitle className="text-[14px] font-bold text-foreground">Dampak per Sektor</CardTitle>
                    <CardDescription>{totalMentions} mention total</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {sectors.length === 0 && (
                  <div className="py-5 text-center text-xs text-muted-foreground">Belum ada data</div>
                )}
                <div className="flex flex-col gap-1">
                  {sectors.map((s, i) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-2 py-2"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-foreground font-medium truncate">{s.name}</div>
                        <Progress
                          value={totalMentions ? Math.round((s.count / totalMentions) * 100) : 0}
                          className="mt-1 h-1 rounded-full"
                        />
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground whitespace-nowrap">
                        {s.count} mention
                      </span>
                      <span className="font-mono text-[10px] text-up min-w-[22px] text-right">+{s.bull}</span>
                      <span className="font-mono text-[10px] text-down min-w-[22px] text-right">−{s.bear}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-elevated border border-line-strong flex items-center justify-center">
                    <TrendingDown size={15} className="text-ink-soft" />
                  </div>
                  <CardTitle className="text-[14px] font-bold text-foreground">Cara Baca</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-col gap-2.5">
                  {[
                    'Sentimen positif yang kuat biasanya jadi dorongan awal ke aset yang disebut langsung.',
                    'Jika banyak ticker muncul, dampaknya cenderung melebar ke satu sektor.',
                    'Fokus halaman ini adalah efek ke pasar, bukan sekadar merangkum isi berita.',
                  ].map((text, i) => (
                    <div key={i} className="flex gap-2.5 text-[12px] text-ink-soft leading-[1.55]">
                      <span className="font-mono text-[10px] text-accent">{String(i + 1).padStart(2, '0')}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
