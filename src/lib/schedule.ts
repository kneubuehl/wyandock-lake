// Parent schedule logic for Lake Wyandock
// 
// Rules:
// - Fall/Spring (Oct through Apr): alternating every TWO weeks
// - Summer: beginning the FIRST FULL WEEK of May, alternates WEEKLY
// - This weekly alternation continues until the FIRST FULL WEEK of October,
//   when it resumes bi-weekly blocks
// - 2026 starts with Cheryl. Schedule flips each year.
// - "First full week" = the first Mon-Sun block where Mon is on or after the 1st

import { startOfWeek, addWeeks, addDays, isWithinInterval } from 'date-fns'

export type ParentName = 'Cheryl' | 'Stephen Sr.'

interface ScheduleBlock {
  start: Date
  end: Date
  parent: ParentName
}

/**
 * Find the first full week (Mon-Sun) on or after the 1st of the given month.
 * "Full week" means Monday falls on or after the 1st.
 */
function firstFullWeekMonday(year: number, month: number): Date {
  // month is 0-indexed (0=Jan, 4=May, 9=Oct)
  const firstOfMonth = new Date(year, month, 1)
  const dow = firstOfMonth.getDay() // 0=Sun, 1=Mon, ...
  if (dow === 1) return firstOfMonth // Monday already
  if (dow === 0) return new Date(year, month, 2) // Sunday → next day is Monday
  // Tue-Sat → advance to next Monday
  return new Date(year, month, 1 + (8 - dow))
}

export function getParentForDate(date: Date, year?: number): ParentName | null {
  const y = year || date.getFullYear()
  // Check current year and neighboring years for coverage around year boundaries
  for (const checkYear of [y - 1, y, y + 1]) {
    const blocks = generateScheduleBlocks(checkYear)
    for (const block of blocks) {
      if (isWithinInterval(date, { start: block.start, end: block.end })) {
        return block.parent
      }
    }
  }
  return null
}

export function generateScheduleBlocks(year: number): ScheduleBlock[] {
  // 2026 starts with Cheryl. Even years = Cheryl first, odd = Stephen Sr. first
  const firstParent: ParentName = year % 2 === 0 ? 'Cheryl' : 'Stephen Sr.'
  const secondParent: ParentName = firstParent === 'Cheryl' ? 'Stephen Sr.' : 'Cheryl'

  const blocks: ScheduleBlock[] = []
  let toggleCount = 0 // even = firstParent, odd = secondParent

  function currentParent(): ParentName {
    return toggleCount % 2 === 0 ? firstParent : secondParent
  }

  // Find the Monday of the week containing Jan 1
  let current = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })

  // Summer boundaries
  const summerStart = firstFullWeekMonday(year, 4) // First full week of May
  const summerEnd = firstFullWeekMonday(year, 9)   // First full week of October (resumes bi-weekly)

  // End of year coverage
  const yearEnd = new Date(year, 11, 31)

  // ── Phase 1: Bi-weekly from start of year until summer ──
  while (current < summerStart) {
    const blockEnd = addDays(addWeeks(current, 2), -1) // 2-week block, Sun
    const effectiveEnd = blockEnd < summerStart ? blockEnd : addDays(summerStart, -1)
    
    // Only add block if it has positive duration
    if (effectiveEnd >= current) {
      blocks.push({
        start: new Date(current),
        end: new Date(effectiveEnd),
        parent: currentParent(),
      })
    }
    
    current = addWeeks(current, 2)
    toggleCount++
  }

  // ── Phase 2: Weekly from first full week of May until first full week of Oct ──
  current = new Date(summerStart)
  while (current < summerEnd) {
    const blockEnd = addDays(current, 6) // 1-week block, Sun
    const effectiveEnd = blockEnd < summerEnd ? blockEnd : addDays(summerEnd, -1)
    
    if (effectiveEnd >= current) {
      blocks.push({
        start: new Date(current),
        end: new Date(effectiveEnd),
        parent: currentParent(),
      })
    }
    
    current = addWeeks(current, 1)
    toggleCount++
  }

  // ── Phase 3: Bi-weekly from first full week of Oct through end of year ──
  current = new Date(summerEnd)
  while (current <= yearEnd) {
    const blockEnd = addDays(addWeeks(current, 2), -1) // 2-week block
    const effectiveEnd = blockEnd <= yearEnd ? blockEnd : yearEnd
    
    if (effectiveEnd >= current) {
      blocks.push({
        start: new Date(current),
        end: new Date(effectiveEnd),
        parent: currentParent(),
      })
    }
    
    current = addWeeks(current, 2)
    toggleCount++
  }

  return blocks
}

export function getParentColor(parent: ParentName): string {
  return parent === 'Cheryl' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'
}

export function getParentBgColor(parent: ParentName): string {
  return parent === 'Cheryl' ? '#ffe4e6' : '#dbeafe'
}
