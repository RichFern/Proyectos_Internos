import { computeBalances, sharesForExpense, suggestSettlements } from './balances'
import type { Expense, Space } from '../types'

const members = [
  { id: 'a', name: 'Ana', income: 100, color: '#000', createdAt: '' },
  { id: 'b', name: 'Ben', income: 50, color: '#111', createdAt: '' },
]

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const equalExpense: Expense = {
  id: '1',
  description: 'Test',
  amount: 90,
  category: 'otros',
  paidById: 'a',
  date: '2026-01-01',
  splitMode: 'equal',
  participantIds: [],
  createdAt: '',
}

const equalShares = sharesForExpense(equalExpense, members)
assert(Math.abs(equalShares.a - 45) < 0.001, 'equal share a')
assert(Math.abs(equalShares.b - 45) < 0.001, 'equal share b')

const incomeExpense: Expense = {
  ...equalExpense,
  id: '2',
  amount: 150,
  splitMode: 'income',
}
const incomeShares = sharesForExpense(incomeExpense, members)
assert(Math.abs(incomeShares.a - 100) < 0.001, 'income share a')
assert(Math.abs(incomeShares.b - 50) < 0.001, 'income share b')

const customExpense: Expense = {
  ...equalExpense,
  id: 'custom',
  amount: 100,
  splitMode: 'custom',
  customShares: { a: 70, b: 30 },
}
const customShares = sharesForExpense(customExpense, members)
assert(Math.abs(customShares.a - 70) < 0.001, 'custom 70% a')
assert(Math.abs(customShares.b - 30) < 0.001, 'custom 30% b')

const agreedMembers = [
  { ...members[0], contributionPercent: 60 },
  { ...members[1], contributionPercent: 40 },
]
const agreedShares = sharesForExpense(incomeExpense, agreedMembers)
assert(Math.abs(agreedShares.a - 90) < 0.001, 'agreed 60% a')
assert(Math.abs(agreedShares.b - 60) < 0.001, 'agreed 40% b')

const space: Space = {
  id: 's',
  name: 'Test',
  description: '',
  kind: 'hogar',
  members,
  expenses: [incomeExpense],
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
}

const balances = computeBalances(space)
const ana = balances.find((b) => b.memberId === 'a')!
const ben = balances.find((b) => b.memberId === 'b')!
assert(Math.abs(ana.paid - 150) < 0.001, 'ana paid')
assert(Math.abs(ana.owes - 100) < 0.001, 'ana owes')
assert(Math.abs(ana.net - 50) < 0.001, 'ana net')
assert(Math.abs(ben.net + 50) < 0.001, 'ben net')

const settlements = suggestSettlements(balances)
assert(settlements.length === 1, 'one settlement')
assert(settlements[0].fromId === 'b', 'from ben')
assert(settlements[0].toId === 'a', 'to ana')
assert(Math.abs(settlements[0].amount - 50) < 0.001, 'amount 50')

console.log('balances tests OK')
