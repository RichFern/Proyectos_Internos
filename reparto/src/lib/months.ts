import type { Expense, Space } from '../types'
import { currentMonth, monthKey } from './format'

export type MonthFilter = string | 'all'

export function availableMonths(expenses: Expense[]): string[] {
  const set = new Set(expenses.map((e) => monthKey(e.date)))
  set.add(currentMonth())
  return [...set].sort((a, b) => b.localeCompare(a))
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
