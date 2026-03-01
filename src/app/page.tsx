'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getParentForDate, getParentColor } from '@/lib/schedule'
import { HandoffNote, MaintenanceTask } from '@/lib/types'
import { format, addDays, isPast, isToday, isFuture } from 'date-fns'
import Link from 'next/link'
import {
  CalendarDays, ClipboardList, Wrench, BookOpen,
  Lock, Phone, Users, ArrowRight, CircleDot, Waves
} from 'lucide-react'

interface Reservation {
  id: string
  user_id: string
  start_date: string
  end_date: string
  notes?: string
  profiles?: { display_name: string }
}

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<HandoffNote[]>([])
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([])
  const [lastVisitor, setLastVisitor] = useState<{ name: string; end_date: string } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Fetch upcoming reservations (up to 3, starting from today)
    supabase
      .from('reservations')
      .select('*, profiles:user_id(display_name)')
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(3)
      .then(({ data }) => { if (data) setUpcomingReservations(data as unknown as Reservation[]) })

    // Fetch most recent past reservation
    supabase
      .from('reservations')
      .select('*, profiles:user_id(display_name)')
      .lt('end_date', today)
      .order('end_date', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const r = data[0] as unknown as Reservation
          setLastVisitor({
            name: r.profiles?.display_name || 'Unknown',
            end_date: r.end_date,
          })
        }
      })

    // Fetch open handoff notes
    supabase
      .from('handoff_notes')
      .select('*, profiles:author_id(display_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setNotes(data as unknown as HandoffNote[]) })

    // Fetch upcoming maintenance
    supabase
      .from('maintenance_tasks')
      .select('*')
      .in('status', ['pending', 'overdue'])
      .order('next_due_date', { ascending: true })
      .limit(5)
      .then(({ data }) => { if (data) setTasks(data) })
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg animate-pulse">
          <img src="/lake-hero.jpg" alt="Lake Wyandock" className="object-cover w-full h-full" />
        </div>
      </div>
    )
  }

  const today = new Date()
  const parentToday = getParentForDate(today)

  const quickLinks = [
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/procedures', label: 'Procedures', icon: BookOpen },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/codes', label: 'Codes', icon: Lock },
    { href: '/contacts', label: 'Contacts', icon: Phone },
    { href: '/notes', label: 'Notes', icon: ClipboardList },
  ]

  return (
    <AppShell>
      <div className="space-y-5 pb-20 md:pb-0">
        {/* Welcome */}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            Welcome back{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(today, 'EEEE, MMMM d')}</p>
        </div>

        {/* At the Lake — Consolidated Card */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Waves className="w-4 h-4" /> At the Lake
              </CardTitle>
              <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
                Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current parent week */}
            {parentToday && (
              <div className="flex items-center gap-2">
                <Badge className={`${getParentColor(parentToday)} text-sm px-3 py-1`}>
                  {parentToday}&apos;s Week
                </Badge>
              </div>
            )}

            {/* Last visitor */}
            {lastVisitor && (
              <div className="text-xs text-muted-foreground">
                Last visit: <span className="font-medium text-foreground">{lastVisitor.name}</span> — left {format(new Date(lastVisitor.end_date), 'MMM d')}
              </div>
            )}

            {/* Upcoming reservations */}
            {upcomingReservations.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming</p>
                {upcomingReservations.map(r => {
                  const start = new Date(r.start_date)
                  const end = new Date(r.end_date)
                  const isNow = !isFuture(start) && !isPast(end)
                  return (
                    <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isNow ? 'bg-blue-50 border border-blue-100' : 'bg-muted/40'}`}>
                      <div className={`w-1.5 h-8 rounded-full ${isNow ? 'bg-blue-400' : 'bg-muted-foreground/20'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.profiles?.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, 'MMM d')} – {format(end, 'MMM d')}
                          {isNow && <span className="ml-1.5 text-blue-600 font-medium">• There now</span>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming reservations</p>
            )}

            {/* Link to calendar */}
            <Link href="/calendar">
              <Button variant="outline" size="sm" className="w-full mt-1">
                <CalendarDays className="w-4 h-4 mr-2" /> View Full Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Open Notes */}
        {notes.length > 0 && (
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Open Notes
                  <Badge variant="secondary" className="text-xs ml-1">{notes.length}</Badge>
                </CardTitle>
                <Link href="/notes" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All notes <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-100/50">
                    <CircleDot className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{note.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {(note as any).profiles?.display_name} • {format(new Date(note.created_at), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <div className="card-hover flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white border border-border/50 shadow-sm cursor-pointer text-center">
                <link.icon className="w-4.5 h-4.5 text-primary/70" />
                <span className="text-xs font-medium text-foreground/80">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Maintenance */}
        {tasks.length > 0 && (
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Maintenance
                </CardTitle>
                <Link href="/maintenance" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.next_due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={task.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {task.status}
                    </Badge>
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
