import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function serialize(p: {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  profiles?: { display_name: string } | null
}) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    created_by: p.profiles?.display_name,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const category = request.nextUrl.searchParams.get('category')
  const q = request.nextUrl.searchParams.get('q')

  let query = supabaseAdmin
    .from('procedures')
    .select('*, profiles:created_by(display_name)')
    .order('category')
    .order('title')

  if (category) query = query.eq('category', category)
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ procedures: data.map(serialize) })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { title, content, category } = body

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('procedures')
    .insert({
      title,
      content: content || '',
      category: category || 'General',
    })
    .select('*, profiles:created_by(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ procedure: serialize(data) })
}

export async function PATCH(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, title, content, category } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (category !== undefined) updates.category = category

  const { data, error } = await supabaseAdmin
    .from('procedures')
    .update(updates)
    .eq('id', id)
    .select('*, profiles:created_by(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ procedure: serialize(data) })
}

export async function DELETE(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('procedures')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
