import {
  availableMonths,
  filterExpenses,
  monthExpenseCounts,
  monthsByYear,
  spaceForMonth,
} from './months'
import { parseAmount } from './format'
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

const withFuture = availableMonths(expenses, '2026-12')
assert(withFuture.includes('2026-12'), 'keeps selected month without expenses')
assert(withFuture[0] !== 'all', 'months list is keys only')
assert(!availableMonths(expenses).includes('2028-06'), 'does not dump empty far months')
assert(!availableMonths(expenses).includes('2027-02'), 'no empty february 2027')
assert(monthExpenseCounts(expenses)['2026-08'] === 1, 'august count')
assert(monthExpenseCounts(expenses)['2026-07'] === 1, 'july count')
assert(monthsByYear(['2026-08', '2026-07', '2025-12'])[0].year === '2026', 'year groups')
assert(monthsByYear(['2026-08', '2026-07', '2025-12'])[0].months[0] === '2026-08', 'newest month first')

const aug = filterExpenses(expenses, '2026-08', '', () => 'X')
assert(aug.length === 1 && aug[0].description === 'Alquiler', 'filter month')

const search = filterExpenses(expenses, 'all', 'verduras', () => 'Luis')
assert(search.length === 1 && search[0].id === '2', 'search notes')

const byCat = filterExpenses(expenses, 'all', '', () => 'X', { category: 'comida' })
assert(byCat.length === 1 && byCat[0].id === '2', 'filter category')

const byPayer = filterExpenses(expenses, 'all', '', () => 'X', { paidById: 'a' })
assert(byPayer.length === 1 && byPayer[0].id === '1', 'filter payer')

const cheapFirst = filterExpenses(expenses, 'all', '', () => 'X', {}, 'amount-asc')
assert(cheapFirst[0].id === '2', 'sort amount asc')

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

assert(parseAmount('5000') === 5000, 'plain')
assert(parseAmount('5.000') === 5000, 'thousands')
assert(parseAmount('5,5') === 5.5, 'comma decimal')
assert(parseAmount('1.234,5') === 1234.5, 'ar mix')

console.log('months tests OK')
