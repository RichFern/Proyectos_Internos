import type { Expense, Space } from '../types'
import { currentMonth, expenseMonth, formatMonthName } from './format'
import { categoryTotals } from './balances'

export interface MonthSpend {
  month: string
  amount: number
  count: number
}

export function yearsFromExpenses(expenses: Expense[]): string[] {
  const set = new Set(
    expenses.map((expense) => expenseMonth(expense).slice(0, 4)).filter((year) => year.length === 4),
  )
  set.add(currentMonth().slice(0, 4))
  return [...set].sort((a, b) => b.localeCompare(a))
}

export function monthsOfYear(year: string): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
}

export function yearSpend(
  expenses: Expense[],
  year: string,
): MonthSpend[] {
  const totals = new Map<string, MonthSpend>()
  for (const key of monthsOfYear(year)) {
    totals.set(key, { month: key, amount: 0, count: 0 })
  }
  for (const expense of expenses) {
    const key = expenseMonth(expense)
    const row = totals.get(key)
    if (!row) continue
    row.amount += expense.amount
    row.count += 1
  }
  return [...totals.values()]
}

export function monthSpend(expenses: Expense[], month: string): MonthSpend {
  const scoped = expenses.filter((expense) => expenseMonth(expense) === month)
  return {
    month,
    amount: scoped.reduce((sum, expense) => sum + expense.amount, 0),
    count: scoped.length,
  }
}

export function compareMonths(
  expenses: Expense[],
  left: string,
  right: string,
): {
  left: MonthSpend
  right: MonthSpend
  delta: number
  percent: number | null
  hotter: 'left' | 'right' | 'tie'
} {
  const a = monthSpend(expenses, left)
  const b = monthSpend(expenses, right)
  const delta = b.amount - a.amount
  const percent = a.amount > 0 ? delta / a.amount : null
  const hotter =
    Math.abs(delta) < 0.5 ? 'tie' : delta > 0 ? 'right' : 'left'
  return { left: a, right: b, delta, percent, hotter }
}

export function topCategoryLabel(
  space: Space,
  month: string,
  labelFor: (id: string) => string,
): string | null {
  const scoped = {
    ...space,
    expenses: space.expenses.filter((expense) => expenseMonth(expense) === month),
  }
  const top = categoryTotals(scoped)[0]
  return top ? labelFor(top.category) : null
}

export function monthShort(key: string): string {
  return formatMonthName(key).slice(0, 3)
}

export function filterYearExpenses(
  expenses: Expense[],
  filters: { paidById?: string | null; category?: string | null },
): Expense[] {
  return expenses.filter((expense) => {
    if (filters.paidById && expense.paidById !== filters.paidById) return false
    if (filters.category && expense.category !== filters.category) return false
    return true
  })
}

export function categoryMonthHistory(
  expenses: Expense[],
  category: string,
): { months: MonthSpend[]; historicalTotal: number } {
  const scoped = expenses.filter((expense) => expense.category === category)
  const byMonth = new Map<string, MonthSpend>()
  for (const expense of scoped) {
    const key = expenseMonth(expense)
    const row = byMonth.get(key) ?? { month: key, amount: 0, count: 0 }
    row.amount += expense.amount
    row.count += 1
    byMonth.set(key, row)
  }
  const months = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month))
  const historicalTotal = scoped.reduce((sum, expense) => sum + expense.amount, 0)
  return { months, historicalTotal }
}
