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
    <div className="min-h-screen flex items-center justify-center bg-[#1B4332] px-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="text-6xl mb-2">🦅</div>
          <CardTitle className="text-3xl font-bold text-[#1B4332]">Up North</CardTitle>
          <CardDescription className="text-base">Kneubuehl Family Lake House</CardDescription>
          <p className="text-xs text-muted-foreground mt-1">Wyandock Lake • Minocqua, WI</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {!sent ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                className="h-12"
              />
              <Button
                onClick={sendMagicLink}
                disabled={loading || !email}
                className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-base"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">✉️</div>
              <p className="text-sm text-muted-foreground">
                We sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Click the link in your email to sign in. You can close this tab.
              </p>
              <Button
                variant="ghost"
                onClick={() => { setSent(false); setEmail('') }}
                className="w-full"
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
