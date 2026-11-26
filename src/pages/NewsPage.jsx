import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'
import { Clock, ExternalLink, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

const CATS = [
  { id: 'all', label: 'Semua' },
  { id: 'us', label: 'Saham AS' },
  { id: 'crypto', label: 'Kripto' },
  { id: 'macro', label: 'Makro AS' },
  { id: 'geopolitik', label: 'Geopolitik' },
]

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam`
  return `${Math.floor(hrs / 24)} hari`
}

const sent = (s) => {
  const v = String(s || '').toLowerCase()
  if (v === 'positif' || v === 'positive') return 'positive'
  if (v === 'negatif' || v === 'negative') return 'negative'
  return 'neutral'
}

export default function NewsPage({ onSelectStock, stocks = [] }) {
  const [cat, setCat] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const openStock = (ticker) => {
    if (!ticker) return
    const found = stocks.find((s) => s.ticker === ticker)
    if (found) onSelectStock?.(viewStock(found))
  }

  const impactText = (item) => {
    const impact = item?.impact || {}
    const related = item?.related || []
    const names = related.map((r) => r.ticker).filter(Boolean).slice(0, 4)
    return {
      headline: impact.asset || impact.ihsg || 'netral untuk pasar global',
      move: impact.market_move || 'dampaknya terbatas',
      strength: impact.strength ?? 0,
      direction: impact.direction || sent(item.sentiment),
      scopeLabel: impact.scope_label || 'UMUM',
      event: impact.event || null,
      related: names,
    }
  }

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

  return (
    <div className="fade-up">
      <PH eyebrow="Berita internasional · kripto · saham AS · makro" title="Global News" />

      <Tabs value={cat} onValueChange={setCat} className="mb-4">
        <TabsList className="h-9">
          {CATS.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-[13px]">{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Mengambil berita terbaru…
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Berita gagal dimuat: {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada berita saat ini.
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {items.map((item, i) => {
            const sentiment = sent(item.sentiment)
            const imp = impactText(item)
            const dirColor = imp.direction === 'positif' ? 'var(--up)' : imp.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
            const sentimentTone = sentiment === 'positive' ? 'green' : sentiment === 'negative' ? 'red' : 'neutral'
            return (
              <Card
                key={item.link || i}
                hover={!!item.ticker}
                className="cursor-pointer"
                onClick={() => openStock(item.ticker)}
              >
                <CardContent className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase">{item.category || cat}</Badge>
                    {item.ticker && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge tone="accent" className="text-[10px] font-mono">{item.ticker}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Klik untuk lihat detail {item.ticker}</TooltipContent>
                      </Tooltip>
                    )}
                    <Badge tone={sentimentTone} className="text-[10px] ml-auto">
                      {sentiment.toUpperCase()}
                    </Badge>
                  </div>

                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-foreground no-underline hover:text-accent transition-colors">
                    <h3 className="text-[14px] font-semibold leading-[1.45] tracking-tight line-clamp-3 m-0">
                      {item.title}
                    </h3>
                  </a>

                  <div className="rounded-lg border bg-background p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground">DAMPAK</span>
                      <Badge variant="outline" className="text-[9px] font-mono" style={{ color: dirColor }}>
                        {String(imp.direction).toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px]">{imp.scopeLabel}</Badge>
                      <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                        KEKUATAN {imp.strength}%
                      </span>
                    </div>
                    <div className="font-mono text-[10.5px] tracking-wide" style={{ color: dirColor }}>
                      {imp.headline.toUpperCase()}
                    </div>
                    <div className="text-[12px] text-ink-soft leading-[1.5]">{imp.move}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {imp.related.length > 0 ? imp.related.map((t, idx) => {
                        const rel = item?.related?.[idx]
                        const dcol = rel?.direction === 'positif' ? 'var(--up)' : rel?.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
                        return (
                          <Badge key={t} variant="outline" className="text-[10px] font-mono gap-1" style={{ color: dcol }}>
                            {t}
                            {rel?.direction === 'positif' && <ArrowUpRight size={10} />}
                            {rel?.direction === 'negatif' && <ArrowDownRight size={10} />}
                          </Badge>
                        )
                      }) : (
                        <span className="font-mono text-[9px] text-muted-foreground">TIDAK ADA ASET SPESIFIK</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-auto font-mono text-[9.5px] text-muted-foreground">
                    {item.source && (
                      <span className="inline-flex items-center gap-1"><Newspaper size={10} /> {item.source}</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Clock size={10} /> {timeAgo(item.published)}</span>
                    <a
                      href={item.link} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto inline-flex text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Buka berita"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
