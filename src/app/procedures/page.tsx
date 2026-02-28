'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Procedure } from '@/lib/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Search, BookOpen } from 'lucide-react'

const CATEGORIES = ['All', 'HVAC', 'Boat', 'Hot Tub', 'General', 'Opening', 'Closing']

export default function ProceduresPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    supabase
      .from('procedures')
      .select('*')
      .order('title')
      .then(({ data }) => { if (data) setProcedures(data) })
  }, [])

  const filtered = procedures.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })

  if (loading || !user) return null

  return (
    <AppShell>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B4332]">Procedures</h1>
          <Link href="/procedures/new">
            <Button className="bg-[#1B4332] hover:bg-[#2D6A4F]">
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search procedures..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className={category === cat ? 'bg-[#1B4332]' : ''}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Procedures List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No procedures found</p>
            </div>
          )}
          {filtered.map(proc => (
            <Link key={proc.id} href={`/procedures/${proc.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[#1B4332]">{proc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {format(new Date(proc.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary">{proc.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
