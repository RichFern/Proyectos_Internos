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
