import { useState, useCallback, useEffect } from 'react'
import { accountApi } from '../api/auth'
import { PH } from '../components/ui/DashboardComponents'

const fmt = (n) => (n == null ? '—' : `Rp${Number(n).toLocaleString('id-ID')}`)
const sig = (n) => (n == null || Number(n) === 0 ? 'var(--text3)' : Number(n) > 0 ? 'var(--up)' : 'var(--down)')

const cell = { padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }
const th = {
  ...cell,
  fontSize: 9,
  letterSpacing: '0.12em',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  background: 'var(--bg3)',
  whiteSpace: 'nowrap',
}

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
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>
        {label}
      </label>
      <input
        style={{ width: '100%', padding: '9px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-mono)' }}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

  const s = data?.summary || {}

  return (
    <div className="fade-up" style={{ padding: '20px 16px 28px' }}>
      <PH eyebrow="PORTOFOLIO PRIBADI · REALTIME" title="PORTOFOLIO SAYA" />

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', border: '1px solid var(--down)', borderLeft: '3px solid var(--down)', color: 'var(--down)', fontSize: 12 }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4" style={{ marginBottom: 24 }}>
        {[
          ['NILAI PORTOFOLIO', fmt(s.total_value), sig(s.total_pnl)],
          ['MODAL INVESTASI', fmt(s.total_invested), 'var(--text3)'],
          ['UNREALIZED P&L', fmt(s.total_pnl), sig(s.total_pnl)],
          ['RETURN', s.total_invested ? `${((s.total_pnl / s.total_invested) * 100).toFixed(2)}%` : '—', sig(s.total_pnl)],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--bg2)', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 8 }}>{l}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)' }}>POSISI TERBUKA · {data?.holdings?.length ?? 0} SAHAM</div>
        <button
          onClick={() => openModal(null)}
          style={{ padding: '8px 14px', background: 'var(--up)', color: '#080809', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase' }}
        >
          + Catat Transaksi
        </button>
      </div>

      <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', marginBottom: 28, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <thead>
            <tr>
              {['Ticker', 'Harga', 'Qty', 'Avg Cost', 'Nilai', 'Unrealized P&L', ''].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.holdings || []).map((h) => (
              <tr key={h.ticker} className="trow" style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onSelectStock && onSelectStock({ ticker: h.ticker })}>
                <td style={{ ...cell, fontWeight: 700, color: 'var(--text)' }}>{h.ticker}<div style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 10 }}>{nameOf(h.ticker)}</div></td>
                <td style={cell}>{fmt(h.price)}</td>
                <td style={cell}>{Number(h.qty).toLocaleString('id-ID')}</td>
                <td style={cell}>{fmt(h.avg_cost)}</td>
                <td style={cell}>{fmt(h.value)}</td>
                <td style={{ ...cell, color: sig(h.pnl) }}>
                  {h.pnl == null ? '—' : fmt(h.pnl)}
                  {h.pnl_pct != null && <span style={{ color: 'var(--text3)' }}> ({h.pnl_pct > 0 ? '+' : ''}{h.pnl_pct}%)</span>}
                </td>
                <td style={cell} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openModal({ ...h, side: 'sell' })} className="chip" style={{ cursor: 'pointer' }}>Jual</button>
                </td>
              </tr>
            ))}
            {!loading && (data?.holdings || []).length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text3)', padding: 28 }}>
                  Belum ada posisi. Klik <b style={{ color: 'var(--accent)' }}>+ Catat Transaksi</b> untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10 }}>RIWAYAT TRANSAKSI</div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 620 }}>
          <thead>
            <tr>
              {['Tanggal', 'Ticker', 'Aksi', 'Qty', 'Harga', 'Fee', 'Total'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="trow" style={{ borderTop: '1px solid var(--border)' }}>
                <td style={cell}>{(t.trade_date || '').slice(0, 10)}</td>
                <td style={{ ...cell, fontWeight: 700, color: 'var(--text)' }}>{t.ticker}</td>
                <td style={{ ...cell, color: t.side === 'buy' ? 'var(--up)' : 'var(--down)', fontWeight: 700, textTransform: 'uppercase' }}>{t.side}</td>
                <td style={cell}>{Number(t.qty).toLocaleString('id-ID')}</td>
                <td style={cell}>{fmt(t.price)}</td>
                <td style={cell}>{fmt(t.fee)}</td>
                <td style={cell}>{fmt(Number(t.qty) * Number(t.price) + (t.side === 'buy' ? Number(t.fee) : -Number(t.fee)))}</td>
              </tr>
            ))}
            {!loading && trades.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text3)', padding: 28 }}>Belum ada transaksi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', background: 'var(--bg2)', padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 16, textTransform: 'uppercase' }}>
              Catat Transaksi · {modal.ticker || 'Pilih Ticker'}
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--down)', marginBottom: 10 }}>{error}</div>}
            <form onSubmit={submitTrade}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['buy', 'sell'].map((sd) => (
                  <button
                    key={sd}
                    type="button"
                    onClick={() => setModal({ ...modal, side: sd })}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      border: '1px solid var(--border)',
                      background: modal.side === sd ? (sd === 'buy' ? 'var(--up)' : 'var(--down)') : 'var(--bg3)',
                      color: modal.side === sd ? '#080809' : 'var(--text3)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {sd === 'buy' ? 'Beli' : 'Jual'}
                  </button>
                ))}
              </div>
              {modalInput('Ticker', modal.ticker, (v) => setModal({ ...modal, ticker: v.toUpperCase() }))}
              {modalInput('Qty (lembar)', modal.qty, (v) => setModal({ ...modal, qty: v }), 'number')}
              {modalInput('Harga / lembar', modal.price, (v) => setModal({ ...modal, price: v }), 'number')}
              {modalInput('Fee', modal.fee, (v) => setModal({ ...modal, fee: v }), 'number')}
              {modalInput('Tanggal', modal.date, (v) => setModal({ ...modal, date: v }), 'date')}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button type="submit" style={{ flex: 1, padding: '10px 0', background: 'var(--up)', color: '#080809', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer' }}>
                  Simpan
                </button>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '10px 0', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer' }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
