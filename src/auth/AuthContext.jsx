import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { supabase } from '../api/supabase'
import { authApi, setToken, getToken } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  const hydrateFromGoogle = useCallback(async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return null
    try {
      const res = await authApi.google(token)
      await supabase.auth.signOut()
      setToken(res.token)
      setUser(res.user)
      return res.user
    } catch (err) {
      console.warn('Google login gagal:', err.message)
      await supabase.auth.signOut().catch(() => {})
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const t = getToken()
      if (t) {
        try {
          const res = await authApi.me(t)
          setUser(res.user)
        } catch (err) {
          if (err?.status === 401) setToken('')
        }
      }
      if (!getToken()) {
        await hydrateFromGoogle()
      }
      setInitializing(false)
    })()

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' && !getToken()) {
          hydrateFromGoogle()
        }
      })
      return () => sub?.subscription.unsubscribe()
    }
  }, [hydrateFromGoogle])

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
        redirectTo: `${window.location.origin}/?google=1`,
        queryParams: { prompt: 'select_account' }
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
