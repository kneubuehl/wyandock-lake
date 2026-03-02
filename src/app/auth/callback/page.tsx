'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase magic links redirect with tokens in the URL hash fragment
    // e.g. /auth/callback#access_token=...&refresh_token=...
    // The hash is only available client-side, not on the server

    // The Supabase client automatically detects the hash tokens
    // and establishes the session via onAuthStateChange
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/')
      }
    })

    // Also check if session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/')
      }
    })

    // Fallback: if nothing happens after 3 seconds, redirect to login
    const timeout = setTimeout(() => {
      router.replace('/login?error=' + encodeURIComponent('Login failed. Please try again.'))
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg mx-auto mb-4">
          <img src="/lake-hero.jpg" alt="Lake Wyandock" className="object-cover w-full h-full" />
        </div>
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
