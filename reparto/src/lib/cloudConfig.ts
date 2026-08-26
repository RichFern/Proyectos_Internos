/** Configuración pública de Firebase (las reglas protegen los datos). */

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function read(value: string | undefined): string {
  return value?.trim() ?? ''
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const viteEnvMissing = typeof import.meta.env === 'undefined'
  // Cada clave tiene que aparecer escrita entera: Vite no inyecta import.meta.env[nombre].
  const config: FirebaseWebConfig = {
    apiKey: read(
      viteEnvMissing ? undefined : import.meta.env.VITE_FIREBASE_API_KEY,
    ),
    authDomain: read(
      viteEnvMissing ? undefined : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    ),
    projectId: read(
      viteEnvMissing ? undefined : import.meta.env.VITE_FIREBASE_PROJECT_ID,
    ),
    storageBucket: read(
      viteEnvMissing ? undefined : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    ),
    messagingSenderId: read(
      viteEnvMissing
        ? undefined
        : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: read(
      viteEnvMissing ? undefined : import.meta.env.VITE_FIREBASE_APP_ID,
    ),
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
