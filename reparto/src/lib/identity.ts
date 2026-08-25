export interface LocalIdentity {
  name: string
  email?: string
}

const IDENTITY_KEY = 'reparto-identity-v1'

export function identityKeyFrom(
  googleEmail?: string | null,
  local?: LocalIdentity | null,
): string | null {
  if (googleEmail?.trim()) return googleEmail.trim().toLowerCase()
  if (local?.email?.trim()) return local.email.trim().toLowerCase()
  if (local?.name?.trim()) return `local:${local.name.trim().toLowerCase()}`
  return null
}

export function loadLocalIdentity(): LocalIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalIdentity
  } catch {
    return null
  }
}

export function saveLocalIdentity(identity: LocalIdentity): void {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
}

export function canAccessSpace(
  space: { visibility?: string; ownerKey?: string | null },
  myKey: string | null,
): boolean {
  if (space.visibility !== 'personal') return true
  if (!myKey || !space.ownerKey) return false
  return space.ownerKey === myKey
}
