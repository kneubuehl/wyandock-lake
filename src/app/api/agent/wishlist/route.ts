import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { findProfileByName, getFirstAdminProfile } from '@/lib/profile-lookup'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const status = request.nextUrl.searchParams.get('status') || 'open'

  let query = supabaseAdmin
    .from('wish_list')
    .select('*, profiles:author_id(display_name)')
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = data.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description,
    author: w.profiles?.display_name,
    status: w.status,
    created_at: w.created_at,
  }))

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { title, description, author_name } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  let authorId: string
  if (author_name) {
    const { profile, error: lookupError } = await findProfileByName(author_name)
    if (!profile) return NextResponse.json({ error: lookupError }, { status: 400 })
    authorId = profile.id
  } else {
    const admin = await getFirstAdminProfile()
    if (!admin) return NextResponse.json({ error: 'No admin profile found' }, { status: 500 })
    authorId = admin.id
  }

  const { data, error } = await supabaseAdmin
    .from('wish_list')
    .insert({ title, description: description || null, author_id: authorId })
    .select('*, profiles:author_id(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    item: {
      id: data.id,
      title: data.title,
      description: data.description,
      author: data.profiles?.display_name,
      status: data.status,
      created_at: data.created_at,
    }
  })
}

export async function PATCH(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { id, title, description, status } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (status !== undefined) updates.status = status

  const { data, error } = await supabaseAdmin
    .from('wish_list')
    .update(updates)
    .eq('id', id)
    .select('*, profiles:author_id(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    item: {
      id: data.id,
      title: data.title,
      description: data.description,
      author: data.profiles?.display_name,
      status: data.status,
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
    .from('wish_list')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
