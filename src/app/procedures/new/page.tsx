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
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const DEFAULT_CATEGORIES = ['HVAC', 'Boat', 'Hot Tub', 'General', 'Opening', 'Closing']

export default function NewProcedurePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    // Load existing categories from procedures
    supabase.from('procedures').select('category').then(({ data }) => {
      if (data) {
        const dbCats = [...new Set(data.map(p => p.category))]
        setCategories([...new Set([...DEFAULT_CATEGORIES, ...dbCats])])
      }
    })
  }, [])

  function addCategory() {
    const name = newCatName.trim()
    if (!name) return
    if (!categories.includes(name)) {
      setCategories(prev => [...prev, name])
    }
    setCategory(name)
    setNewCatName('')
    setNewCatOpen(false)
  }

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
            <div className="flex gap-2 mt-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setNewCatOpen(true)} title="Add new category">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" onKeyDown={e => e.key === 'Enter' && addCategory()} />
                  <Button onClick={addCategory} className="w-full bg-[#1E3A5F] hover:bg-[#2D5F8A]">Add Category</Button>
                </div>
              </DialogContent>
            </Dialog>
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
