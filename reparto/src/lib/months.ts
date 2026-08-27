import type { Expense, Space } from '../types'
import { currentMonth, monthKey } from './format'

export type MonthFilter = string | 'all'

export function availableMonths(
  expenses: Expense[],
  selected?: MonthFilter | null,
): string[] {
  const set = new Set(
    expenses.map((e) => monthKey(e.date)).filter((key) => key.length >= 7),
  )
  set.add(currentMonth())
  if (selected && selected !== 'all') set.add(selected)
  return [...set].sort((a, b) => b.localeCompare(a))
}

export function monthExpenseCounts(expenses: Expense[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const expense of expenses) {
    const key = monthKey(expense.date)
    if (key.length < 7) continue
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function monthsByYear(
  months: string[],
): { year: string; months: string[] }[] {
  const map = new Map<string, string[]>()
  for (const key of months) {
    const year = key.slice(0, 4)
    const list = map.get(year) ?? []
    list.push(key)
    map.set(year, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, keys]) => ({
      year,
      months: keys.sort((a, b) => b.localeCompare(a)),
    }))
}

export function defaultMonthFilter(space: Space): MonthFilter {
  if (space.kind === 'viaje' || space.kind === 'evento') return 'all'
  const months = availableMonths(space.expenses)
  if (months.includes(currentMonth())) return currentMonth()
  return months[0] ?? currentMonth()
}

export function filterExpenses(
  expenses: Expense[],
  month: MonthFilter,
  query: string,
  memberName: (id: string) => string,
): Expense[] {
  const q = query.trim().toLowerCase()
  return expenses
    .filter((e) => (month === 'all' ? true : monthKey(e.date) === month))
    .filter((e) => {
      if (!q) return true
      const hay = [
        e.description,
        e.notes ?? '',
        e.category,
        memberName(e.paidById),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function spaceForMonth(space: Space, month: MonthFilter): Space {
  if (month === 'all') return space
  return {
    ...space,
    expenses: space.expenses.filter((e) => monthKey(e.date) === month),
  }
}
