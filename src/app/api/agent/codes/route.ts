import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const { data, error } = await supabaseAdmin
    .from('security_codes')
    .select('id, label, code, notes, updated_at')
    .order('label')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ codes: data })
}
