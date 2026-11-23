import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

/**
 * Ambil riwayat indeks/aset pasar.
 * @param {string} code - SPX | IXIC | DJI | BTC | ETH
 */
export function useMarketIndex(code = 'SPX', period = '1y') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.marketIndex(code, period)
      setData(res)
    } catch (err) {
      console.warn(`Gagal mengambil indeks ${code}:`, err.message)
    } finally {
      setLoading(false)
    }
  }, [code, period])

  useEffect(() => {
    load()
  }, [load])

  return { index: data, ihsg: data, loading, reload: load }
}
