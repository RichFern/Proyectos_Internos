import type { Household } from '../types'
import { peekPendingJoin, readJoinIdFromSearch } from './joinInvite'

export function pendingJoinId(
  search = typeof window !== 'undefined' ? window.location.search : '',
): string | null {
  return peekPendingJoin(sessionStorage, localStorage) || readJoinIdFromSearch(search)
}

export function resolveInvitedHousehold(
  households: Household[],
  email: string,
  search = typeof window !== 'undefined' ? window.location.search : '',
): Household | null {
  const normalized = email.trim().toLowerCase()
  const joinId = pendingJoinId(search)
  if (joinId) {
    const byId = households.find((household) => household.id === joinId)
    if (byId) return byId
  }
  return (
    households.find((household) =>
      household.memberEmails.some((item) => item.toLowerCase() === normalized),
    ) ?? null
  )
}

export function isJoiningHousehold(
  households: Household[],
  email: string,
  search = typeof window !== 'undefined' ? window.location.search : '',
): boolean {
  return Boolean(resolveInvitedHousehold(households, email, search))
}
