import { compareMonths, monthSpend, yearSpend, yearsFromExpenses } from './year'
import type { Expense } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const expenses: Expense[] = [
  {
    id: '1',
    description: 'Alquiler',
    amount: 100,
    category: 'vivienda',
    paidById: 'a',
    date: '2026-08-01',
    splitMode: 'equal',
    participantIds: [],
    createdAt: '',
  },
  {
    id: '2',
    description: 'Super',
    amount: 40,
    category: 'comida',
    paidById: 'b',
    date: '2026-07-10',
    splitMode: 'equal',
    participantIds: [],
    createdAt: '',
  },
]

const year = yearSpend(expenses, '2026')
assert(year.length === 12, 'twelve months')
assert(year[6].month === '2026-07' && year[6].amount === 40, 'july total')
assert(year[7].month === '2026-08' && year[7].amount === 100, 'august total')
assert(yearsFromExpenses(expenses).includes('2026'), 'has 2026')

const july = monthSpend(expenses, '2026-07')
assert(july.count === 1 && july.amount === 40, 'july spend')

const cmp = compareMonths(expenses, '2026-07', '2026-08')
assert(cmp.hotter === 'right', 'august hotter')
assert(cmp.delta === 60, 'delta 60')

console.log('year tests OK')
