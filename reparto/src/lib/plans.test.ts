import { canAddExpense, canAddHouseholdMember, canAddSpace, limitsFor } from './plans'
import type { Household, Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const household: Household = {
  id: 'h',
  name: 'Hogar',
  ownerUid: 'a',
  memberUids: ['a'],
  memberEmails: ['a@test.com'],
  roles: { a: 'owner' },
  planTier: 'personal',
  createdAt: '',
  updatedAt: '',
}

const space: Space = {
  id: 's',
  name: 'Mi hogar',
  description: '',
  kind: 'hogar',
  members: [],
  expenses: [],
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
}

assert(limitsFor('personal').maxSpaces === 1, 'personal has one space')
assert(!canAddHouseholdMember(household), 'personal cannot invite another member')
assert(canAddSpace(household, []), 'can create first personal space')
assert(!canAddSpace(household, [space]), 'cannot create second personal space')
assert(canAddExpense('personal', space), 'can add expense under limit')

console.log('plans.test.ts OK')

