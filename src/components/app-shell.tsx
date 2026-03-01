'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Home, CalendarDays, BookOpen, ClipboardList, Wrench,
  Lock, Phone, Menu, LogOut, X, CloudSun, Droplets, Wind,
  ThermometerSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/procedures', label: 'Procedures', icon: BookOpen },
  { href: '/notes', label: 'Notes', icon: ClipboardList },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/codes', label: 'Codes', icon: Lock },
  { href: '/contacts', label: 'Contacts', icon: Phone },
  { href: '/wishlist', label: 'Wish List', icon: Lightbulb },
]

interface WeatherData {
  temperature: number
  weathercode: number
  windspeed: number
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun
  if (code <= 3) return CloudSun
  if (code <= 48) return Cloud
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  return CloudLightning
}

function getWeatherLabel(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear', 1: 'Clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
    61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow',
    80: 'Showers', 81: 'Showers', 82: 'Storms',
    85: 'Snow', 86: 'Snow', 95: 'Thunderstorm', 96: 'Hail', 99: 'Hail',
  }
  return map[code] || ''
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=45.87&longitude=-89.71&current_weather=true&temperature_unit=fahrenheit')
      .then(r => r.json())
      .then(data => {
        if (data.current_weather) {
          setWeather({
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
            windspeed: data.current_weather.windspeed,
          })
        }
      })
      .catch(() => {})
  }, [])

  const WeatherIcon = weather ? getWeatherIcon(weather.weathercode) : CloudSun
  const weatherLabel = weather ? getWeatherLabel(weather.weathercode) : ''

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-lake-gradient">
        <Link href="/" className="flex items-center gap-3 px-5 py-5 border-b border-white/10 no-underline">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md shrink-0">
            <Image src="/lake-hero.jpg" alt="Lake Wyandock" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight font-script">Lake Wyandock</h1>
            <p className="text-[10px] text-blue-200/60 uppercase tracking-widest">Wyandock Lake</p>
          </div>
        </Link>

        {/* Weather in sidebar */}
        {weather && (
          <div className="px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <WeatherIcon className="w-4 h-4 text-blue-200/80" />
              <span className="text-lg font-semibold text-white">{Math.round(weather.temperature)}°</span>
              <span className="text-xs text-blue-200/60">{weatherLabel}</span>
            </div>
            <p className="text-[10px] text-blue-200/40 mt-0.5">Minocqua, WI</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? 'bg-white/15 text-[#C8A97E] font-medium'
                    : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-blue-200/50 mb-2 truncate">{profile?.display_name}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-blue-200/60 hover:text-white hover:bg-white/10 w-full justify-start text-xs h-8">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-lake-gradient shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-md overflow-hidden shadow-sm shrink-0">
              <Image src="/lake-hero.jpg" alt="Lake Wyandock" width={28} height={28} className="object-cover w-full h-full" />
            </div>
            <h1 className="text-base font-semibold text-white tracking-tight font-script">Lake Wyandock</h1>
          </Link>
          <div className="flex items-center gap-3">
            {/* Weather in mobile header */}
            {weather && (
              <div className="flex items-center gap-1.5 text-white/80">
                <WeatherIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{Math.round(weather.temperature)}°</span>
              </div>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 h-8 w-8">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-lake-gradient text-white border-white/10 w-64 p-0">
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                  <span className="text-base font-semibold text-[#C8A97E]">Menu</span>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white/80 hover:bg-white/10 h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <nav className="px-3 py-3 space-y-0.5">
                  {navItems.map(item => {
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? 'bg-white/15 text-[#C8A97E] font-medium'
                            : 'text-blue-100/70 hover:bg-white/8'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="px-4 py-3 border-t border-white/10 mt-auto">
                  <p className="text-xs text-blue-200/50 mb-2">{profile?.display_name}</p>
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setOpen(false) }} className="text-blue-200/60 hover:text-white hover:bg-white/10 text-xs">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-60">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border/50 z-50">
        <div className="flex justify-around py-1.5">
          {navItems.slice(0, 5).map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
                  active ? 'text-[#1E3A5F] font-semibold' : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 ${active ? 'text-[#1E3A5F]' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
