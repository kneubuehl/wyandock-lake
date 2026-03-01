import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirstAdminProfile } from '@/lib/profile-lookup'

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, resolution_note } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = await getFirstAdminProfile()

  const { data, error } = await supabaseAdmin
    .from('handoff_notes')
    .update({
      status: 'resolved',
      resolved_by: admin?.id || null,
      resolved_at: new Date().toISOString(),
      resolution_note: resolution_note || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ note: data })
}
