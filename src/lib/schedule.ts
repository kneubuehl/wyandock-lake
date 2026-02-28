// Parent schedule logic for Up North
// 2026 starts with Cheryl. Flips each year.
// Bi-weekly Oct-Apr, weekly May-Sep.

import { startOfWeek, addWeeks, addDays, isWithinInterval, format } from 'date-fns'

export type ParentName = 'Cheryl' | 'Stephen Sr.'

interface ScheduleBlock {
  start: Date
  end: Date
  parent: ParentName
}

export function getParentForDate(date: Date, year?: number): ParentName | null {
  const blocks = generateScheduleBlocks(year || date.getFullYear())
  for (const block of blocks) {
    if (isWithinInterval(date, { start: block.start, end: block.end })) {
      return block.parent
    }
  }
  return null
}

export function generateScheduleBlocks(year: number): ScheduleBlock[] {
  // 2026 starts with Cheryl. Even years = Cheryl first, odd = Stephen Sr. first
  const firstParent: ParentName = year % 2 === 0 ? 'Cheryl' : 'Stephen Sr.'
  const secondParent: ParentName = firstParent === 'Cheryl' ? 'Stephen Sr.' : 'Cheryl'

  const blocks: ScheduleBlock[] = []

  // Find first Monday of the year (or closest Monday to Jan 1)
  let current = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
  if (current.getFullYear() < year) {
    current = addDays(current, 7)
  }
  // Actually start from the last Monday of December of previous year for coverage
  current = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })

  let isFirst = true

  // Phase 1: Jan - Apr (bi-weekly)
  const mayStart = new Date(year, 4, 1) // May 1
  while (current < mayStart) {
    const end = addDays(addWeeks(current, 2), -1) // 2-week block
    if (end >= mayStart) break
    blocks.push({
      start: new Date(current),
      end: end < mayStart ? end : addDays(mayStart, -1),
      parent: isFirst ? firstParent : secondParent,
    })
    current = addWeeks(current, 2)
    isFirst = !isFirst
  }

  // Phase 2: May - Sep (weekly)
  const octStart = new Date(year, 9, 1) // Oct 1
  // Find first Monday in May
  current = startOfWeek(new Date(year, 4, 1), { weekStartsOn: 1 })
  if (current < new Date(year, 4, 1)) current = addWeeks(current, 1)
  
  // Continue alternating from where we left off
  while (current < octStart) {
    const end = addDays(current, 6)
    blocks.push({
      start: new Date(current),
      end: end < octStart ? end : addDays(octStart, -1),
      parent: isFirst ? firstParent : secondParent,
    })
    current = addWeeks(current, 1)
    isFirst = !isFirst
  }

  // Phase 3: Oct - Dec (bi-weekly)
  current = startOfWeek(new Date(year, 9, 1), { weekStartsOn: 1 })
  if (current < new Date(year, 9, 1)) current = addWeeks(current, 1)
  
  const yearEnd = new Date(year, 11, 31)
  while (current <= yearEnd) {
    const end = addDays(addWeeks(current, 2), -1)
    blocks.push({
      start: new Date(current),
      end: end <= yearEnd ? end : yearEnd,
      parent: isFirst ? firstParent : secondParent,
    })
    current = addWeeks(current, 2)
    isFirst = !isFirst
  }

  return blocks
}

export function getParentColor(parent: ParentName): string {
  return parent === 'Cheryl' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'
}

export function getParentBgColor(parent: ParentName): string {
  return parent === 'Cheryl' ? '#ffe4e6' : '#dbeafe'
}
