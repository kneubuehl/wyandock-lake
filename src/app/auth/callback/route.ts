import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/`)
  }

  // Handle token hash flow (magic link)
  if (token_hash && type) {
    // Redirect to home with hash params so client can pick it up
    return NextResponse.redirect(`${origin}/#access_token=${token_hash}&type=${type}`)
  }

  // Fallback
  return NextResponse.redirect(`${origin}/login`)
}
