'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse hash fragment manually
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          // Explicitly set the session from hash tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('setSession error:', error)
            setStatus('Login failed: ' + error.message)
            setTimeout(() => router.replace('/login?error=' + encodeURIComponent(error.message)), 2000)
            return
          }

          // Clear the hash from the URL
          window.history.replaceState(null, '', '/auth/callback')

          // Redirect home
          router.replace('/')
          return
        }

        // Check query params (PKCE flow fallback)
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            router.replace('/')
            return
          }
          console.error('Code exchange error:', error)
        }

        // Check if already authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace('/')
          return
        }

        // Nothing worked
        setStatus('Link expired or invalid. Please request a new one.')
        setTimeout(() => router.replace('/login?error=' + encodeURIComponent('Link expired. Please request a new magic link.')), 2000)
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('Something went wrong. Redirecting...')
        setTimeout(() => router.replace('/login'), 2000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg mx-auto mb-4">
          <img src="/lake-hero.jpg" alt="Lake Wyandock" className="object-cover w-full h-full" />
        </div>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
