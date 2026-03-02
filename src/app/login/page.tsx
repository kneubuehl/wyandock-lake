'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendMagicLink() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send magic link')
      } else {
        setSent(true)
        toast.success('Magic link sent! Check your email.')
      }
    } catch {
      toast.error('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Cover photo side */}
      <div className="relative w-full md:w-1/2 h-56 md:h-screen">
        <Image
          src="/lake-hero.jpg"
          alt="Wyandock Lake sunset"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay with branding */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        <div className="absolute bottom-6 left-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-10 text-white">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg font-script">Lake Wyandock</h1>
          <p className="text-sm md:text-base text-white/80 mt-1 drop-shadow uppercase tracking-widest">Minocqua</p>
        </div>
      </div>

      {/* Login form side */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] px-6 py-12 md:py-0">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center md:text-left">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md mx-auto md:mx-0 mb-4">
              <Image src="/lake-hero.jpg" alt="Lake Wyandock" width={48} height={48} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E3A5F]">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your lake house dashboard</p>
          </div>

          {!sent ? (
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                className="h-11 bg-white"
              />
              <Button
                onClick={sendMagicLink}
                disabled={loading || !email}
                className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2D5F8A] text-sm font-medium"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center md:text-left">
              <div className="text-3xl">✉️</div>
              <div>
                <p className="text-sm text-muted-foreground">
                  We sent a login link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click the link in your email to sign in.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm"
              >
                Try a different email
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest pt-4">
            Kneubuehl Family • Minocqua, WI
          </p>
        </div>
      </div>
    </div>
  )
}
