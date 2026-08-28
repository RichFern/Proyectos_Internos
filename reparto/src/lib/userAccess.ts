import type { User } from 'firebase/auth'
import { isEmailAllowed } from './allowlist'
import { loadHousehold, listUserHouseholds } from './cloud'
import { peekPendingJoin } from './joinInvite'

/** Acceso beta por lista, o por invitación activa a un hogar. */
export async function verifyUserAccess(user: User): Promise<boolean> {
  const email = user.email?.trim().toLowerCase()
  if (!email) return false
  if (isEmailAllowed(email)) return true

  try {
    const households = await listUserHouseholds(user.uid, email)
    if (households.length > 0) return true

    const joinId = peekPendingJoin(sessionStorage, localStorage)
    if (joinId) {
      const invited = await loadHousehold(joinId)
      if (invited?.memberEmails.some((item) => item.toLowerCase() === email)) {
        return true
      }
    }
  } catch {
    return false
  }
  return false
}
