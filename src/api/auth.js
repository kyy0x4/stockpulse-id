const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')

export const TOKEN_KEY = 'pf_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const t = token || getToken()
  if (t) headers.Authorization = `Bearer ${t}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error(`Tidak bisa terhubung ke backend (${API_BASE}). Pastikan API lokal sudah jalan.`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.detail || `API ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const authApi = {
  register: (payload) => req('/auth/register', { method: 'POST', body: payload }),
  verify: (payload) => req('/auth/verify', { method: 'POST', body: payload }),
  resend: (payload) => req('/auth/resend', { method: 'POST', body: payload }),
  login: (payload) => req('/auth/login', { method: 'POST', body: payload }),
  google: (access_token) => req('/auth/google', { method: 'POST', body: { provider: 'google', access_token } }),
  me: (token) => req('/auth/me', { token }),
}

export const accountApi = {
  watchlist: () => req('/watchlist'),
  addWatch: (ticker) => req('/watchlist', { method: 'POST', body: { ticker } }),
  removeWatch: (ticker) => req(`/watchlist/${ticker}`, { method: 'DELETE' }),
  portfolio: () => req('/portfolio'),
  trades: () => req('/portfolio/trades'),
  addTrade: (payload) => req('/portfolio/trades', { method: 'POST', body: payload }),
  // Alerts
  alerts: () => req('/alerts'),
  addAlert: (payload) => req('/alerts', { method: 'POST', body: payload }),
  removeAlert: (id) => req(`/alerts/${id}`, { method: 'DELETE' }),
  dismissAlert: (id) => req(`/alerts/${id}/dismiss`, { method: 'POST' }),
  // Plan
  upgradePlan: (plan) => req('/account/plan', { method: 'POST', body: { plan } }),
}