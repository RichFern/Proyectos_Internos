import { expenseMonth, formatMoney } from './format'
import { allPaymentMethods, OTHER_PAYMENT_METHOD } from './paymentMethods'
import { filterYearExpenses, categoryMonthHistory } from './year'
import type { Expense } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(formatMoney(1803799).includes('$'), 'peso sign')
assert(formatMoney(1803799).includes('1.803.799') || formatMoney(1803799).includes('1,803,799'), 'thousands')
assert(formatMoney(-50).startsWith('-$') || formatMoney(-50).startsWith('-$ '), 'negative')

assert(
  expenseMonth({ date: '2026-07-31', accountingMonth: '2026-08' }) === '2026-08',
  'accounting month wins',
)
assert(expenseMonth({ date: '2026-07-31' }) === '2026-07', 'falls back to date')

const methods = allPaymentMethods({ paymentMethods: ['Mercado Pago'] })
assert(methods[methods.length - 1] === OTHER_PAYMENT_METHOD, 'Otro last')
assert(methods.includes('Mercado Pago'), 'custom method')

const expenses: Expense[] = [
  {
    id: '1',
    description: 'Super',
    amount: 10,
    category: 'comida',
    paidById: 'a',
    date: '2026-08-01',
    splitMode: 'equal',
    participantIds: [],
    createdAt: '',
  },
  {
    id: '2',
    description: 'Luz',
    amount: 20,
    category: 'servicios',
    paidById: 'b',
    date: '2026-07-31',
    accountingMonth: '2026-08',
    splitMode: 'income',
    participantIds: [],
    createdAt: '',
  },
]

const byPerson = filterYearExpenses(expenses, { paidById: 'a' })
assert(byPerson.length === 1 && byPerson[0].id === '1', 'filter person')
const byCat = filterYearExpenses(expenses, { category: 'servicios' })
assert(byCat.length === 1 && byCat[0].id === '2', 'filter category')

const history = categoryMonthHistory(expenses, 'servicios')
assert(history.historicalTotal === 20, 'category total')
assert(history.months.some((row) => row.month === '2026-08'), 'uses accounting month')

console.log('dashboard helpers tests OK')
