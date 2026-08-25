/** Configuración de Firebase y lista de emails permitidos (desde variables de entorno). */

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function env(name: string): string {
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    return meta.env?.[name]?.trim() ?? ''
  } catch {
    return ''
  }
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const config: FirebaseWebConfig = {
    apiKey: env('VITE_FIREBASE_API_KEY'),
    authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: env('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('VITE_FIREBASE_APP_ID'),
  }
  const values = Object.values(config)
  if (values.some((v) => !v) || values.some((v) => v.includes('PEGAR_'))) {
    return null
  }
  return config
}

/** Emails autorizados, separados por coma. Ej: ana@gmail.com,luis@gmail.com */
export function getAllowedEmails(): string[] {
  const raw = env('VITE_ALLOWED_EMAILS')
  if (!raw) return []
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = getAllowedEmails()
  if (!allowed.length) return false
  return allowed.includes(email.trim().toLowerCase())
}

export function isCloudConfigured(): boolean {
  return Boolean(getFirebaseConfig() && getAllowedEmails().length > 0)
}

export const HOUSEHOLD_DOC_PATH = {
  collection: 'households',
  docId: 'main',
} as const
