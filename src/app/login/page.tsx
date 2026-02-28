'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)

  async function sendOtp() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setStep('otp')
      toast.success('Check your email for the login code!')
    }
  }

  async function verifyOtp() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      window.location.href = '/'
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
          {step === 'email' ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                className="h-12"
              />
              <Button onClick={sendOtp} disabled={loading || !email} className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-base">
                {loading ? 'Sending...' : 'Send Login Code'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Enter the code sent to <strong>{email}</strong>
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                className="h-12 text-center text-2xl tracking-widest"
                maxLength={6}
              />
              <Button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-base">
                {loading ? 'Verifying...' : 'Sign In'}
              </Button>
              <Button variant="ghost" onClick={() => { setStep('email'); setOtp('') }} className="w-full">
                Use different email
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
