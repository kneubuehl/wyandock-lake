import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirstAdminProfile } from '@/lib/profile-lookup'

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, notes } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = await getFirstAdminProfile()
  if (!admin) return NextResponse.json({ error: 'No admin profile found' }, { status: 500 })

  // Log completion
  const { error: logError } = await supabaseAdmin
    .from('maintenance_logs')
    .insert({ task_id: id, completed_by: admin.id, notes: notes || null })

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  // Mark task complete
  const { data, error } = await supabaseAdmin
    .from('maintenance_tasks')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ task: data })
}
