import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'

const toneColor = (item) => {
  const v = String(item?.sentiment || '').toLowerCase()
  if (v === 'positif' || v === 'positive') return 'var(--up)'
  if (v === 'negatif' || v === 'negative') return 'var(--down)'
  return 'var(--text3)'
}

function NewsCard({ item, stocks, onOpenStock }) {
  const imp = item?.impact || {}
  const related = item?.related || []
  const tone = toneColor(item)
  const relatedTickers = related.slice(0, 5)

  const openStock = (ticker) => {
    const found = stocks.find((s) => s.ticker === ticker)
    if (found) onOpenStock?.(viewStock(found))
  }

  return (
    <article className="hoverable" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: `3px solid ${tone}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', minHeight: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="chip">{item.category || 'market'}</span>
        <span className="sig" style={{ color: tone, borderColor: `${tone}40`, background: 'var(--bg3)' }}>{String(item.sentiment || 'netral').toUpperCase()}</span>
      </div>

      <button
        onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
        style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
      >
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6 }}>{item.title}</h3>
      </button>

      <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--border)', borderLeft: `3px solid ${tone}`, background: 'var(--bg)', display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>DAMPAK</span>
          <span className="sig" style={{ color: tone, borderColor: `${tone}40`, background: 'var(--bg3)' }}>{String(imp.direction || item.sentiment || 'netral').toUpperCase()}</span>
          <span className="chip">{imp.scope_label || 'UMUM'}</span>
          {imp.event && <span className="chip">{imp.event}</span>}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>KEKUATAN {imp.strength ?? 0}%</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: tone }}>
          {String(imp.ihsg || 'netral untuk IHSG').toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{imp.market_move || 'Dampaknya terbatas dan selektif.'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {relatedTickers.length > 0 ? relatedTickers.map((r) => {
            const dcol = r.direction === 'positif' ? 'var(--up)' : r.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
            return (
              <button
                key={r.ticker}
                onClick={() => openStock(r.ticker)}
                className="chip"
                style={{ cursor: 'pointer', color: dcol, borderColor: `${dcol}40` }}
              >
                {r.ticker}{r.direction === 'positif' ? ' ↑' : r.direction === 'negatif' ? ' ↓' : ''}
              </button>
            )
          }) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>TIDAK ADA EMITEN SPESIFIK</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '0.04em' }}>{item.source || 'news feed'}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>
          {item.published ? new Date(item.published).toLocaleString('id-ID') : ''}
        </span>
      </div>
    </article>
  )
}

export default function NewsImpactPage({ stocks = [], onSelectStock }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    api.news('market', 30)
      .then((res) => alive && setItems(res.items || []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const sectors = useMemo(() => {
    const m = new Map()
    items.forEach((item) => {
      ;(item.related || []).forEach((r) => {
        if (!r.ticker) return
        const found = stocks.find((s) => s.ticker === r.ticker)
        const sector = r.sector || found?.sector || 'Lainnya'
        const g = m.get(sector) || { count: 0, bull: 0, bear: 0 }
        g.count += 1
        if ((item.sentiment || '').toLowerCase() === 'positif') g.bull += 1
        if ((item.sentiment || '').toLowerCase() === 'negatif') g.bear += 1
        m.set(sector, g)
      })
    })
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [items, stocks])

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="NEWS IMPACT · REAL FEEDS" title="NEWS IMPACT" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em' }}>
          BACA ULANG BERITA · ARAH DAMPAK KE EMITEN, SEKTOR, DAN IHSG
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '0.12em' }}>IMPACT ON ISSUER + IHSG</span>
      </div>

      {loading && (
        <div style={{ padding: '60px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '0.08em' }}>MENGAMBIL ANALISA BERITA REAL...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '60px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--down)', letterSpacing: '0.08em' }}>BERITA GAGAL DIMUAT: {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]" style={{ alignItems: 'start' }}>
          <div className="grid gap-4">
            {items.slice(0, 12).map((item) => (
              <NewsCard key={item.link} item={item} stocks={stocks} onOpenStock={onSelectStock} />
            ))}
          </div>

          <aside className="grid gap-px bg-line">
            <div className="bg-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 4 }}>DAMPAK PER SEKTOR</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 12 }}>BERDASARKAN EMITEN YANG MUNCUL DI BERITA</div>
              {sectors.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>— BELUM ADA DATA —</div>}
              {sectors.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{s.count} MENTION</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--up)', minWidth: 26, textAlign: 'right' }}>+{s.bull}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--down)', minWidth: 26, textAlign: 'right' }}>-{s.bear}</span>
                </div>
              ))}
            </div>

            <div className="bg-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 14 }}>CARA BACA</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>01</span>
                  <span>Sentimen positif yang kuat biasanya jadi dorongan awal ke emiten yang disebut langsung.</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>02</span>
                  <span>Jika banyak ticker muncul, dampaknya cenderung melebar ke satu sektor.</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>03</span>
                  <span>Fokus page ini adalah efek ke pasar, bukan sekadar merangkum isi berita.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}