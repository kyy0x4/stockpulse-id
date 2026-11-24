// Cache aset logo di memory & localStorage — gambar tidak di-fetch ulang tiap render.
// Format key: `logo:${ticker}` → { url, ts, ok }
// `ok: true` = url valid, `ok: false` = url gagal, jangan dipakai lagi.

const MEMO = new Map()
const LS_KEY = 'marketiq-logo-cache'
const MAX_ENTRIES = 512
const TTL_MS = 12 * 60 * 60 * 1000 // 12 jam

function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {
    /* quota penuh — skip, masih ada memo */
  }
}

let STORE = loadStore()

export function getCachedLogoUrl(ticker) {
  if (!ticker) return null
  const key = `logo:${ticker.toUpperCase()}`

  // 1. memo (cepat)
  const m = MEMO.get(key)
  if (m && m.url && m.ok !== false) return m.url

  // 2. localStorage
  const e = STORE[key]
  if (e && e.url && e.ok !== false) {
    if (Date.now() - (e.ts || 0) < TTL_MS) return e.url
    // Kadaluarsa — buang
    delete STORE[key]
    saveStore(STORE)
    return null
  }
  return null
}

export function rememberLogo(ticker, url, ok = true) {
  if (!ticker || !url) return
  const key = `logo:${ticker.toUpperCase()}`
  MEMO.set(key, { url, ok, ts: Date.now() })
  if (MEMO.size > MAX_ENTRIES) {
    // Buang yang paling lama
    const oldest = [...MEMO.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
    if (oldest) MEMO.delete(oldest[0])
  }
  STORE[key] = { url, ok, ts: Date.now() }
  saveStore(STORE)
}

export function forgetLogo(ticker) {
  if (!ticker) return
  const key = `logo:${ticker.toUpperCase()}`
  MEMO.delete(key)
  delete STORE[key]
  saveStore(STORE)
}

export function clearLogoCache() {
  MEMO.clear()
  STORE = {}
  try { localStorage.removeItem(LS_KEY) } catch { /* noop */ }
}
