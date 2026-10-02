import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const GUEST_STARTED_KEY = 'bathroom-ranker-guest-started'
const GUEST_TIMEOUT_MS = 30 * 60 * 1000

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isMember: boolean
  guestExpired: boolean
  guestRemainingMs: number
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
  configured: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function ensureGuestClock() {
  const existing = localStorage.getItem(GUEST_STARTED_KEY)
  if (!existing) {
    localStorage.setItem(GUEST_STARTED_KEY, String(Date.now()))
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestRemainingMs, setGuestRemainingMs] = useState(GUEST_TIMEOUT_MS)

  useEffect(() => {
    ensureGuestClock()

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
      if (nextSession?.user) {
        localStorage.removeItem(GUEST_STARTED_KEY)
      } else {
        ensureGuestClock()
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      setGuestRemainingMs(GUEST_TIMEOUT_MS)
      return
    }

    const tick = () => {
      const started = Number(localStorage.getItem(GUEST_STARTED_KEY) || Date.now())
      const remaining = Math.max(0, GUEST_TIMEOUT_MS - (Date.now() - started))
      setGuestRemainingMs(remaining)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [user])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return 'Supabase is not configured. Add your keys to .env.'
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    return error?.message ?? null
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return 'Supabase is not configured. Add your keys to .env.'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
    localStorage.setItem(GUEST_STARTED_KEY, String(Date.now()))
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return 'Supabase is not configured. Add your keys to .env.'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return error?.message ?? null
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isMember: Boolean(user),
      guestExpired: !user && guestRemainingMs <= 0,
      guestRemainingMs,
      signUp,
      signIn,
      signOut,
      resetPassword,
      configured: isSupabaseConfigured,
    }),
    [user, session, loading, guestRemainingMs, signUp, signIn, signOut, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
