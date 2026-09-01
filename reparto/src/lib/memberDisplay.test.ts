import {
  formatEmailAsName,
  householdMemberName,
  householdMemberStatus,
  isHouseholdMemberActive,
} from './memberDisplay'
import type { Household, UserProfile } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(formatEmailAsName('maria.lopez@gmail.com') === 'Maria Lopez', 'email name')

const household: Household = {
  id: 'h1',
  name: 'Test',
  ownerUid: 'u1',
  memberUids: ['u1', 'u2'],
  memberEmails: ['owner@test.com', 'maria@test.com'],
  memberUidByEmail: { 'owner@test.com': 'u1', 'maria@test.com': 'u2' },
  memberNamesByEmail: { 'maria@test.com': 'María López' },
  roles: { u1: 'owner', u2: 'member' },
  planTier: 'family',
  createdAt: '',
  updatedAt: '',
}
const profile: UserProfile = {
  uid: 'u1',
  email: 'owner@test.com',
  firstName: 'Owner',
  lastName: 'Test',
  phone: '',
  displayName: 'Owner Test',
  createdAt: '',
  updatedAt: '',
}

assert(isHouseholdMemberActive('maria@test.com', household), 'maria active')
assert(
  householdMemberName('maria@test.com', household, profile) === 'María López',
  'stored name',
)
assert(
  householdMemberStatus('maria@test.com', household, profile) === 'active',
  'active status',
)
assert(
  householdMemberName('pending@test.com', {
    ...household,
    memberEmails: [...household.memberEmails, 'pending@test.com'],
  }, profile) === 'Pending',
  'pending email fallback',
)

console.log('memberDisplay.test.ts OK')
