'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { getParentForDate, getParentColor, getParentBgColor, ParentName } from '@/lib/schedule'
import { Reservation, Profile } from '@/lib/types'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, isWithinInterval, parseISO, addDays
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const defaultEnd = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const [form, setForm] = useState({ start_date: todayStr, end_date: defaultEnd, notes: '', user_id: '' })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  // Spouse → primary member mapping for reservations
  const SPOUSE_TO_PRIMARY: Record<string, string> = {
    'Shannon': 'Tyler',
  }

  useEffect(() => {
    if (!user) return
    // Set default user_id when user loads
    setForm(f => ({ ...f, user_id: f.user_id || user.id }))
    // Fetch all profiles for the "For" selector
    supabase.from('profiles').select('*').order('display_name').then(({ data }) => {
      if (data) {
        setProfiles(data)
        // If current user is a spouse, default reservation to primary member
        const currentProfile = data.find(p => p.id === user.id)
        if (currentProfile && SPOUSE_TO_PRIMARY[currentProfile.display_name]) {
          const primary = data.find(p => p.display_name === SPOUSE_TO_PRIMARY[currentProfile.display_name])
          if (primary) setForm(f => ({ ...f, user_id: primary.id }))
        }
      }
    })
  }, [user])

  useEffect(() => {
    fetchReservations()
  }, [currentMonth])

  async function fetchReservations() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('reservations')
      .select('*, profiles:user_id(display_name)')
      .gte('end_date', start)
      .lte('start_date', end)
      .order('start_date')
    if (data) setReservations(data as unknown as Reservation[])
  }

  function handleStartDateChange(newStart: string) {
    const endDate = format(addDays(new Date(newStart), 3), 'yyyy-MM-dd')
    setForm(f => ({ ...f, start_date: newStart, end_date: endDate }))
  }

  async function createReservation() {
    if (!form.start_date || !form.end_date || !form.user_id) return
    const { error } = await supabase.from('reservations').insert({
      user_id: form.user_id,
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Reservation added!')
    setDialogOpen(false)
    setForm({ start_date: todayStr, end_date: defaultEnd, notes: '', user_id: user!.id })
    fetchReservations()
  }

  async function deleteReservation(id: string) {
    await supabase.from('reservations').delete().eq('id', id)
    toast.success('Reservation removed')
    fetchReservations()
  }

  // Touch swipe for mobile month navigation
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) {
      if (diff < 0) setCurrentMonth(m => addMonths(m, 1))
      else setCurrentMonth(m => subMonths(m, 1))
    }
    touchStartX.current = null
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function getReservationsForDay(day: Date) {
    return reservations.filter(r =>
      isWithinInterval(day, { start: parseISO(r.start_date), end: parseISO(r.end_date) })
    )
  }

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Calendar</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (open) {
              const t = format(new Date(), 'yyyy-MM-dd')
              const e = format(addDays(new Date(), 3), 'yyyy-MM-dd')
              setForm({ start_date: t, end_date: e, notes: '', user_id: user!.id })
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A5F] hover:bg-[#2a4f7a]">
                <Plus className="w-4 h-4 mr-2" /> Add Reservation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Reservation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>For</Label>
                  <Select value={form.user_id} onValueChange={(val) => setForm(f => ({ ...f, user_id: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Arrive</Label>
                    <Input type="date" value={form.start_date} onChange={e => handleStartDateChange(e.target.value)} />
                  </div>
                  <div>
                    <Label>Depart</Label>
                    <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Bringing the kids" />
                </div>
                <Button onClick={createReservation} className="w-full bg-[#1E3A5F] hover:bg-[#2a4f7a]">
                  Save Reservation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-200 border border-rose-300" />
            <span>Cheryl&apos;s Week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
            <span>Stephen Sr.&apos;s Week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#C8A97E]" />
            <span>Reservation</span>
          </div>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {days.map(day => {
                const parent = getParentForDate(day)
                const dayReservations = getReservationsForDay(day)
                const inMonth = isSameMonth(day, currentMonth)
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[60px] md:min-h-[80px] p-1 border border-border/50 ${
                      !inMonth ? 'opacity-30' : ''
                    }`}
                    style={parent && inMonth ? { backgroundColor: getParentBgColor(parent) } : {}}
                  >
                    <div className={`text-xs font-medium mb-0.5 ${
                      isToday(day) ? 'bg-[#1E3A5F] text-white w-6 h-6 rounded-full flex items-center justify-center' : ''
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {dayReservations.map(r => (
                      <div key={r.id} className="text-[10px] bg-[#C8A97E] text-white rounded px-1 truncate mb-0.5 cursor-pointer" title={(r as any).profiles?.display_name}>
                        {(r as any).profiles?.display_name?.split(' ')[0] || 'Guest'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        {reservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservations This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{(r as any).profiles?.display_name || 'Guest'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(r.start_date), 'MMM d')} – {format(parseISO(r.end_date), 'MMM d')}
                        {r.notes && ` • ${r.notes}`}
                      </p>
                    </div>
                    {r.user_id === user?.id && (
                      <Button variant="ghost" size="sm" onClick={() => deleteReservation(r.id)} className="text-destructive">
                        Remove
                      </Button>
                    )}
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
