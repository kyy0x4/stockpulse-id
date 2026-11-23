import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'
import { Clock, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react'

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
const toneClass = (s) => (s === 'positive' ? 'tag-green' : s === 'negative' ? 'tag-red' : 'tag-neutral')

function NewsCard({ item, stocks, onOpenStock }) {
  const imp = item?.impact || {}
  const related = item?.related || []
  const sentiment = sentOf(item?.sentiment)
  const dirSent = sentOf(imp.direction || item?.sentiment)
  const tone = toneOf(dirSent)
  const relatedTickers = related.slice(0, 5)

  const openStock = (ticker) => {
    const found = stocks.find((s) => s.ticker === ticker)
    if (found) onOpenStock?.(viewStock(found))
  }

  return (
    <article className="cg-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="chip" style={{ textTransform: 'uppercase' }}>{item.category || 'us'}</span>
        <span className={`tag ${toneClass(sentiment)}`}>{sentiment.toUpperCase()}</span>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', color: 'var(--text3)', display: 'inline-flex' }}
          aria-label="Buka berita"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, letterSpacing: '-0.01em' }}>{item.title}</h3>
      </a>

      <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>DAMPAK</span>
          <span className="tag" style={{ color: tone, background: 'var(--bg3)', borderColor: 'var(--border2)' }}>
            {String(imp.direction || item.sentiment || 'netral').toUpperCase()}
          </span>
          <span className="chip">{imp.scope_label || 'UMUM'}</span>
          {imp.event && <span className="chip">{imp.event}</span>}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>KEKUATAN {imp.strength ?? 0}%</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.03em', color: tone }}>
          {String(imp.asset || imp.ihsg || 'netral untuk pasar global').toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{imp.market_move || 'Dampaknya terbatas dan selektif.'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {relatedTickers.length > 0 ? relatedTickers.map((r) => {
            const dcol = toneOf(sentOf(r.direction))
            return (
              <button
                key={r.ticker}
                onClick={() => openStock(r.ticker)}
                className="chip"
                style={{ cursor: 'pointer', color: dcol, borderColor: 'var(--border2)', background: 'var(--bg3)' }}
              >
                {r.ticker}{r.direction === 'positif' ? ' ↑' : r.direction === 'negatif' ? ' ↓' : ''}
              </button>
            )
          }) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>TIDAK ADA ASET SPESIFIK</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 12, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text3)' }}>
        <span>{item.source || 'news feed'}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} />
          {item.published ? new Date(item.published).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </article>
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

  return (
    <div className="fade-up">
      <PH eyebrow="News impact · global feeds" title="News Impact" />

      <div className="tabstrip">
        {CATS.map((c) => (
          <button key={c.id} className={`tabstrip-tab ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Arah dampak berita ke aset, sektor, dan pasar global.</span>
        <span className="tag tag-accent">Impact on asset + market</span>
      </div>

      {loading && <div className="cg-card empty-state">Mengambil analisa berita…</div>}
      {error && !loading && <div className="cg-card empty-state" style={{ color: 'var(--down)' }}>Berita gagal dimuat: {error}</div>}

      {!loading && !error && (
        <div className="split-grid">
          <div style={{ display: 'grid', gap: 14 }}>
            {items.slice(0, 12).map((item) => (
              <NewsCard key={item.link} item={item} stocks={stocks} onOpenStock={onSelectStock} />
            ))}
            {items.length === 0 && <div className="cg-card empty-state">Belum ada berita.</div>}
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <div className="cg-card">
              <div className="cg-card-head">
                <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="cg-card-title">Dampak per Sektor</div>
                  <div className="cg-card-sub">Aset yang muncul di berita</div>
                </div>
              </div>
              <div style={{ padding: '6px 16px 14px' }}>
                {sectors.length === 0 && <div className="empty-state" style={{ padding: 20 }}>— belum ada data —</div>}
                {sectors.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{s.count} mention</span>
                    <span className="num" style={{ fontSize: 10, color: 'var(--up)', minWidth: 22, textAlign: 'right' }}>+{s.bull}</span>
                    <span className="num" style={{ fontSize: 10, color: 'var(--down)', minWidth: 22, textAlign: 'right' }}>−{s.bear}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cg-card">
              <div className="cg-card-head">
                <TrendingDown size={15} style={{ color: 'var(--text2)' }} />
                <div className="cg-card-title">Cara Baca</div>
              </div>
              <div style={{ padding: '10px 16px 16px', display: 'grid', gap: 10 }}>
                {[
                  'Sentimen positif yang kuat biasanya jadi dorongan awal ke aset yang disebut langsung.',
                  'Jika banyak ticker muncul, dampaknya cenderung melebar ke satu sektor.',
                  'Fokus halaman ini adalah efek ke pasar, bukan sekadar merangkum isi berita.',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
