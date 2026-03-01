'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Profile } from './types'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Max 1 second loading
    const timeout = setTimeout(() => setLoading(false), 1000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
      clearTimeout(timeout)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }

      // On sign in, refresh the page to pick up server-side session
      if (event === 'SIGNED_IN') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [fetchProfile, router])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
