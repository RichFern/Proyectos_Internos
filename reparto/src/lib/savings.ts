import type { SavingsGoal, SavingsMovement } from '../types'

export function savingsProgress(
  goal: SavingsGoal,
  movements: SavingsMovement[],
): { saved: number; percent: number; remaining: number } {
  const saved = movements
    .filter((movement) => movement.goalId === goal.id)
    .reduce((sum, movement) => sum + movement.amount, 0)
  const target = Math.max(0, goal.targetAmount)
  const percent = target > 0 ? Math.min(1, saved / target) : 0
  return {
    saved,
    percent,
    remaining: Math.max(0, target - saved),
  }
}

export function totalSaved(movements: SavingsMovement[]): number {
  return movements.reduce((sum, movement) => sum + movement.amount, 0)
}

export function overallSavingsProgress(
  goals: SavingsGoal[],
  movements: SavingsMovement[],
): { saved: number; target: number; percent: number } {
  const target = goals.reduce((sum, goal) => sum + Math.max(0, goal.targetAmount), 0)
  const saved = totalSaved(movements)
  return {
    saved,
    target,
    percent: target > 0 ? Math.min(1, saved / target) : 0,
  }
}

export function savingsByMonth(
  movements: SavingsMovement[],
): { month: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const movement of movements) {
    const month = movement.accountingMonth ?? movement.date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + movement.amount)
  }
  return [...map.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/** Abonos agrupados por mes contable para una meta (gráfico de barras). */
export function savingsDepositsByMonth(
  movements: SavingsMovement[],
  goalId: string,
): { month: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const movement of movements) {
    if (movement.goalId !== goalId) continue
    const month = movement.accountingMonth ?? movement.date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + movement.amount)
  }
  return [...map.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function savingsGrowthSeries(
  movements: SavingsMovement[],
  goalId?: string,
): { date: string; total: number }[] {
  const scoped = goalId
    ? movements.filter((movement) => movement.goalId === goalId)
    : movements
  const sorted = [...scoped].sort((a, b) => a.date.localeCompare(b.date))
  let total = 0
  return sorted.map((movement) => {
    total += movement.amount
    return { date: movement.date, total }
  })
}

export function diffMonthsInclusive(fromIso: string, toIso: string): number {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1
  return Math.max(0, months)
}

export function monthlySavingsNeeded(
  goal: SavingsGoal,
  movements: SavingsMovement[],
  todayIso: string,
): number | null {
  if (!goal.deadline) return null
  const { remaining } = savingsProgress(goal, movements)
  if (remaining <= 0) return 0
  const months = diffMonthsInclusive(todayIso.slice(0, 10), goal.deadline)
  if (months <= 0) return null
  return Math.ceil(remaining / months)
}
