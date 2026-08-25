import { budgetForMonth, categoryBudgetStatus, setBudgetForMonth } from './budgets'
import type { Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const space: Space = {
  id: 's',
  name: 'Test',
  description: '',
  kind: 'hogar',
  members: [],
  expenses: [
    {
      id: 'e1',
      description: 'Comida',
      amount: 120,
      category: 'comida',
      paidById: 'a',
      date: '2026-08-10',
      splitMode: 'equal',
      participantIds: [],
      createdAt: '',
    },
    {
      id: 'e2',
      description: 'Transporte',
      amount: 80,
      category: 'transporte',
      paidById: 'a',
      date: '2026-08-11',
      splitMode: 'equal',
      participantIds: [],
      createdAt: '',
    },
  ],
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
}

const withBudget = setBudgetForMonth(space, '2026-08', 'comida', 100)
assert(budgetForMonth(withBudget, '2026-08').comida === 100, 'budget stored')

const scoped = { ...withBudget, expenses: withBudget.expenses.filter((e) => e.date.startsWith('2026-08')) }
const status = categoryBudgetStatus(scoped, '2026-08')
const comida = status.find((s) => s.category === 'comida')!
assert(comida.over === true, 'over budget')
assert(comida.spent === 120, 'spent correct')

console.log('budgets.test.ts OK')
