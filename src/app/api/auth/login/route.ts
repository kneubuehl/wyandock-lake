import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Only these emails can request magic links
const ALLOWED_EMAILS = [
  'kneubuehl@live.com',
  'cherylk50@msn.com',
  's.kneubuehl@aol.com',
  'zachkneubuehl@gmail.com',
  'tylerk83@gmail.com',
  'shannong713@gmail.com',
]

export async function POST(request: NextRequest) {
  const { email, redirectTo } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
    return NextResponse.json(
      { error: 'This email is not authorized. Contact Steve E. to be added.' },
      { status: 403 }
    )
  }

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo || undefined,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
