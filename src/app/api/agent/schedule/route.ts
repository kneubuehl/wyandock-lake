import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentAuth, unauthorizedResponse } from '@/lib/agent-auth'
import { getParentForDate, generateScheduleBlocks } from '@/lib/schedule'
import { isWithinInterval } from 'date-fns'

export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) return unauthorizedResponse()

  const dateStr = request.nextUrl.searchParams.get('date')
  const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const parent = getParentForDate(date)

  // Determine period type
  const year = date.getFullYear()
  const blocks = generateScheduleBlocks(year)
  let period = 'unknown'
  for (const block of blocks) {
    if (isWithinInterval(date, { start: block.start, end: block.end })) {
      const days = Math.round((block.end.getTime() - block.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      period = days > 7 ? 'biweekly' : 'weekly'
      break
    }
  }

  return NextResponse.json({
    date: date.toISOString().split('T')[0],
    parent,
    period,
  })
}
