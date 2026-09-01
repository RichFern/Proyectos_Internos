import type { Space } from '../types'
import { sortSpacesByRecent, spaceActivityAt } from './spaceActivity'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const a: Space = {
  id: 'a',
  name: 'A',
  description: '',
  kind: 'hogar',
  members: [],
  expenses: [{ id: 'e1', description: 'x', amount: 1, category: 'comida', paidById: 'm', date: '2026-08-01', splitMode: 'equal', participantIds: [], createdAt: '2026-08-30T10:00:00Z' }],
  templates: [],
  installmentPlans: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const b: Space = {
  ...a,
  id: 'b',
  name: 'B',
  expenses: [],
  updatedAt: '2026-08-20',
}

const sorted = sortSpacesByRecent([b, a])
assert(sorted[0]?.id === 'a', 'expense activity ranks first')
assert(spaceActivityAt(a) === '2026-08-30T10:00:00Z', 'uses latest expense')

console.log('spaceActivity.test.ts OK')
