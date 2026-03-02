import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { findProfileByName, getPrimaryMemberName } from '@/lib/profile-lookup'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const params = request.nextUrl.searchParams
  const today = new Date().toISOString().split('T')[0]
  const from = params.get('from') || today
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)
  const to = params.get('to') || futureDate.toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*, profiles:user_id(display_name)')
    .gte('end_date', from)
    .lte('start_date', to)
    .order('start_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reservations = data.map(r => ({
    id: r.id,
    start_date: r.start_date,
    end_date: r.end_date,
    notes: r.notes,
    name: r.profiles?.display_name,
    created_at: r.created_at,
  }))

  return NextResponse.json({ reservations })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { name, start_date, end_date, notes } = body

  if (!name || !start_date || !end_date) {
    return NextResponse.json({ error: 'name, start_date, and end_date are required' }, { status: 400 })
  }

  // Map spouse to primary member for reservations
  const resolvedName = getPrimaryMemberName(name) || name
  
  const { profile, error: lookupError } = await findProfileByName(resolvedName)
  if (!profile) return NextResponse.json({ error: lookupError }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .insert({ user_id: profile.id, start_date, end_date, notes: notes || null })
    .select('*, profiles:user_id(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    reservation: {
      id: data.id,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes,
      name: data.profiles?.display_name,
      created_at: data.created_at,
    }
  })
}

export async function DELETE(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('reservations')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
