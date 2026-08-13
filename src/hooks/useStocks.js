import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { adaptStock } from '../api/adapter'
import { subscribeQuotes } from '../api/supabase'
import { stocks as mockStocks } from '../data/stocks'

export function useStocks() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ sector, signal, minScore, q } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.list(sector, signal, minScore, q)
      setStocks(res.stocks.map(adaptStock))
      setUsingMock(false)
    } catch (err) {
      console.warn('Backend tidak tersedia, pakai data mock:', err.message)
      let filtered = mockStocks
      if (sector && sector !== 'Semua') filtered = filtered.filter((s) => s.sector === sector)
      if (signal && signal !== 'Semua') filtered = filtered.filter((s) => s.signal === signal)
      if (minScore) filtered = filtered.filter((s) => s.composite >= minScore)
      if (q) {
        const qq = q.toLowerCase()
        filtered = filtered.filter((s) => s.ticker.toLowerCase().includes(qq) || s.name.toLowerCase().includes(qq))
      }
      setStocks(filtered)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Realtime push: perbarui harga/change/volume saham yang sudah tampil tanpa reload.
  useEffect(() => {
    const unsub = subscribeQuotes((payload) => {
      const row = payload?.new
      if (!row?.ticker) return
      const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))
      const patch = {
        price: num(row.price),
        change: num(row.change),
        volume: num(row.volume),
      }
      setStocks((prev) =>
        prev.map((s) => (s.ticker === row.ticker ? { ...s, ...patch, realtime: true } : s)),
      )
    })
    return () => unsub?.()
  }, [])

  return { stocks, loading, usingMock, error, load }
}