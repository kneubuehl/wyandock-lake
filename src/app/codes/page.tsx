'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { SecurityCode } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Pencil, Eye, EyeOff, Lock, Trash2 } from 'lucide-react'

export default function CodesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [codes, setCodes] = useState<SecurityCode[]>([])
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<SecurityCode | null>(null)
  const [form, setForm] = useState({ label: '', code: '', notes: '' })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => { fetchCodes() }, [])

  async function fetchCodes() {
    const { data } = await supabase.from('security_codes').select('*').order('label')
    if (data) setCodes(data)
  }

  async function saveCode() {
    if (!form.label.trim() || !form.code.trim()) return
    if (editingCode) {
      const { error } = await supabase.from('security_codes')
        .update({ label: form.label, code: form.code, notes: form.notes || null, updated_by: user!.id })
        .eq('id', editingCode.id)
      if (error) { toast.error(error.message); return }
      toast.success('Code updated!')
    } else {
      const { error } = await supabase.from('security_codes').insert({
        label: form.label, code: form.code, notes: form.notes || null, updated_by: user!.id,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Code added!')
    }
    setDialogOpen(false)
    setEditingCode(null)
    setForm({ label: '', code: '', notes: '' })
    fetchCodes()
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this code?')) return
    await supabase.from('security_codes').delete().eq('id', id)
    toast.success('Code deleted')
    fetchCodes()
  }

  function startEdit(code: SecurityCode) {
    setEditingCode(code)
    setForm({ label: code.label, code: code.code, notes: code.notes || '' })
    setDialogOpen(true)
  }

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B4332]">Security Codes</h1>
          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingCode(null); setForm({ label: '', code: '', notes: '' }) } }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F]">
                <Plus className="w-4 h-4 mr-2" /> Add Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCode ? 'Edit Code' : 'New Code'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Label</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Front door keypad" className="mt-1" /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. 1234" className="mt-1" /></div>
                <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" /></div>
                <Button onClick={saveCode} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">
                  {editingCode ? 'Update Code' : 'Save Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {codes.map(code => (
            <Card key={code.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#D4A574]" />
                      <h3 className="font-medium">{code.label}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-lg font-bold tracking-wider">
                        {showCodes[code.id] ? code.code : '••••'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setShowCodes(s => ({ ...s, [code.id]: !s[code.id] }))}>
                        {showCodes[code.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                    {code.notes && <p className="text-xs text-muted-foreground mt-1">{code.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(code)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCode(code.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {codes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No codes yet</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
