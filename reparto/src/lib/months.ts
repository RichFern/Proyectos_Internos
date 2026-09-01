import type { Expense, Space } from '../types'
import { currentMonth, expenseMonth } from './format'
import { isPersonalExpense } from './installments'

export type MonthFilter = string | 'all'

export function availableMonths(
  expenses: Expense[],
  selected?: MonthFilter | null,
): string[] {
  const set = new Set(
    expenses.map((e) => expenseMonth(e)).filter((key) => key.length >= 7),
  )
  set.add(currentMonth())
  if (selected && selected !== 'all') set.add(selected)
  return [...set].sort((a, b) => b.localeCompare(a))
}

export function monthExpenseCounts(expenses: Expense[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const expense of expenses) {
    const key = expenseMonth(expense)
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
  if (
    space.kind === 'viaje' ||
    space.kind === 'evento' ||
    space.kind === 'salida'
  ) {
    return 'all'
  }
  const months = availableMonths(space.expenses)
  if (months.includes(currentMonth())) return currentMonth()
  return months[0] ?? currentMonth()
}

export type ExpenseSort =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'name'

export type ExpenseTag = 'receipt' | 'installment' | 'personal'

export interface ExpenseFilters {
  category?: string | null
  paidById?: string | null
  tag?: ExpenseTag | null
}

export function filterExpenses(
  expenses: Expense[],
  month: MonthFilter,
  query: string,
  memberName: (id: string) => string,
  filters: ExpenseFilters = {},
  sort: ExpenseSort = 'date-desc',
): Expense[] {
  const q = query.trim().toLowerCase()
  const list = expenses
    .filter((e) => (month === 'all' ? true : expenseMonth(e) === month))
    .filter((e) => {
      if (filters.category && e.category !== filters.category) return false
      if (filters.paidById && e.paidById !== filters.paidById) return false
      if (filters.tag === 'receipt' && !e.hasReceipt) return false
      if (filters.tag === 'installment' && !e.installmentPlanId) return false
      if (filters.tag === 'personal' && !isPersonalExpense(e)) return false
      if (!q) return true
      const hay = [
        e.description,
        e.notes ?? '',
        e.category,
        memberName(e.paidById),
        String(e.amount),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })

  return [...list].sort((a, b) => {
    if (sort === 'amount-desc') return b.amount - a.amount
    if (sort === 'amount-asc') return a.amount - b.amount
    if (sort === 'name') return a.description.localeCompare(b.description, 'es')
    if (sort === 'date-asc') {
      return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
    }
    return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  })
}

export function spaceForMonth(space: Space, month: MonthFilter): Space {
  if (month === 'all') return space
  return {
    ...space,
    expenses: space.expenses.filter((e) => expenseMonth(e) === month),
  }
}
