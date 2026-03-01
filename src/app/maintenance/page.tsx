'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { MaintenanceTask, MaintenanceLog } from '@/lib/types'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, CheckCircle2, Wrench } from 'lucide-react'

export default function MaintenancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [logs, setLogs] = useState<Record<string, MaintenanceLog[]>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', recurrence: 'one-time' as string,
    next_due_date: '', assigned_to: '',
  })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('next_due_date', { ascending: true })
    if (data) setTasks(data)
  }

  async function createTask() {
    if (!form.title.trim()) return
    const { error } = await supabase.from('maintenance_tasks').insert({
      title: form.title.trim(),
      description: form.description || null,
      recurrence: form.recurrence,
      next_due_date: form.next_due_date || null,
      assigned_to: form.assigned_to || null,
      status: 'pending',
      created_by: user!.id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Task created!')
    setDialogOpen(false)
    setForm({ title: '', description: '', recurrence: 'one-time', next_due_date: '', assigned_to: '' })
    fetchTasks()
  }

  async function completeTask() {
    if (!completeTaskId) return
    // Log completion
    await supabase.from('maintenance_logs').insert({
      task_id: completeTaskId,
      completed_by: user!.id,
      notes: completionNotes || null,
    })
    // Update task status
    await supabase.from('maintenance_tasks')
      .update({ status: 'completed' })
      .eq('id', completeTaskId)
    toast.success('Task completed!')
    setCompleteTaskId(null)
    setCompletionNotes('')
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('maintenance_logs').delete().eq('task_id', id)
    await supabase.from('maintenance_tasks').delete().eq('id', id)
    toast.success('Task deleted')
    fetchTasks()
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B4332]">Maintenance</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F]">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Maintenance Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Clean hot tub filters" className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Recurrence</Label>
                    <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} className="mt-1" /></div>
                </div>
                <Button onClick={createTask} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Complete Dialog */}
        <Dialog open={!!completeTaskId} onOpenChange={open => { if (!open) setCompleteTaskId(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Complete Task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Notes (optional)</Label><Textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} placeholder="Any notes about the work done" className="mt-1" /></div>
              <Button onClick={completeTask} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">Mark Complete</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending ({pendingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 && <p className="text-sm text-muted-foreground">All caught up! 🎉</p>}
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="p-4 bg-muted/30 rounded-lg border">
                  <h3 className="font-medium break-words">{task.title}</h3>
                  {task.description && <p className="text-sm text-muted-foreground mt-1 break-words">{task.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary">{task.recurrence}</Badge>
                    {task.next_due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    {task.status === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => setCompleteTaskId(task.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="text-destructive">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Completed ({completedTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="p-3 bg-muted/20 rounded-lg opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm line-through">{task.title}</span>
                      <Badge variant="secondary" className="text-xs">✓ Done</Badge>
                    </div>
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
