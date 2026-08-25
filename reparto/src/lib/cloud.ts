import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import {
  getFirebaseConfig,
  HOUSEHOLD_DOC_PATH,
  isCloudConfigured,
  isEmailAllowed,
} from './cloudConfig'
import type { AppData } from '../types'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let initTried = false

export type CloudInitResult =
  | { ok: true; auth: Auth; db: Firestore }
  | { ok: false; reason: 'not_configured' | 'init_error'; message: string }

export function initCloud(): CloudInitResult {
  if (!isCloudConfigured()) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Falta configurar Firebase y los emails permitidos.',
    }
  }
  if (auth && db) return { ok: true, auth, db }

  try {
    const config = getFirebaseConfig()!
    if (!app) app = initializeApp(config)
    auth = getAuth(app)
    db = getFirestore(app)
    initTried = true
    void setPersistence(auth, browserLocalPersistence)
    return { ok: true, auth, db }
  } catch (e) {
    initTried = true
    return {
      ok: false,
      reason: 'init_error',
      message: e instanceof Error ? e.message : 'No se pudo iniciar Firebase',
    }
  }
}

export function getCloudAuth(): Auth | null {
  if (!initTried) initCloud()
  return auth
}

export function getCloudDb(): Firestore | null {
  if (!initTried) initCloud()
  return db
}

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle(): Promise<User> {
  const result = initCloud()
  if (!result.ok) throw new Error(result.message)
  const { auth: a } = result

  try {
    const cred = await signInWithPopup(a, provider)
    return cred.user
  } catch (e) {
    const code = (e as { code?: string }).code
    // Popups bloqueados (móvil / PWA): usar redirect
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(a, provider)
      throw new Error('redirect')
    }
    throw e
  }
}

export async function consumeGoogleRedirect(): Promise<User | null> {
  const result = initCloud()
  if (!result.ok) return null
  const cred = await getRedirectResult(result.auth)
  return cred?.user ?? null
}

export async function signOutCloud(): Promise<void> {
  const a = getCloudAuth()
  if (a) await signOut(a)
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  const result = initCloud()
  if (!result.ok) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(result.auth, cb)
}

export async function assertAllowedUser(user: User): Promise<void> {
  const email = user.email
  if (!isEmailAllowed(email)) {
    await signOutCloud()
    throw new Error(
      `La cuenta ${email ?? '(sin email)'} no está autorizada. Solo entran los emails configurados por el dueño de la app.`,
    )
  }
}

function householdRef(database: Firestore) {
  return doc(database, HOUSEHOLD_DOC_PATH.collection, HOUSEHOLD_DOC_PATH.docId)
}

export async function loadCloudData(): Promise<AppData | null> {
  const database = getCloudDb()
  if (!database) return null
  const snap = await getDoc(householdRef(database))
  if (!snap.exists()) return null
  const raw = snap.data() as { data?: AppData }
  return raw.data ?? null
}

export async function saveCloudData(data: AppData, uid: string): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  await setDoc(
    householdRef(database),
    {
      data,
      updatedAt: new Date().toISOString(),
      updatedBy: uid,
    },
    { merge: true },
  )
}

export function watchCloudData(
  cb: (data: AppData | null) => void,
): () => void {
  const database = getCloudDb()
  if (!database) {
    cb(null)
    return () => {}
  }
  return onSnapshot(
    householdRef(database),
    (snap) => {
      if (!snap.exists()) {
        cb(null)
        return
      }
      const raw = snap.data() as { data?: AppData }
      cb(raw.data ?? null)
    },
    () => cb(null),
  )
}
