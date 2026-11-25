import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { supabase } from '../api/supabase'
import { authApi, setToken, getToken } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  /**
   * Try to exchange a Supabase session token for a backend JWT.
   * Called on app init and on SIGNED_IN event.
   */
  const exchangeSupabaseSession = useCallback(async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return null

    try {
      const res = await authApi.google(token)
      // Clear the Supabase session — we use our own JWT now
      await supabase.auth.signOut().catch(() => {})
      setToken(res.token)
      setUser(res.user)
      // Clean URL if we came back from OAuth
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname)
      }
      return res.user
    } catch (err) {
      console.warn('Exchange Supabase session gagal:', err.message)
      await supabase.auth.signOut().catch(() => {})
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      // 1. Check our own token first (fast path — no Supabase call)
      const t = getToken()
      if (t) {
        try {
          const res = await authApi.me(t)
          setUser(res.user)
          setInitializing(false)
          return
        } catch (err) {
          if (err?.status === 401) setToken('')
        }
      }

      // 2. No local token → try Supabase session (covers Google OAuth PKCE callback)
      await exchangeSupabaseSession()
      setInitializing(false)
    })()

    // 3. Listen for Supabase auth state changes (PKCE callback triggers SIGNED_IN)
    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          exchangeSupabaseSession()
        }
      })
      return () => sub?.subscription.unsubscribe()
    }
  }, [exchangeSupabaseSession])

  const applySession = (res) => {
    if (res?.token && res?.user) {
      setToken(res.token)
      setUser(res.user)
      return res.user
    }
    return null
  }

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    if (res.needs_verification) return { needsVerification: true, email }
    return applySession(res)
  }

  const register = async ({ name, email, password }) => {
    const res = await authApi.register({ name, email, password })
    return res
  }

  const verify = async (email, code) => {
    const res = await authApi.verify({ email, code })
    return applySession(res)
  }

  const resend = (email) => authApi.resend({ email })

  const googleLogin = async () => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk login Google.')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw new Error(error.message)
  }

  const logout = () => {
    setToken('')
    setUser(null)
    if (supabase) supabase.auth.signOut().catch(() => {})
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token: getToken(),
        initializing,
        login,
        register,
        verify,
        resend,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
