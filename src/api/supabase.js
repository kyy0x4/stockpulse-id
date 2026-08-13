import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = URL && ANON_KEY ? createClient(URL, ANON_KEY) : null

/**
 * Subscribe ke perubahan harga realtime dari tabel stock_quotes.
 * callback(payload) dipanggil saat row di-insert/update dari backend polling.
 * Mengembalikan fungsi unsubscribe; kembalikan null jika Supabase tak dikonfig.
 */
export function subscribeQuotes(callback) {
  if (!supabase) return null
  const channel = supabase
    .channel('stockpulse-quotes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stock_quotes' },
      (payload) => callback(payload),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}