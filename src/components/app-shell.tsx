'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Home, CalendarDays, BookOpen, ClipboardList, Wrench,
  Lock, Phone, Menu, LogOut, X
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
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#1B4332] text-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#2D6A4F]">
          <span className="text-3xl">🦅</span>
          <div>
            <h1 className="text-xl font-bold text-[#D4A574]">Up North</h1>
            <p className="text-xs text-green-200 opacity-75">Wyandock Lake</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#2D6A4F] text-[#D4A574]'
                    : 'text-green-100 hover:bg-[#2D6A4F]/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-[#2D6A4F]">
          <p className="text-xs text-green-200 mb-2 truncate">{profile?.display_name}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-green-200 hover:text-white hover:bg-[#2D6A4F] w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#1B4332] text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦅</span>
          <h1 className="text-lg font-bold text-[#D4A574]">Up North</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#2D6A4F]">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B4332] text-white border-[#2D6A4F] w-64 p-0">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2D6A4F]">
              <span className="text-lg font-bold text-[#D4A574]">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white hover:bg-[#2D6A4F]">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map(item => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#2D6A4F] text-[#D4A574]'
                        : 'text-green-100 hover:bg-[#2D6A4F]/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-4 py-4 border-t border-[#2D6A4F] mt-auto">
              <p className="text-xs text-green-200 mb-2">{profile?.display_name}</p>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); setOpen(false) }} className="text-green-200 hover:text-white hover:bg-[#2D6A4F]">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="md:pl-64">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  active ? 'text-[#1B4332] font-semibold' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
