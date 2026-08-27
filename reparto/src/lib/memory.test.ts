import { suggestFromHistory } from './memory'
import type { Expense } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const expenses: Expense[] = [
  {
    id: '1',
    description: 'Luz',
    amount: 42000,
    category: 'servicios',
    paidById: 'a',
    date: '2026-07-10',
    splitMode: 'income',
    participantIds: [],
    createdAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: '2',
    description: 'Luz',
    amount: 39000,
    category: 'vivienda',
    paidById: 'b',
    date: '2026-06-10',
    splitMode: 'equal',
    participantIds: [],
    createdAt: '2026-06-10T10:00:00.000Z',
  },
]

const hit = suggestFromHistory(expenses, 'luz')
assert(hit?.category === 'servicios', 'remembers latest category')
assert(hit?.matchedDescription === 'Luz', 'keeps original label')
assert(suggestFromHistory(expenses, 'x') === null, 'no match')

console.log('memory tests OK')
