'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, CheckCircle2, Archive, Lightbulb, Sparkles } from 'lucide-react'

interface WishListItem {
  id: string
  title: string
  description: string | null
  author_id: string
  status: 'open' | 'resolved' | 'archived'
  resolved_by: string | null
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
  profiles?: { display_name: string }
}

export default function WishListPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<WishListItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const { data } = await supabase
      .from('wish_list')
      .select('*, profiles:author_id(display_name)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as unknown as WishListItem[])
  }

  async function createItem() {
    if (!title.trim()) { toast.error('Title is required'); return }
    const { error } = await supabase.from('wish_list').insert({
      title: title.trim(),
      description: description.trim() || null,
      author_id: user!.id,
      status: 'open',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Idea added!')
    setDialogOpen(false)
    setTitle('')
    setDescription('')
    fetchItems()
  }

  async function resolveItem() {
    if (!resolveId) return
    const { error } = await supabase.from('wish_list')
      .update({
        status: 'resolved',
        resolved_by: user!.id,
        resolved_at: new Date().toISOString(),
        resolution_note: resolutionNote || null,
      })
      .eq('id', resolveId)
    if (error) { toast.error(error.message); return }
    toast.success('Marked as done!')
    setResolveId(null)
    setResolutionNote('')
    fetchItems()
  }

  async function archiveItem(id: string) {
    const { error } = await supabase.from('wish_list')
      .update({
        status: 'archived',
        resolved_by: user!.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Archived')
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this idea?')) return
    await supabase.from('wish_list').delete().eq('id', id)
    toast.success('Deleted')
    fetchItems()
  }

  const openItems = items.filter(i => i.status === 'open')
  const resolvedItems = items.filter(i => i.status === 'resolved')
  const archivedItems = items.filter(i => i.status === 'archived')

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Wish List</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A5F] hover:bg-[#2D5F8A]">
                <Plus className="w-4 h-4 mr-2" /> Add Idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Idea</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>What&apos;s the idea?</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New outdoor speakers" className="mt-1"
                    onKeyDown={e => e.key === 'Enter' && !description && createItem()} />
                </div>
                <div>
                  <Label>Details (optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Any additional details, links, estimates..." className="mt-1" rows={3} />
                </div>
                <Button onClick={createItem} className="w-full bg-[#1E3A5F] hover:bg-[#2D5F8A]">Add to Wish List</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resolve Dialog */}
        <Dialog open={!!resolveId} onOpenChange={open => { if (!open) setResolveId(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark as Done</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                  placeholder="e.g. Purchased and installed" className="mt-1" />
              </div>
              <Button onClick={resolveItem} className="w-full bg-[#1E3A5F] hover:bg-[#2D5F8A]">Mark as Done</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filter */}
        <div className="flex gap-2 no-scrollbar overflow-x-auto">
          <Button variant={filter === 'open' ? 'default' : 'outline'} size="sm"
            onClick={() => setFilter('open')} className={`shrink-0 ${filter === 'open' ? 'bg-[#1E3A5F]' : ''}`}>
            Open ({openItems.length})
          </Button>
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm"
            onClick={() => setFilter('all')} className={`shrink-0 ${filter === 'all' ? 'bg-[#1E3A5F]' : ''}`}>
            All ({items.length})
          </Button>
        </div>

        {/* Open Ideas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Ideas ({openItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ideas yet — add one!</p>
              </div>
            )}
            <div className="space-y-3">
              {openItems.map(item => (
                <div key={item.id} className="p-4 bg-amber-50/50 rounded-lg border border-amber-100/50">
                  <h3 className="font-medium text-sm break-words">{item.title}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mt-1 break-words">{item.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.profiles?.display_name} • {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => setResolveId(item.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => archiveItem(item.id)}>
                      <Archive className="w-3 h-3 mr-1" /> Archive
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="text-destructive">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolved */}
        {filter === 'all' && resolvedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Done ({resolvedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolvedItems.map(item => (
                  <div key={item.id} className="p-3 bg-green-50/50 rounded-lg border border-green-100/50 opacity-80">
                    <p className="text-sm font-medium line-through break-words">{item.title}</p>
                    {item.resolution_note && (
                      <p className="text-xs text-green-700 mt-1">✓ {item.resolution_note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.profiles?.display_name} • {format(new Date(item.created_at), 'MMM d')}
                      {item.resolved_at && ` • Done ${format(new Date(item.resolved_at), 'MMM d')}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Archived */}
        {filter === 'all' && archivedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                <Archive className="w-4 h-4" />
                Archived ({archivedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {archivedItems.map(item => (
                  <div key={item.id} className="p-3 bg-muted/20 rounded-lg opacity-60">
                    <p className="text-sm break-words">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.profiles?.display_name} • {format(new Date(item.created_at), 'MMM d')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
