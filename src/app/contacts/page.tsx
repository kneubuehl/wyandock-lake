'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { VendorContact } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Search, Phone as PhoneIcon, Pencil, Trash2 } from 'lucide-react'

const CATEGORIES = ['All', 'HVAC', 'Plumbing', 'Hot Tub', 'Lawn Care', 'Cleaning', 'Property Manager', 'General']

export default function ContactsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [contacts, setContacts] = useState<VendorContact[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VendorContact | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', category: 'General', notes: '' })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => { fetchContacts() }, [])

  async function fetchContacts() {
    const { data } = await supabase.from('vendor_contacts').select('*').order('name')
    if (data) setContacts(data)
  }

  async function saveContact() {
    if (!form.name.trim() || !form.phone.trim()) return
    if (editing) {
      const { error } = await supabase.from('vendor_contacts')
        .update({ name: form.name, phone: form.phone, category: form.category, notes: form.notes || null, updated_by: user!.id })
        .eq('id', editing.id)
      if (error) { toast.error(error.message); return }
      toast.success('Contact updated!')
    } else {
      const { error } = await supabase.from('vendor_contacts').insert({
        name: form.name, phone: form.phone, category: form.category,
        notes: form.notes || null, created_by: user!.id, updated_by: user!.id,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Contact added!')
    }
    setDialogOpen(false)
    setEditing(null)
    setForm({ name: '', phone: '', category: 'General', notes: '' })
    fetchContacts()
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    await supabase.from('vendor_contacts').delete().eq('id', id)
    toast.success('Contact deleted')
    fetchContacts()
  }

  function startEdit(c: VendorContact) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone, category: c.category, notes: c.notes || '' })
    setDialogOpen(true)
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || c.category === category
    return matchSearch && matchCat
  })

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B4332]">Vendor Contacts</h1>
          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditing(null); setForm({ name: '', phone: '', category: 'General', notes: '' }) } }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" /></div>
                <Button onClick={saveContact} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]">{editing ? 'Update' : 'Save'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm"
                onClick={() => setCategory(cat)} className={category === cat ? 'bg-[#1B4332]' : ''}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(contact => (
            <Card key={contact.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <a href={`tel:${contact.phone}`} className="text-sm text-[#2D6A4F] font-medium flex items-center gap-1 mt-1">
                      <PhoneIcon className="w-3 h-3" /> {contact.phone}
                    </a>
                    <Badge variant="secondary" className="mt-2 text-xs">{contact.category}</Badge>
                    {contact.notes && <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(contact)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteContact(contact.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <PhoneIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No contacts found</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
