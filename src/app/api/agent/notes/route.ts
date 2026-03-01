import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { findProfileByName, getFirstAdminProfile } from '@/lib/profile-lookup'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const status = request.nextUrl.searchParams.get('status') || 'open'

  let query = supabaseAdmin
    .from('handoff_notes')
    .select('*, profiles(display_name)')
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const notes = data.map(n => ({
    id: n.id,
    content: n.content,
    author: n.profiles?.display_name,
    status: n.status,
    resolution_note: n.resolution_note,
    resolved_at: n.resolved_at,
    created_at: n.created_at,
  }))

  return NextResponse.json({ notes })
}

export async function POST(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const body = await request.json()
  const { content, author_name } = body

  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

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
    .from('handoff_notes')
    .insert({ content, author_id: authorId })
    .select('*, profiles(display_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    note: {
      id: data.id,
      content: data.content,
      author: data.profiles?.display_name,
      status: data.status,
      created_at: data.created_at,
    }
  })
}
