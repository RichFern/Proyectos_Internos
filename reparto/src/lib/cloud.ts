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
  arrayRemove,
  arrayUnion,
  collection,
  addDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseConfig, isCloudConfigured } from './cloudConfig'
import type {
  AppData,
  Household,
  HouseholdRole,
  Space,
  UserProfile,
} from '../types'
import { createId } from './id'

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
      message: 'Falta configurar Firebase.',
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

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const database = getCloudDb()
  if (!database) return null
  const snap = await getDoc(doc(database, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  await setDoc(doc(database, 'users', profile.uid), clean(profile), { merge: true })
}

export async function listUserHouseholds(
  uid: string,
  email: string,
): Promise<Household[]> {
  const database = getCloudDb()
  if (!database) return []
  const households = collection(database, 'households')
  const [byUid, byEmail] = await Promise.all([
    getDocs(query(households, where('memberUids', 'array-contains', uid))),
    getDocs(
      query(
        households,
        where('memberEmails', 'array-contains', email.toLowerCase()),
      ),
    ),
  ])
  const merged = new Map<string, Household>()
  for (const snap of [...byUid.docs, ...byEmail.docs]) {
    merged.set(snap.id, { id: snap.id, ...(snap.data() as Omit<Household, 'id'>) })
  }
  return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createHousehold(
  uid: string,
  email: string,
  name: string,
): Promise<Household> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  const now = new Date().toISOString()
  const id = createId()
  const household: Household = {
    id,
    name: name.trim() || 'Mi hogar',
    ownerUid: uid,
    memberUids: [uid],
    memberEmails: [email.toLowerCase()],
    memberUidByEmail: { [email.toLowerCase()]: uid },
    memberNamesByEmail: {},
    roles: { [uid]: 'owner' },
    planTier: 'family',
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(doc(database, 'households', id), clean(household))
  return household
}

export async function loadHousehold(id: string): Promise<Household | null> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  const snap = await getDoc(doc(database, 'households', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Household, 'id'>) }
}

export async function joinInvitedHousehold(
  household: Household,
  uid: string,
  email?: string,
  displayName?: string,
): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  const emailKey = email?.trim().toLowerCase()
  const alreadyMember = household.memberUids.includes(uid)
  const mappedUid = emailKey ? household.memberUidByEmail?.[emailKey] : undefined
  const mappedName = emailKey ? household.memberNamesByEmail?.[emailKey] : undefined
  const needsUid = !alreadyMember
  const needsUidMap = Boolean(emailKey && mappedUid !== uid)
  const needsName = Boolean(emailKey && displayName && mappedName !== displayName)
  if (!needsUid && !needsUidMap && !needsName) return

  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }
  if (needsUid) {
    patch.memberUids = arrayUnion(uid)
    patch[`roles.${uid}`] = 'member' satisfies HouseholdRole
  }
  if (emailKey && (needsUidMap || needsUid)) {
    patch[`memberUidByEmail.${emailKey}`] = uid
  }
  if (emailKey && displayName && needsName) {
    patch[`memberNamesByEmail.${emailKey}`] = displayName
  }
  await updateDoc(doc(database, 'households', household.id), patch)
}

export async function inviteHouseholdMember(
  householdId: string,
  email: string,
): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  await updateDoc(doc(database, 'households', householdId), {
    memberEmails: arrayUnion(email.trim().toLowerCase()),
    updatedAt: new Date().toISOString(),
  })
}

export async function queueInviteEmail(input: {
  to: string
  householdName: string
  inviteLink: string
  inviterName?: string
}): Promise<boolean> {
  const database = getCloudDb()
  if (!database) return false
  const to = input.to.trim().toLowerCase()
  if (!to) return false
  const inviter = input.inviterName?.trim() || 'Alguien de tu familia'
  const text = `${inviter} te invita a unirte al hogar "${input.householdName}" en A la PaR.\n\nEntrá con este enlace (usá el mismo Gmail que te autorizaron):\n${input.inviteLink}`
  const html = `<p>${inviter} te invita a unirte al hogar <strong>${input.householdName}</strong> en A la PaR.</p><p><a href="${input.inviteLink}">Entrar a A la PaR</a></p><p>Usá la misma cuenta Google que te autorizaron en el hogar.</p>`
  try {
    await addDoc(collection(database, 'mail'), {
      to: [to],
      message: {
        subject: `Invitación a ${input.householdName} · A la PaR`,
        text,
        html,
      },
    })
    return true
  } catch {
    return false
  }
}

export async function updateHousehold(
  householdId: string,
  patch: Partial<Pick<Household, 'name' | 'planTier'>>,
): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  await updateDoc(doc(database, 'households', householdId), {
    ...clean(patch),
    updatedAt: new Date().toISOString(),
  })
}

export async function removeHouseholdMember(
  householdId: string,
  uid: string | null,
  email: string,
): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  const patch: Record<string, unknown> = {
    memberEmails: arrayRemove(email.toLowerCase()),
    updatedAt: new Date().toISOString(),
  }
  if (uid) patch.memberUids = arrayRemove(uid)
  if (uid) patch[`roles.${uid}`] = deleteField()
  patch[`memberUidByEmail.${email.toLowerCase()}`] = deleteField()
  patch[`memberNamesByEmail.${email.toLowerCase()}`] = deleteField()
  await updateDoc(doc(database, 'households', householdId), patch)
}

interface PrivateCloudData {
  activeSpaceId: string | null
  personalSpaces: Space[]
  privateExpensesBySpace: Record<string, Space['expenses']>
  privateTemplatesBySpace: Record<string, Space['templates']>
  privateInstallmentsBySpace: Record<string, Space['installmentPlans']>
}

function partitionCloudData(
  data: AppData,
  uid: string,
): { shared: AppData; personal: PrivateCloudData } {
  const personalSpaces = data.spaces.filter(
    (space) => space.visibility === 'personal' && space.ownerUid === uid,
  )
  const sharedSpaces = data.spaces
    .filter((space) => space.visibility !== 'personal')
    .map((space) => ({
      ...space,
      expenses: space.expenses.filter((expense) => expense.visibility !== 'personal'),
      templates: space.templates.filter(
        (template) => template.visibility !== 'personal',
      ),
      installmentPlans: space.installmentPlans.filter(
        (plan) => plan.visibility !== 'personal',
      ),
    }))
  const privateExpensesBySpace: Record<string, Space['expenses']> = {}
  const privateTemplatesBySpace: Record<string, Space['templates']> = {}
  const privateInstallmentsBySpace: Record<
    string,
    Space['installmentPlans']
  > = {}
  for (const space of data.spaces.filter((s) => s.visibility !== 'personal')) {
    const own = space.expenses.filter(
      (expense) => expense.visibility === 'personal' && expense.ownerUid === uid,
    )
    if (own.length) privateExpensesBySpace[space.id] = own
    const ownTemplates = space.templates.filter(
      (template) =>
        template.visibility === 'personal' && template.ownerUid === uid,
    )
    if (ownTemplates.length) privateTemplatesBySpace[space.id] = ownTemplates
    const ownInstallments = space.installmentPlans.filter(
      (plan) => plan.visibility === 'personal' && plan.ownerUid === uid,
    )
    if (ownInstallments.length) {
      privateInstallmentsBySpace[space.id] = ownInstallments
    }
  }
  return {
    shared: { spaces: sharedSpaces, activeSpaceId: null },
    personal: {
      activeSpaceId: data.activeSpaceId,
      personalSpaces,
      privateExpensesBySpace,
      privateTemplatesBySpace,
      privateInstallmentsBySpace,
    },
  }
}

function mergeCloudData(
  shared: AppData | null,
  personal: PrivateCloudData | null,
): AppData | null {
  if (!shared && !personal) return null
  const spaces = (shared?.spaces ?? []).map((space) => ({
    ...space,
    expenses: [
      ...space.expenses,
      ...(personal?.privateExpensesBySpace?.[space.id] ?? []),
    ],
    templates: [
      ...space.templates,
      ...(personal?.privateTemplatesBySpace?.[space.id] ?? []),
    ],
    installmentPlans: [
      ...space.installmentPlans,
      ...(personal?.privateInstallmentsBySpace?.[space.id] ?? []),
    ],
  }))
  spaces.push(...(personal?.personalSpaces ?? []))
  return {
    spaces,
    activeSpaceId: personal?.activeSpaceId ?? spaces[0]?.id ?? null,
  }
}

function sharedStateRef(database: Firestore, householdId: string) {
  return doc(database, 'households', householdId, 'state', 'main')
}

function privateStateRef(
  database: Firestore,
  householdId: string,
  uid: string,
) {
  return doc(database, 'households', householdId, 'private', uid)
}

export async function loadCloudData(
  householdId: string,
  uid: string,
): Promise<AppData | null> {
  const database = getCloudDb()
  if (!database) return null
  const [sharedSnap, privateSnap] = await Promise.all([
    getDoc(sharedStateRef(database, householdId)),
    getDoc(privateStateRef(database, householdId, uid)),
  ])
  const shared = sharedSnap.exists()
    ? ((sharedSnap.data() as { data?: AppData }).data ?? null)
    : null
  const personal = privateSnap.exists()
    ? ((privateSnap.data() as { data?: PrivateCloudData }).data ?? null)
    : null
  return mergeCloudData(shared, personal)
}

export async function saveCloudData(
  data: AppData,
  uid: string,
  householdId: string,
): Promise<void> {
  const database = getCloudDb()
  if (!database) throw new Error('Firestore no disponible')
  const partitioned = partitionCloudData(data, uid)
  const stamp = { updatedAt: new Date().toISOString(), updatedBy: uid }
  await Promise.all([
    setDoc(
      sharedStateRef(database, householdId),
      clean({ data: partitioned.shared, ...stamp }),
      { merge: true },
    ),
    setDoc(
      privateStateRef(database, householdId, uid),
      clean({ data: partitioned.personal, ...stamp }),
      { merge: true },
    ),
  ])
}

export function watchCloudData(
  householdId: string,
  uid: string,
  cb: (data: AppData | null) => void,
): () => void {
  const database = getCloudDb()
  if (!database) {
    cb(null)
    return () => {}
  }
  let shared: AppData | null = null
  let personal: PrivateCloudData | null = null
  let sharedReady = false
  let personalReady = false
  const emit = () => {
    if (sharedReady && personalReady) cb(mergeCloudData(shared, personal))
  }
  const unsubscribeShared = onSnapshot(
    sharedStateRef(database, householdId),
    (snap) => {
      shared = snap.exists()
        ? ((snap.data() as { data?: AppData }).data ?? null)
        : null
      sharedReady = true
      emit()
    },
    () => cb(null),
  )
  const unsubscribePrivate = onSnapshot(
    privateStateRef(database, householdId, uid),
    (snap) => {
      personal = snap.exists()
        ? ((snap.data() as { data?: PrivateCloudData }).data ?? null)
        : null
      personalReady = true
      emit()
    },
    () => cb(null),
  )
  return () => {
    unsubscribeShared()
    unsubscribePrivate()
  }
}
