'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichEditor } from '@/components/rich-editor'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['HVAC', 'Boat', 'Hot Tub', 'General', 'Opening', 'Closing']

export default function NewProcedurePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  async function save() {
    if (!title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const { data, error } = await supabase.from('procedures').insert({
      title: title.trim(),
      content,
      category,
      created_by: user!.id,
      updated_by: user!.id,
    }).select().single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Procedure created!')
    router.push(`/procedures/${data.id}`)
  }

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/procedures">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#1B4332]">New Procedure</h1>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water On/Off" className="mt-1" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content</Label>
            <div className="mt-1">
              <RichEditor content={content} onChange={setContent} placeholder="Write the procedure steps..." />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="bg-[#1B4332] hover:bg-[#2D6A4F]">
            {saving ? 'Saving...' : 'Create Procedure'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
