import { availableMonths, filterExpenses, spaceForMonth } from './months'
import type { Expense, Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const expenses: Expense[] = [
  {
    id: '1',
    description: 'Alquiler',
    amount: 10,
    category: 'vivienda',
    paidById: 'a',
    date: '2026-08-01',
    splitMode: 'equal',
    participantIds: [],
    createdAt: '',
  },
  {
    id: '2',
    description: 'Supermercado',
    amount: 5,
    category: 'comida',
    paidById: 'b',
    date: '2026-07-10',
    splitMode: 'equal',
    participantIds: [],
    notes: 'verduras',
    createdAt: '',
  },
]

const months = availableMonths(expenses)
assert(months.includes('2026-08'), 'has august')
assert(months.includes('2026-07'), 'has july')

const aug = filterExpenses(expenses, '2026-08', '', () => 'X')
assert(aug.length === 1 && aug[0].description === 'Alquiler', 'filter month')

const search = filterExpenses(expenses, 'all', 'verduras', () => 'Luis')
assert(search.length === 1 && search[0].id === '2', 'search notes')

const space = {
  id: 's',
  name: 'Hogar',
  description: '',
  kind: 'hogar',
  members: [],
  expenses,
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
} as Space

assert(spaceForMonth(space, '2026-07').expenses.length === 1, 'space month')
console.log('months tests OK')
