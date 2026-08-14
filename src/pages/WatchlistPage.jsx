import { useMemo } from 'react'
import { Spark, SBar, PH, pct, sigColor, sigBg, viewStock, cap } from '../components/ui/DashboardComponents'

export default function WatchlistPage({ theme = 'dark', onSelectStock, stocks = [], favorites = [], onToggleFav }) {
  const data = useMemo(() => stocks.map(viewStock), [stocks])
  const watched = data.filter(s => favorites.includes(s.ticker))
  const avail = data.filter(s => !favorites.includes(s.ticker))

  const up = watched.filter(s => s.changePct > 0).length
  const down = watched.filter(s => s.changePct < 0).length

  return (
    <div className="fade-up" style={{ padding:'20px 16px 28px' }}>
      <PH eyebrow="PORTOFOLIO PANTAUAN" title="WATCHLIST" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:1, marginBottom:28, background:'var(--border)' }}>
        {[
          { label:'TOTAL SAHAM', val:watched.length, color:'var(--text)' },
          { label:'SAHAM NAIK',  val:up, color:'var(--up)' },
          { label:'SAHAM TURUN', val:down, color:'var(--down)' },
        ].map(x => (
          <div key={x.label} style={{ background:'var(--bg2)', padding:'16px 22px', minHeight:96 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:6 }}>{x.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:42, fontWeight:800, color:x.color, lineHeight:1 }}>{x.val}</div>
          </div>
        ))}
      </div>

      <div style={{ border:'1px solid var(--border)', overflowX:'auto', background:'var(--bg2)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
          <thead>
            <tr>
              {['SAHAM', 'HARGA', 'CHG%', 'KAPITALISASI', 'FUNDAMENTAL', 'TEKNIKAL', 'SIGNAL', ''].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: h === 'SAHAM' ? 'left' : 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {watched.map(s => (
              <tr key={s.ticker} className="trow" onClick={() => onSelectStock?.(s)} style={{ cursor:'pointer' }}>
                <td style={{ padding:'14px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                    <Spark data={s.sparkline} up={s.changePct >= 0} w={44} h={22} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{s.ticker}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:1, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                    </div>
                    <span className="chip" style={{ flexShrink:0 }}>{s.sector}</span>
                  </div>
                </td>
                <td style={{ padding:'14px 14px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:500, color:'var(--text)' }}>{s.price.toLocaleString('id-ID')}</td>
                <td style={{ padding:'14px 14px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:500, color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.changePct)}</td>
                <td style={{ padding:'14px 14px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text2)' }}>{cap(s.mktCap) ?? '—'}</td>
                <td style={{ padding:'14px 14px' }}><div style={{ display:'flex', justifyContent:'flex-end' }}><SBar v={s.fundScore} color="var(--accent)" /></div></td>
                <td style={{ padding:'14px 14px' }}><div style={{ display:'flex', justifyContent:'flex-end' }}><SBar v={s.techScore} color="var(--up)" /></div></td>
                <td style={{ padding:'11px 14px', textAlign:'right' }}>
                  <span className="sig" style={{ color:sigColor(s.signal, theme), background:sigBg(s.signal), borderColor:`${sigColor(s.signal, theme)}40` }}>{s.signal}</span>
                </td>
                <td style={{ padding:'11px 14px', textAlign:'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFav?.(s.ticker) }}
                    style={{ background:'var(--down-dim)', border:'1px solid var(--down)', color:'var(--down)', width:24, height:24, cursor:'pointer', fontSize:13, lineHeight:0 }}
                    aria-label={`Hapus ${s.ticker} dari watchlist`}
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {watched.length === 0 && (
          <div style={{ padding:'48px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>
            — WATCHLIST KOSONG, TAMBAHKAN SAHAM DI BAWAH —
          </div>
        )}
      </div>

      <div style={{ marginTop:20 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:10 }}>+ TAMBAH KE WATCHLIST</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:1, background:'var(--border)' }}>
          {avail.length === 0 && (
            <div style={{ background:'var(--bg2)', padding:'20px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)', flex:1 }}>
              SEMUA SAHAM SUDAH DI WATCHLIST
            </div>
          )}
          {avail.map(s => (
            <button
              key={s.ticker}
              onClick={() => onToggleFav?.(s.ticker)}
              style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg2)', border:'none', padding:'10px 12px', cursor:'pointer', transition:'all 0.12s', minHeight:48 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--accent)', fontWeight:500 }}>+</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, letterSpacing:'-0.01em' }}>{s.ticker}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color: s.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(s.changePct)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
