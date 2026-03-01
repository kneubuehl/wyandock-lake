'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichEditor } from '@/components/rich-editor'
import { supabase } from '@/lib/supabase'
import { Procedure } from '@/lib/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

const DEFAULT_CATEGORIES = ['HVAC', 'Boat', 'Hot Tub', 'General', 'Opening', 'Closing']

export default function ProcedureDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    supabase
      .from('procedures')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProcedure(data)
          setTitle(data.title)
          setContent(data.content)
          setCategory(data.category)
        }
      })
    // Load existing categories
    supabase.from('procedures').select('category').then(({ data }) => {
      if (data) {
        const dbCats = [...new Set(data.map(p => p.category))]
        setCategories([...new Set([...DEFAULT_CATEGORIES, ...dbCats])])
      }
    })
  }, [params.id])

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
    setSaving(true)
    const { error } = await supabase.from('procedures')
      .update({ title, content, category, updated_by: user!.id, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Procedure updated!')
    setProcedure(p => p ? { ...p, title, content, category, updated_at: new Date().toISOString() } : p)
    setEditing(false)
  }

  async function deleteProcedure() {
    if (!confirm('Delete this procedure?')) return
    await supabase.from('procedures').delete().eq('id', params.id)
    toast.success('Procedure deleted')
    router.push('/procedures')
  }

  if (loading || !user || !procedure) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/procedures">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            {editing ? (
              <Input value={title} onChange={e => setTitle(e.target.value)} className="text-xl font-bold" />
            ) : (
              <h1 className="text-2xl font-bold text-[#1B4332]">{procedure.title}</h1>
            )}
          </div>
          <div className="flex gap-2">
            {!editing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteProcedure} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {!editing && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{procedure.category}</Badge>
            <span className="text-xs text-muted-foreground">
              Updated {format(new Date(procedure.updated_at), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
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
                <RichEditor content={content} onChange={setContent} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="bg-[#1B4332] hover:bg-[#2D6A4F]">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setTitle(procedure.title); setContent(procedure.content); setCategory(procedure.category) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border" dangerouslySetInnerHTML={{ __html: procedure.content }} />
        )}
      </div>
    </AppShell>
  )
}
