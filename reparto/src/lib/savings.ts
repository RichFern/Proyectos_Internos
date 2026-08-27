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
    const month = movement.date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + movement.amount)
  }
  return [...map.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => b.month.localeCompare(a.month))
}
