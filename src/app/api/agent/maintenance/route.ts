import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { findProfileByName } from '@/lib/profile-lookup'

type TaskRow = {
  id: string
  title: string
  description: string | null
  recurrence: string
  next_due_date: string | null
  status: string
  created_at: string
  profiles?: { display_name: string } | null
}

function serialize(t: TaskRow) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    recurrence: t.recurrence,
    next_due_date: t.next_due_date,
    assigned_to: t.profiles?.display_name,
    status: t.status,
    created_at: t.created_at,
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const status = request.nextUrl.searchParams.get('status') || 'pending'

  let query = supabaseAdmin
    .from('maintenance_tasks')
    .select('*, profiles:assigned_to(display_name)')
    .order('next_due_date', { ascending: true })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks: data.map(serialize) })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { title, description, recurrence, next_due_date, assigned_to } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const allowedRecurrences = ['one-time', 'monthly', 'quarterly', 'annual', 'custom']
  const rec = recurrence || 'one-time'
  if (!allowedRecurrences.includes(rec)) {
    return NextResponse.json({ error: `recurrence must be one of: ${allowedRecurrences.join(', ')}` }, { status: 400 })
  }

  let assignedId: string | null = null
  if (assigned_to) {
    const { profile, error: lookupError } = await findProfileByName(assigned_to)
    if (!profile) return NextResponse.json({ error: lookupError }, { status: 400 })
    assignedId = profile.id
  }

  const { data, error } = await supabaseAdmin
    .from('maintenance_tasks')
    .insert({
      title,
      description: description || null,
      recurrence: rec,
      next_due_date: next_due_date || null,
      assigned_to: assignedId,
    })
    .select('*, profiles:assigned_to(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ task: serialize(data) })
}

export async function PATCH(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, title, description, recurrence, next_due_date, assigned_to, status } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (recurrence !== undefined) updates.recurrence = recurrence
  if (next_due_date !== undefined) updates.next_due_date = next_due_date
  if (status !== undefined) updates.status = status
  if (assigned_to !== undefined) {
    if (assigned_to === null || assigned_to === '') {
      updates.assigned_to = null
    } else {
      const { profile, error: lookupError } = await findProfileByName(assigned_to)
      if (!profile) return NextResponse.json({ error: lookupError }, { status: 400 })
      updates.assigned_to = profile.id
    }
  }

  const { data, error } = await supabaseAdmin
    .from('maintenance_tasks')
    .update(updates)
    .eq('id', id)
    .select('*, profiles:assigned_to(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ task: serialize(data) })
}

export async function DELETE(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('maintenance_tasks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
