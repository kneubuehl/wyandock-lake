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
  'nathan@jackofalltradeswisconsin.com',
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

  // Ensure the user exists in Supabase Auth before sending OTP.
  // If signups are disabled in the dashboard, signInWithOtp silently
  // won't email users that don't have an auth account yet.
  // Try to create — if they already exist, Supabase returns an error we can ignore.
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true, // mark email confirmed so OTP works immediately
  })
  if (createError && !createError.message.toLowerCase().includes('already been registered')) {
    console.error('Failed to pre-create user:', createError.message)
    return NextResponse.json({ error: 'Unable to set up account. Contact Steve E.' }, { status: 500 })
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
