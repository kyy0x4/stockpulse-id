const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export const api = {
  list(sector, signal, minScore, q) {
    const params = new URLSearchParams({ limit: '100' })
    if (sector && sector !== 'Semua') params.set('sector', sector)
    if (signal && signal !== 'Semua') params.set('signal', signal)
    if (minScore) params.set('min_score', String(minScore))
    if (q) params.set('q', q)
    return get(`/stocks?${params}`)
  },
  detail(ticker) {
    return get(`/stocks/${ticker}`)
  },
  ihsg() {
    return get('/market/ihsg')
  },
  news(category = 'market', limit = 20) {
    return get(`/news?category=${category}&limit=${limit}`)
  },
  tickers() {
    return get('/tickers')
  },
}