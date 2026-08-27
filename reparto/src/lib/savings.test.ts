import { savingsProgress, totalSaved } from './savings'
import type { SavingsGoal, SavingsMovement } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const goal: SavingsGoal = {
  id: 'g1',
  name: 'Vacaciones',
  targetAmount: 1000,
  color: '#000',
  createdAt: '',
}

const movements: SavingsMovement[] = [
  { id: 'm1', goalId: 'g1', amount: 250, date: '2026-01-01', createdAt: '' },
  { id: 'm2', goalId: 'g1', amount: 250, date: '2026-02-01', createdAt: '' },
  { id: 'm3', goalId: 'g2', amount: 100, date: '2026-02-01', createdAt: '' },
]

const progress = savingsProgress(goal, movements)
assert(progress.saved === 500, 'sums goal movements')
assert(progress.percent === 0.5, 'percent halfway')
assert(progress.remaining === 500, 'remaining amount')
assert(totalSaved(movements) === 600, 'total saved across goals')

console.log('savings.test.ts OK')
