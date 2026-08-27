export const JOIN_STORAGE_KEY = 'alapar.pending-join'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function readJoinIdFromSearch(search: string): string | null {
  const value = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
    .get('join')
    ?.trim()
  return value || null
}

export function peekPendingJoin(
  session: StorageLike | null,
  local: StorageLike | null = session,
): string | null {
  return session?.getItem(JOIN_STORAGE_KEY) || local?.getItem(JOIN_STORAGE_KEY) || null
}

export function storePendingJoin(
  id: string,
  session: StorageLike,
  local: StorageLike = session,
): void {
  session.setItem(JOIN_STORAGE_KEY, id)
  local.setItem(JOIN_STORAGE_KEY, id)
}

export function consumePendingJoin(
  session: StorageLike,
  local: StorageLike = session,
): string | null {
  const id = peekPendingJoin(session, local)
  session.removeItem(JOIN_STORAGE_KEY)
  local.removeItem(JOIN_STORAGE_KEY)
  return id
}

/** Guarda ?join= y limpia la URL para que sobreviva el onboarding. */
export function captureJoinFromWindow(
  locationSearch: string,
  session: StorageLike,
  local: StorageLike,
  replacePath: (path: string) => void,
  pathname: string,
): string | null {
  const fromUrl = readJoinIdFromSearch(locationSearch)
  if (fromUrl) {
    storePendingJoin(fromUrl, session, local)
    replacePath(pathname)
  }
  return peekPendingJoin(session, local)
}
