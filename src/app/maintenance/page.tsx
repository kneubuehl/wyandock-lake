'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { MaintenanceTask, MaintenanceLog, Profile } from '@/lib/types'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, CheckCircle2, User as UserIcon } from 'lucide-react'

const UNASSIGNED = '__unassigned__'

type Filter = 'all' | 'mine' | 'caretaker'

export default function MaintenancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [, setLogs] = useState<Record<string, MaintenanceLog[]>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [form, setForm] = useState({
    title: '', description: '', recurrence: 'one-time' as string,
    next_due_date: '', assigned_to: UNASSIGNED,
  })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('maintenance_tasks')
      .select('*, profiles:assigned_to(id, display_name, role)')
      .order('next_due_date', { ascending: true })
    if (data) setTasks(data as unknown as MaintenanceTask[])
  }, [])

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name')
    if (data) setProfiles(data as Profile[])
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProfiles()
  }, [fetchTasks, fetchProfiles])

  async function createTask() {
    if (!form.title.trim()) return
    const { error } = await supabase.from('maintenance_tasks').insert({
      title: form.title.trim(),
      description: form.description || null,
      recurrence: form.recurrence,
      next_due_date: form.next_due_date || null,
      assigned_to: form.assigned_to === UNASSIGNED ? null : form.assigned_to,
      status: 'pending',
      created_by: user!.id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Task created!')
    setDialogOpen(false)
    setForm({ title: '', description: '', recurrence: 'one-time', next_due_date: '', assigned_to: UNASSIGNED })
    fetchTasks()
  }

  async function completeTask() {
    if (!completeTaskId) return
    await supabase.from('maintenance_logs').insert({
      task_id: completeTaskId,
      completed_by: user!.id,
      notes: completionNotes || null,
    })
    await supabase.from('maintenance_tasks')
      .update({ status: 'completed' })
      .eq('id', completeTaskId)
    toast.success('Task completed!')
    setCompleteTaskId(null)
    setCompletionNotes('')
    setLogs({}) // reset cache if we start using it
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('maintenance_logs').delete().eq('task_id', id)
    await supabase.from('maintenance_tasks').delete().eq('id', id)
    toast.success('Task deleted')
    fetchTasks()
  }

  async function reassignTask(taskId: string, value: string) {
    const assigned = value === UNASSIGNED ? null : value
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ assigned_to: assigned })
      .eq('id', taskId)
    if (error) { toast.error(error.message); return }
    toast.success('Reassigned')
    fetchTasks()
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks
    if (filter === 'mine') return tasks.filter(t => t.assigned_to === user?.id)
    if (filter === 'caretaker') {
      return tasks.filter(t => {
        const p = (t as MaintenanceTask & { profiles?: { role?: string } }).profiles
        return p?.role === 'caretaker'
      })
    }
    return tasks
  }, [tasks, filter, user?.id])

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed')
  const completedTasks = filteredTasks.filter(t => t.status === 'completed')

  const caretakerCount = tasks.filter(t => {
    const p = (t as MaintenanceTask & { profiles?: { role?: string } }).profiles
    return p?.role === 'caretaker' && t.status !== 'completed'
  }).length

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Maintenance</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A5F] hover:bg-[#2D5F8A]">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Maintenance Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Clean hot tub filters"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
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
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={form.next_due_date}
                      onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select
                    value={form.assigned_to}
                    onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.display_name}{p.role === 'caretaker' ? ' (caretaker)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} className="w-full bg-[#1E3A5F] hover:bg-[#2D5F8A]">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'mine', 'caretaker'] as Filter[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={filter === f ? 'bg-[#1E3A5F] hover:bg-[#2D5F8A]' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All'}
              {f === 'mine' && 'Mine'}
              {f === 'caretaker' && `Caretaker${caretakerCount ? ` (${caretakerCount})` : ''}`}
            </Button>
          ))}
        </div>

        {/* Complete Dialog */}
        <Dialog open={!!completeTaskId} onOpenChange={open => { if (!open) setCompleteTaskId(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Complete Task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Any notes about the work done"
                  className="mt-1"
                />
              </div>
              <Button onClick={completeTask} className="w-full bg-[#1E3A5F] hover:bg-[#2D5F8A]">Mark Complete</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending ({pendingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {filter === 'all' ? 'All caught up! 🎉' : 'Nothing here in this view.'}
              </p>
            )}
            <div className="space-y-3">
              {pendingTasks.map(task => {
                const assignee = (task as MaintenanceTask & { profiles?: { id: string; display_name: string; role: string } }).profiles
                const isCaretaker = assignee?.role === 'caretaker'
                return (
                  <div key={task.id} className="p-4 bg-muted/30 rounded-lg border">
                    <h3 className="font-medium break-words">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 break-words">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary">{task.recurrence}</Badge>
                      {task.next_due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {assignee && (
                        <Badge
                          variant="outline"
                          className={isCaretaker ? 'border-[#C8A97E] text-[#C8A97E]' : ''}
                        >
                          <UserIcon className="w-3 h-3 mr-1" />
                          {assignee.display_name}{isCaretaker ? ' · caretaker' : ''}
                        </Badge>
                      )}
                      {task.status === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      <Button variant="outline" size="sm" onClick={() => setCompleteTaskId(task.id)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                      </Button>
                      <Select
                        value={task.assigned_to || UNASSIGNED}
                        onValueChange={v => reassignTask(task.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[180px] text-xs">
                          <SelectValue placeholder="Assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {profiles.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.display_name}{p.role === 'caretaker' ? ' (caretaker)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="text-destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
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
