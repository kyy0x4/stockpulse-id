import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PH, Spark, PriceChart } from '../components/ui/DashboardComponents'
import { Activity, RefreshCw } from 'lucide-react'

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
    <button
      onClick={onClick}
      className="hoverable"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: active ? 'var(--bg3)' : 'var(--bg2)',
        border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border)'}`,
        borderRadius: 11,
        padding: '13px 14px',
        minHeight: 112,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.08em', lineHeight: 1.5, textTransform: 'uppercase' }}>{ind.label}</span>
        {series.length > 1 && <Spark data={series.slice(-12)} up={up} w={48} h={18} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{fmtValue(ind)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: col }}>{fmtChange(ind.change)}</span>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{ind.id}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)' }}>{ind.date || '—'}</span>
      </div>
    </button>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Inflasi', 'Tenaga Kerja', 'GDP', 'Suku Bunga', 'Yield', 'Komoditas'].map((t) => (
            <span key={t} className="chip" style={{ textTransform: 'uppercase' }}>{t}</span>
          ))}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '0.08em' }}>
          <RefreshCw size={11} style={{ color: 'var(--accent)' }} />
          {loading ? 'SYNCING…' : data?.updated ? `UPDATE ${new Date(data.updated).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>

      {error && (
        <div className="cg-card" style={{ marginBottom: 18, padding: '12px 16px', borderColor: 'var(--down)', color: 'var(--down)', fontSize: 12 }}>
          Gagal memuat data makro: {error}
        </div>
      )}

      {loading && indicators.length === 0 && <div className="cg-card empty-state">Memuat data FRED…</div>}

      {active && (
        <section className="cg-card" style={{ marginBottom: 22 }}>
          <div className="cg-card-head">
            <Activity size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="cg-card-title">{active.label}</div>
              <div className="cg-card-sub">{activeRows.length} observasi terakhir · satuan {String(active.unit || '—').toUpperCase()}</div>
            </div>
            <span className={`tag ${activeUp ? 'tag-green' : 'tag-red'}`} style={{ marginLeft: 'auto' }}>
              {fmtValue(active)} · {fmtChange(active.change)}
            </span>
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            {activeRows.length >= 2 ? (
              <PriceChart rows={activeRows} height={280} />
            ) : (
              <div className="empty-state">— belum ada observasi —</div>
            )}
          </div>
        </section>
      )}

      {grouped.map((g) => (
        <section key={g.id} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 3, height: 14, borderRadius: 2, background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{g.label}</span>
            <span className="chip">{g.items.length}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {g.items.map((ind) => (
              <IndicatorCard key={ind.id} ind={ind} active={active?.id === ind.id} onClick={() => setSelected(ind.id)} />
            ))}
          </div>
        </section>
      ))}

      <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>
        SUMBER: {data?.source || 'FRED'} · DATA MAKRO DIPERBARUI HARIAN/BULANAN, DI-CACHE 1 JAM
      </div>
    </div>
  )
}
