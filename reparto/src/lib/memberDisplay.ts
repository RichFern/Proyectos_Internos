import type { Household, UserProfile } from '../types'

export function formatEmailAsName(email: string): string {
  const local = email.split('@')[0]?.trim() ?? email
  if (!local) return email
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function isHouseholdMemberActive(
  email: string,
  household: Household,
): boolean {
  const key = email.toLowerCase()
  const uid = household.memberUidByEmail?.[key]
  return Boolean(uid && household.memberUids.includes(uid))
}

export function householdMemberName(
  email: string,
  household: Household,
  profile: UserProfile,
): string {
  const key = email.toLowerCase()
  if (key === profile.email.toLowerCase()) {
    return profile.displayName || profile.firstName || 'Tú'
  }
  const stored = household.memberNamesByEmail?.[key]?.trim()
  if (stored) return stored
  return formatEmailAsName(email)
}

export function householdMemberStatus(
  email: string,
  household: Household,
  profile: UserProfile,
): 'self' | 'active' | 'pending' {
  if (email.toLowerCase() === profile.email.toLowerCase()) return 'self'
  return isHouseholdMemberActive(email, household) ? 'active' : 'pending'
}
