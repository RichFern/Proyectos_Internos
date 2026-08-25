import type { ExpenseCategory, Space } from '../types'
import { CATEGORY_LABELS } from '../types'
import { categoryTotals } from './balances'

export type MonthBudget = Partial<Record<ExpenseCategory, number>>

export function budgetForMonth(
  space: Space,
  month: string,
): MonthBudget {
  return space.budgetsByMonth?.[month] ?? {}
}

export function categoryBudgetStatus(
  space: Space,
  month: string | null,
): {
  category: ExpenseCategory
  label: string
  spent: number
  limit?: number
  over: boolean
  percent?: number
}[] {
  const totals = new Map(
    categoryTotals(space).map((t) => [t.category as ExpenseCategory, t.amount]),
  )
  const budget = month ? budgetForMonth(space, month) : {}
  const categories = new Set<ExpenseCategory>([
    ...(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]),
    ...totals.keys(),
    ...(Object.keys(budget) as ExpenseCategory[]),
  ])

  return [...categories].map((cat) => {
    const spent = totals.get(cat) ?? 0
    const limit = budget[cat]
    const over = limit != null && limit > 0 && spent > limit
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      spent,
      limit,
      over,
      percent: limit && limit > 0 ? spent / limit : undefined,
    }
  }).sort((a, b) => b.spent - a.spent)
}

export function setBudgetForMonth(
  space: Space,
  month: string,
  category: ExpenseCategory,
  limit: number | null,
): Space {
  const budgetsByMonth = { ...(space.budgetsByMonth ?? {}) }
  const monthBudget = { ...(budgetsByMonth[month] ?? {}) }
  if (limit == null || limit <= 0) {
    delete monthBudget[category]
  } else {
    monthBudget[category] = limit
  }
  if (Object.keys(monthBudget).length === 0) {
    delete budgetsByMonth[month]
  } else {
    budgetsByMonth[month] = monthBudget
  }
  return { ...space, budgetsByMonth }
}
