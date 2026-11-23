import { useState, useCallback, useEffect } from 'react'
import { accountApi } from '../api/auth'
import { PH } from '../components/ui/DashboardComponents'
import { Plus, X } from 'lucide-react'

const fmt = (n) => {
  if (n == null) return '—'
  const v = Number(n)
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const sig = (n) => (n == null || Number(n) === 0 ? 'var(--text3)' : Number(n) > 0 ? 'var(--up)' : 'var(--down)')

export default function PortfolioPage({ stocks, onSelectStock }) {
  const [data, setData] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, t] = await Promise.all([accountApi.portfolio(), accountApi.trades()])
      setData(p)
      setTrades(t.trades || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nameOf = (t) => {
    const s = stocks.find((x) => x.ticker === t)
    return s?.name || t
  }

  const openModal = (holding) => {
    setModal({
      ticker: holding?.ticker || '',
      side: 'buy',
      qty: '',
      price: holding?.price ?? '',
      fee: 0,
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const submitTrade = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await accountApi.addTrade({
        ticker: modal.ticker,
        side: modal.side,
        qty: parseFloat(modal.qty),
        price: parseFloat(modal.price),
        fee: parseFloat(modal.fee || 0),
        trade_date: modal.date,
      })
      setModal(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const modalInput = (label, value, onChange, type = 'text') => (
    <div style={{ marginBottom: 12 }}>
      <label className="field-label">{label}</label>
      <input className="input-field" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )

  const s = data?.summary || {}
  const holdings = data?.holdings || []

  return (
    <div className="fade-up">
      <PH eyebrow="Portofolio pribadi · realtime" title="Portofolio Saya" />

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 9, border: '1px solid var(--down)', background: 'var(--down-dim)', color: 'var(--down)', fontSize: 12 }}>
          {error}
        </div>
      )}

      <div className="stat-grid">
        {[
          ['Nilai Portofolio', fmt(s.total_value), sig(s.total_pnl), 'var(--accent)'],
          ['Modal Investasi', fmt(s.total_invested), 'var(--text)', 'var(--border2)'],
          ['Unrealized P&L', fmt(s.total_pnl), sig(s.total_pnl), sig(s.total_pnl)],
          ['Return', s.total_invested ? `${((s.total_pnl / s.total_invested) * 100).toFixed(2)}%` : '—', sig(s.total_pnl), sig(s.total_pnl)],
        ].map(([label, value, color, accent]) => (
          <div key={label} className="stat-card" style={{ '--stat-accent': accent }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="cg-card-title">Posisi Terbuka</div>
          <div className="cg-card-sub">{holdings.length} aset di portofolio</div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal(null)}>
          <Plus size={15} /> Catat Transaksi
        </button>
      </div>

      <div className="table-shell" style={{ marginBottom: 24 }}>
        <div className="table-scroll" style={{ maxHeight: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="l" style={{ minWidth: 180 }}>Aset</th>
                <th>Harga</th>
                <th>Qty</th>
                <th>Avg Cost</th>
                <th>Nilai</th>
                <th>Unrealized P&amp;L</th>
                <th style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker} onClick={() => onSelectStock && onSelectStock({ ticker: h.ticker })}>
                  <td className="l">
                    <div className="cell-sym">{h.ticker}</div>
                    <div className="cell-name">{nameOf(h.ticker)}</div>
                  </td>
                  <td className="num t-strong">{fmt(h.price)}</td>
                  <td className="num t-soft">{Number(h.qty).toLocaleString('id-ID')}</td>
                  <td className="num t-soft">{fmt(h.avg_cost)}</td>
                  <td className="num t-strong">{fmt(h.value)}</td>
                  <td className="num" style={{ color: sig(h.pnl), fontWeight: 600 }}>
                    {h.pnl == null ? '—' : fmt(h.pnl)}
                    {h.pnl_pct != null && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> ({h.pnl_pct > 0 ? '+' : ''}{h.pnl_pct}%)</span>}
                  </td>
                  <td className="c" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm" onClick={() => openModal({ ...h, side: 'sell' })}>Jual</button>
                  </td>
                </tr>
              ))}
              {!loading && holdings.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 28 }}>
                    Belum ada posisi. Klik <b style={{ color: 'var(--accent)' }}>Catat Transaksi</b> untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div className="cg-card-title">Riwayat Transaksi</div>
        <div className="cg-card-sub">{trades.length} transaksi tercatat</div>
      </div>

      <div className="table-shell">
        <div className="table-scroll" style={{ maxHeight: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="l">Tanggal</th>
                <th className="l">Ticker</th>
                <th className="c">Aksi</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Fee</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id}>
                  <td className="l num t-soft">{(t.trade_date || '').slice(0, 10)}</td>
                  <td className="l"><span className="cell-sym">{t.ticker}</span></td>
                  <td className="c">
                    <span className={`tag ${t.side === 'buy' ? 'tag-green' : 'tag-red'}`}>{String(t.side).toUpperCase()}</span>
                  </td>
                  <td className="num t-soft">{Number(t.qty).toLocaleString('id-ID')}</td>
                  <td className="num t-soft">{fmt(t.price)}</td>
                  <td className="num t-soft">{fmt(t.fee)}</td>
                  <td className="num t-strong">{fmt(Number(t.qty) * Number(t.price) + (t.side === 'buy' ? Number(t.fee) : -Number(t.fee)))}</td>
                </tr>
              ))}
              {!loading && trades.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 28 }}>Belum ada transaksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 20 }}
          onClick={() => setModal(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="cg-card-sub" style={{ marginBottom: 2 }}>Catat transaksi</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{modal.ticker || 'Pilih ticker'}</div>
              </div>
              <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setModal(null)} aria-label="Tutup">
                <X size={15} />
              </button>
            </div>

            {error && <div style={{ fontSize: 12, color: 'var(--down)', marginBottom: 10 }}>{error}</div>}

            <form onSubmit={submitTrade}>
              <div className="seg" style={{ display: 'flex', marginBottom: 14, width: '100%' }}>
                {['buy', 'sell'].map((sd) => (
                  <button
                    key={sd}
                    type="button"
                    className={`seg-item ${modal.side === sd ? 'active' : ''}`}
                    onClick={() => setModal({ ...modal, side: sd })}
                    style={{
                      flex: 1,
                      height: 30,
                      color: modal.side === sd ? (sd === 'buy' ? 'var(--up)' : 'var(--down)') : 'var(--text2)',
                      fontWeight: 600,
                    }}
                  >
                    {sd === 'buy' ? 'Beli' : 'Jual'}
                  </button>
                ))}
              </div>
              {modalInput('Ticker', modal.ticker, (v) => setModal({ ...modal, ticker: v.toUpperCase() }))}
              {modalInput('Qty (unit)', modal.qty, (v) => setModal({ ...modal, qty: v }), 'number')}
              {modalInput('Harga / unit (USD)', modal.price, (v) => setModal({ ...modal, price: v }), 'number')}
              {modalInput('Fee', modal.fee, (v) => setModal({ ...modal, fee: v }), 'number')}
              {modalInput('Tanggal', modal.date, (v) => setModal({ ...modal, date: v }), 'date')}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button type="submit" className="btn btn-primary btn-block">Simpan</button>
                <button type="button" className="btn btn-block" onClick={() => setModal(null)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
