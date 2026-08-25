import {
  addMonthsToDate,
  buildInstallmentPlan,
  dueAlerts,
  splitInstallmentAmounts,
} from './installments'
import { incomeForMonth, setIncomeForMonth } from './members'
import { sharesForExpense } from './balances'
import type { Member } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const amounts = splitInstallmentAmounts(100, 3)
assert(amounts.length === 3, '3 amounts')
assert(Math.abs(amounts.reduce((s, n) => s + n, 0) - 100) < 0.02, 'sum 100')

assert(addMonthsToDate('2026-01-31', 1) === '2026-02-28', 'feb clamp')

const { plan, expenses } = buildInstallmentPlan({
  description: 'TV',
  category: 'compras',
  totalAmount: 300000,
  installmentCount: 3,
  paidById: 'a',
  splitMode: 'income',
  participantIds: [],
  startDate: '2026-08-10',
})
assert(plan.installmentCount === 3, 'plan count')
assert(expenses.length === 3, '3 drafts')
assert(expenses[0].installmentNumber === 1, 'first n')
assert(expenses[2].dueDate === '2026-10-10', 'third due')

const alerts = dueAlerts(
  [
    {
      id: '1',
      description: 'x',
      amount: 1,
      category: 'otros',
      paidById: 'a',
      date: '2026-08-01',
      dueDate: '2026-08-20',
      splitMode: 'equal',
      participantIds: [],
      createdAt: '',
    },
  ],
  '2026-08-25',
)
assert(alerts[0].status === 'overdue', 'overdue')

const m: Member = {
  id: 'a',
  name: 'Ana',
  income: 100,
  color: '#000',
  createdAt: '',
}
const m2 = setIncomeForMonth(m, '2026-08', 200)
assert(incomeForMonth(m2, '2026-08') === 200, 'override')
assert(incomeForMonth(m2, '2026-07') === 100, 'base')

const personal = sharesForExpense(
  {
    id: 'p',
    description: 'solo',
    amount: 50,
    category: 'otros',
    paidById: 'a',
    date: '2026-08-01',
    splitMode: 'equal',
    participantIds: ['a'],
    createdAt: '',
  },
  [
    m,
    { id: 'b', name: 'Ben', income: 100, color: '#111', createdAt: '' },
  ],
)
assert(personal.a === 50 && personal.b == null, 'personal only a')

console.log('installments+members tests OK')
