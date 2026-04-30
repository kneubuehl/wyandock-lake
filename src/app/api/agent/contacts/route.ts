import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function serialize(c: {
  id: string
  name: string
  phone: string
  category: string
  notes: string | null
  created_at: string
  updated_at: string
}) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    category: c.category,
    notes: c.notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const category = request.nextUrl.searchParams.get('category')
  const q = request.nextUrl.searchParams.get('q')

  let query = supabaseAdmin
    .from('vendor_contacts')
    .select('*')
    .order('category')
    .order('name')

  if (category) query = query.eq('category', category)
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,notes.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contacts: data.map(serialize) })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { name, phone, category, notes } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'name and phone are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('vendor_contacts')
    .insert({
      name,
      phone,
      category: category || 'General',
      notes: notes || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contact: serialize(data) })
}

export async function PATCH(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, name, phone, category, notes } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (phone !== undefined) updates.phone = phone
  if (category !== undefined) updates.category = category
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabaseAdmin
    .from('vendor_contacts')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contact: serialize(data) })
}

export async function DELETE(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('vendor_contacts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
