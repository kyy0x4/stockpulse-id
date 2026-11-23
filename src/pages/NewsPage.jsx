import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'
import { Clock, ExternalLink, Newspaper } from 'lucide-react'

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

const sentTone = (s) => (s === 'positive' ? 'tag-green' : s === 'negative' ? 'tag-red' : 'tag-neutral')

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

      <div className="tabstrip">
        {CATS.map((c) => (
          <button key={c.id} className={`tabstrip-tab ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="cg-card empty-state">Mengambil berita terbaru…</div>
      )}

      {error && !loading && (
        <div className="cg-card empty-state" style={{ color: 'var(--down)' }}>Berita gagal dimuat: {error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="cg-card empty-state">Belum ada berita saat ini.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {items.map((item, i) => {
            const sentiment = sent(item.sentiment)
            const imp = impactText(item)
            const dirColor = imp.direction === 'positif' ? 'var(--up)' : imp.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
            return (
              <article
                key={item.link || i}
                className="cg-card"
                onClick={() => openStock(item.ticker)}
                style={{
                  padding: 16,
                  cursor: item.ticker ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip" style={{ textTransform: 'uppercase' }}>{item.category || cat}</span>
                  {item.ticker && <span className="tag tag-accent">{item.ticker}</span>}
                  <span className={`tag ${sentTone(sentiment)}`} style={{ marginLeft: 'auto' }}>{sentiment.toUpperCase()}</span>
                </div>

                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title}
                  </h3>
                </a>

                <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gap: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>DAMPAK</span>
                    <span className="tag" style={{ color: dirColor, background: 'var(--bg3)', borderColor: 'var(--border2)' }}>{String(imp.direction).toUpperCase()}</span>
                    <span className="chip">{imp.scopeLabel}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>KEKUATAN {imp.strength}%</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.03em', color: dirColor }}>
                    {imp.headline.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{imp.move}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {imp.related.length > 0 ? imp.related.map((t, idx) => {
                      const rel = item?.related?.[idx]
                      const dcol = rel?.direction === 'positif' ? 'var(--up)' : rel?.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
                      return (
                        <span key={t} className="chip" style={{ color: dcol, borderColor: 'var(--border2)' }}>
                          {t}{rel?.direction === 'positif' ? ' ↑' : rel?.direction === 'negatif' ? ' ↓' : ''}
                        </span>
                      )
                    }) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>TIDAK ADA ASET SPESIFIK</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text3)' }}>
                  {item.source && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Newspaper size={10} /> {item.source}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {timeAgo(item.published)}</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', color: 'var(--text3)', display: 'inline-flex' }} aria-label="Buka berita">
                    <ExternalLink size={12} />
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
