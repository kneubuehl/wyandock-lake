'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getParentForDate, getParentColor } from '@/lib/schedule'
import { HandoffNote, MaintenanceTask } from '@/lib/types'
import { format, addDays } from 'date-fns'
import Link from 'next/link'
import {
  CalendarDays, CloudSun, ClipboardList, Wrench, BookOpen,
  Lock, Phone, ThermometerSun, Droplets, Wind
} from 'lucide-react'

interface WeatherData {
  temperature: number
  weathercode: number
  windspeed: number
  humidity: number
}

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [notes, setNotes] = useState<HandoffNote[]>([])
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    // Fetch weather from Open-Meteo (Minocqua, WI: 45.87, -89.71)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=45.87&longitude=-89.71&current_weather=true&temperature_unit=fahrenheit')
      .then(r => r.json())
      .then(data => {
        if (data.current_weather) {
          setWeather({
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
            windspeed: data.current_weather.windspeed,
            humidity: 0,
          })
        }
      })
      .catch(() => {})

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
  }, [])

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-4xl animate-pulse">🦅</span></div>

  const today = new Date()
  const parentToday = getParentForDate(today)
  const parentNextWeek = getParentForDate(addDays(today, 7))

  const weatherDesc = getWeatherDescription(weather?.weathercode ?? 0)

  const quickLinks = [
    { href: '/calendar', label: 'Calendar', icon: CalendarDays, color: 'bg-blue-50 text-blue-700' },
    { href: '/procedures', label: 'Procedures', icon: BookOpen, color: 'bg-green-50 text-green-700' },
    { href: '/notes', label: 'Handoff Notes', icon: ClipboardList, color: 'bg-amber-50 text-amber-700' },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench, color: 'bg-purple-50 text-purple-700' },
    { href: '/codes', label: 'Security Codes', icon: Lock, color: 'bg-red-50 text-red-700' },
    { href: '/contacts', label: 'Vendor Contacts', icon: Phone, color: 'bg-teal-50 text-teal-700' },
  ]

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">
            Welcome{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''} 🦅
          </h1>
          <p className="text-muted-foreground mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Schedule Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parentToday && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getParentColor(parentToday)}>{parentToday}&apos;s Week</Badge>
                  </div>
                  {parentNextWeek && (
                    <p className="text-xs text-muted-foreground">
                      Next: {parentNextWeek}&apos;s week
                    </p>
                  )}
                </div>
              )}
              {!parentToday && <p className="text-sm text-muted-foreground">No schedule data</p>}
            </CardContent>
          </Card>

          {/* Weather Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CloudSun className="w-4 h-4" /> Minocqua Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="w-5 h-5 text-[#D4A574]" />
                    <span className="text-2xl font-bold">{Math.round(weather.temperature)}°F</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{weatherDesc}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {Math.round(weather.windspeed)} mph</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading weather...</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Open Notes</span>
                  <Badge variant="secondary">{notes.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Tasks</span>
                  <Badge variant="secondary">{tasks.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`p-2 rounded-lg ${link.color}`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Open Handoff Notes */}
        {notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5" /> Open Handoff Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(note.created_at), 'MMM d')} • {(note as any).profiles?.display_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/notes" className="text-sm text-[#2D6A4F] font-medium hover:underline">
                  View all notes →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Maintenance */}
        {tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5" /> Upcoming Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.next_due_date && (
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    <Badge variant={task.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
                <Link href="/maintenance" className="text-sm text-[#2D6A4F] font-medium hover:underline">
                  View all tasks →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains', 80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  }
  return descriptions[code] || 'Unknown'
}
