/** Configuración pública de Firebase (las reglas protegen los datos). */

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

export function isCloudConfigured(): boolean {
  return Boolean(getFirebaseConfig())
}
