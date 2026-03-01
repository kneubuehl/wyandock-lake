'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendMagicLink() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success('Magic link sent! Check your email.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lake-gradient px-4">
      {/* Subtle water ripple effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent" />
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center pb-3">
          <div className="text-5xl mb-1">🦅</div>
          <CardTitle className="text-2xl font-semibold text-[#1E3A5F] tracking-tight">Up North</CardTitle>
          <CardDescription className="text-sm">Kneubuehl Family Lake House</CardDescription>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Wyandock Lake • Minocqua</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {!sent ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                className="h-11"
              />
              <Button
                onClick={sendMagicLink}
                disabled={loading || !email}
                className="w-full h-11 bg-[#1E3A5F] hover:bg-[#2D5F8A] text-sm font-medium"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-3 py-3">
              <div className="text-3xl">✉️</div>
              <p className="text-sm text-muted-foreground">
                We sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Click the link in your email to sign in.
              </p>
              <Button
                variant="ghost"
                onClick={() => { setSent(false); setEmail('') }}
                className="w-full text-sm"
              >
                Try a different email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
