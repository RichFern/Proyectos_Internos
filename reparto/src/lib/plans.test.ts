import { canAddExpense, canAddHouseholdMember, canAddSpace, canAccessHistoryMonth, limitsFor } from './plans'
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

assert(limitsFor('personal').label === 'Básico', 'basic label')
assert(limitsFor('family').label === 'A la PaR Pro', 'pro label')
assert(limitsFor('plus').label === 'Premium', 'premium label')
assert(limitsFor('personal').maxMembers === 1, 'basic allows 1 member')
assert(limitsFor('personal').maxSpaces === 1, 'basic has one space')
assert(limitsFor('personal').historyMonths === 3, 'basic has 3 month history')
assert(!canAddHouseholdMember(household), 'basic cannot invite another member')
assert(!limitsFor('family').features.personalSpaces, 'pro has no personal spaces')
assert(limitsFor('plus').features.personalSpaces, 'premium has personal spaces')
assert(canAddSpace(household, []), 'can create first basic space')
assert(!canAddSpace(household, [space]), 'cannot create second basic space')
assert(canAddExpense('personal', space), 'can add expense')
assert(!limitsFor('personal').features.savings, 'basic has no savings')
assert(!limitsFor('family').features.savings, 'pro has no savings')
assert(limitsFor('plus').features.savings, 'premium has savings')
assert(limitsFor('plus').features.wishlist, 'premium has wishlist')
assert(limitsFor('family').features.budgets, 'pro has budgets')
assert(limitsFor('plus').features.advancedExport, 'premium has export')
assert(!limitsFor('personal').features.expenseSplit, 'basic has no expense split')
assert(limitsFor('family').features.expenseSplit, 'pro has expense split')
assert(!canAccessHistoryMonth('personal', '2020-01'), 'basic blocks old month')

console.log('plans.test.ts OK')
