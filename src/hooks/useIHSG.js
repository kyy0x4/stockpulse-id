import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useIHSG() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.ihsg()
      setData(res)
    } catch (err) {
      console.warn('Gagal mengambil IHSG:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ihsg: data, loading, reload: load }
}
