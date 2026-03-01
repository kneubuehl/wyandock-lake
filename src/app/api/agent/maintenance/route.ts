import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const status = request.nextUrl.searchParams.get('status') || 'pending'

  let query = supabaseAdmin
    .from('maintenance_tasks')
    .select('*, profiles:created_by(display_name)')
    .order('next_due_date', { ascending: true })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tasks = data.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    recurrence: t.recurrence,
    next_due_date: t.next_due_date,
    assigned_to: t.profiles?.display_name,
    status: t.status,
    created_at: t.created_at,
  }))

  return NextResponse.json({ tasks })
}
