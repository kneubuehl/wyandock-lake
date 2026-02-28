'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { HandoffNote } from '@/lib/types'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, CheckCircle2, ClipboardList } from 'lucide-react'

export default function NotesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<HandoffNote[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => { fetchNotes() }, [])

  async function fetchNotes() {
    const { data } = await supabase
      .from('handoff_notes')
      .select('*, profiles:author_id(display_name)')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    if (data) setNotes(data as unknown as HandoffNote[])
  }

  async function createNote() {
    if (!newContent.trim()) return
    const { error } = await supabase.from('handoff_notes').insert({
      content: newContent.trim(),
      author_id: user!.id,
      status: 'open',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Note added!')
    setDialogOpen(false)
    setNewContent('')
    fetchNotes()
  }

  async function resolveNote() {
    if (!resolveId) return
    const { error } = await supabase.from('handoff_notes')
      .update({
        status: 'resolved',
        resolved_by: user!.id,
        resolved_at: new Date().toISOString(),
        resolution_note: resolutionNote || null,
      })
      .eq('id', resolveId)
    if (error) { toast.error(error.message); return }
    toast.success('Note resolved!')
    setResolveId(null)
    setResolutionNote('')
    fetchNotes()
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await supabase.from('handoff_notes').delete().eq('id', id)
    toast.success('Note deleted')
    fetchNotes()
  }

  const openNotes = notes.filter(n => n.status === 'open')
  const resolvedNotes = notes.filter(n => n.status === 'resolved')

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B4332]">Handoff Notes</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F]">
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Handoff Note</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                  placeholder="e.g. Running low on dishwasher soap" rows={4} />
                <Button onClick={createNote} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resolve Dialog */}
        <Dialog open={!!resolveId} onOpenChange={open => { if (!open) setResolveId(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Resolve Note</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resolution note (optional)</Label>
                <Textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                  placeholder="e.g. Bought more soap" className="mt-1" />
              </div>
              <Button onClick={resolveNote} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">Mark as Resolved</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Open Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Open ({openNotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openNotes.length === 0 && <p className="text-sm text-muted-foreground">No open notes — all clear! 🎉</p>}
            <div className="space-y-3">
              {openNotes.map(note => (
                <div key={note.id} className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm">{note.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {(note as any).profiles?.display_name} • {format(new Date(note.created_at), 'MMM d, yyyy')}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setResolveId(note.id)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)} className="text-destructive">Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolved Notes */}
        {resolvedNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Resolved ({resolvedNotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolvedNotes.map(note => (
                  <div key={note.id} className="p-4 bg-muted/30 rounded-lg border opacity-75">
                    <p className="text-sm line-through">{note.content}</p>
                    {note.resolution_note && (
                      <p className="text-xs text-green-700 mt-1">✓ {note.resolution_note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {(note as any).profiles?.display_name} • {format(new Date(note.created_at), 'MMM d')}
                      {note.resolved_at && ` • Resolved ${format(new Date(note.resolved_at), 'MMM d')}`}
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
