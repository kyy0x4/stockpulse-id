const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export const api = {
  list(sector, signal, minScore, q, kind) {
    const params = new URLSearchParams({ limit: '300' })
    if (sector && sector !== 'Semua' && sector !== 'All') params.set('sector', sector)
    if (signal && signal !== 'Semua' && signal !== 'All') params.set('signal', signal)
    if (minScore) params.set('min_score', String(minScore))
    if (q) params.set('q', q)
    if (kind && kind !== 'all') params.set('kind', kind)
    return get(`/stocks?${params}`)
  },
  detail(ticker) {
    return get(`/stocks/${ticker}`)
  },
  // Indeks pasar: SPX / IXIC / DJI / BTC / ETH
  marketIndex(code = 'SPX', period = '1y') {
    return get(`/market/index?code=${encodeURIComponent(code)}&period=${encodeURIComponent(period)}`)
  },
  marketAssets() {
    return get('/market/assets')
  },
  // Kompatibilitas nama lama
  ihsg() {
    return get('/market/index?code=SPX&period=1y')
  },
  news(category = 'all', limit = 20) {
    return get(`/news?category=${encodeURIComponent(category)}&limit=${limit}`)
  },
  tickers(kind) {
    return get(`/tickers${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`)
  },
  macro() {
    return get('/macro')
  },
  macroSeries(ids = 'CPIAUCSL,UNRATE,FEDFUNDS') {
    return get(`/macro/series?ids=${encodeURIComponent(ids)}`)
  },
}
