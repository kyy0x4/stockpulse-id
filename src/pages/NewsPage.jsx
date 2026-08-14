import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PH, viewStock } from '../components/ui/DashboardComponents'

const CATS = [
  { id: 'market', label: 'Market & Saham' },
  { id: 'ekbis', label: 'Ekonomi & Bisnis' },
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

const sentCol = (s) => s === 'positive' ? 'var(--up)' : s === 'negative' ? 'var(--down)' : 'var(--text3)'

export default function NewsPage({ onSelectStock, stocks = [] }) {
  const [cat, setCat] = useState('market')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const openStock = (ticker) => {
    if (!ticker) return
    const found = stocks.find(s => s.ticker === ticker)
    if (found) onSelectStock?.(viewStock(found))
  }

  const impactText = (item) => {
    const impact = item?.impact || {}
    const related = item?.related || []
    const names = related.map((r) => r.ticker).filter(Boolean).slice(0, 4)
    return {
      headline: impact.ihsg || 'netral untuk IHSG',
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
    <div className="fade-up" style={{ padding:'20px 16px 28px' }}>
      <PH eyebrow="BERITA & ANALISIS PASAR" title="MARKET NEWS" />

      <div style={{ display:'flex', gap:1, flexWrap:'wrap', marginBottom:24, background:'var(--border)' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`fbtn ${cat === c.id ? 'active' : ''}`}>{c.label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ padding:'60px', textAlign:'center', border:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text2)', letterSpacing:'0.08em' }}>MENGAMBIL BERITA TERBARU…</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding:'60px', textAlign:'center', border:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--down)', letterSpacing:'0.08em' }}>BERITA GAGAL DIMUAT: {error}</span>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding:'60px', textAlign:'center', border:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:'0.08em' }}>BELUM ADA BERITA SAAT INI.</span>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:1, background:'var(--border)' }}>
          {items.map((item, i) => (
            <div key={item.link || i} onClick={() => openStock(item.ticker)} style={{
              background: i === 0 ? 'var(--bg3)' : 'var(--bg2)', padding:'18px 18px 16px',
              cursor: item.ticker ? 'pointer' : 'default',
              borderLeft: i === 0 ? '3px solid var(--accent)' : '3px solid transparent',
              transition:'background 0.12s',
              minHeight: 180,
              display:'flex',
              flexDirection:'column',
              minWidth: 0,
            }}
              onMouseEnter={e => (e.currentTarget).style.background = 'var(--bg3)'}
              onMouseLeave={e => (e.currentTarget).style.background = i === 0 ? 'var(--bg3)' : 'var(--bg2)'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                <span className="chip">{item.category || cat}</span>
                {item.ticker && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, padding:'2px 6px', background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent)', letterSpacing:'0.06em' }}>{item.ticker}</span>}
                <span style={{ fontFamily:'var(--font-mono)', fontSize:8, padding:'2px 6px', color: sentCol(sent(item.sentiment)), border:`1px solid ${sentCol(sent(item.sentiment))}`, letterSpacing:'0.06em', opacity:0.8 }}>
                  {sent(item.sentiment).toUpperCase()}
                </span>
              </div>
              <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit', flex:1 }}>
                <div style={{ fontSize:15, fontWeight:500, color:'var(--text)', lineHeight:1.6, marginBottom:10, fontFamily:'var(--font-body)', maxWidth:'100%' }}>
                  {item.title}
                </div>
              </a>
              <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gap: 8 }}>
                {(() => {
                  const imp = impactText(item)
                  const dirColor = imp.direction === 'positif' ? 'var(--up)' : imp.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>DAMPAK</span>
                        <span className="sig" style={{ color: dirColor, borderColor: `${dirColor}40`, background: 'var(--bg3)' }}>{String(imp.direction).toUpperCase()}</span>
                        <span className="chip">{imp.scopeLabel}</span>
                        {imp.event && <span className="chip">{imp.event}</span>}
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>
                          KEKUATAN {imp.strength}%
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: dirColor }}>
                        {imp.headline.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{imp.move}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {imp.related.length > 0 ? imp.related.map((t, i) => {
                          const rel = item?.related?.[i]
                          const dcol = rel?.direction === 'positif' ? 'var(--up)' : rel?.direction === 'negatif' ? 'var(--down)' : 'var(--text3)'
                          return (
                            <span key={t} className="chip" style={{ color: dcol, borderColor: `${dcol}40` }}>
                              {t}{rel?.direction === 'positif' ? ' ↑' : rel?.direction === 'negatif' ? ' ↓' : ''}
                            </span>
                          )
                        }) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>TIDAK ADA EMITEN SPESIFIK</span>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:'auto', flexWrap:'wrap' }}>
                {item.source && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text2)', letterSpacing:'0.04em' }}>{item.source}</span>}
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)' }}>{timeAgo(item.published)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
