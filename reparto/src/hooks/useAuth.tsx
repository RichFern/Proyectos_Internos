import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import { isCloudConfigured, getAllowedEmails } from '../lib/cloudConfig'
import {
  assertAllowedUser,
  consumeGoogleRedirect,
  initCloud,
  signInWithGoogle,
  signOutCloud,
  watchAuth,
} from '../lib/cloud'

export type AuthStatus =
  | 'local' // sin Firebase configurado
  | 'loading'
  | 'signed_out'
  | 'signed_in'
  | 'denied'
  | 'error'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  error: string | null
  cloudEnabled: boolean
  allowedEmails: string[]
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const cloudEnabled = isCloudConfigured()
  const allowedEmails = useMemo(() => getAllowedEmails(), [])
  const [status, setStatus] = useState<AuthStatus>(
    cloudEnabled ? 'loading' : 'local',
  )
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cloudEnabled) {
      setStatus('local')
      return
    }

    const init = initCloud()
    if (!init.ok) {
      setStatus('error')
      setError(init.message)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const redirected = await consumeGoogleRedirect()
        if (redirected && !cancelled) {
          await assertAllowedUser(redirected)
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('denied')
          setError(e instanceof Error ? e.message : 'Acceso denegado')
          setUser(null)
        }
      }
    })()

    const unsub = watchAuth(async (next) => {
      if (cancelled) return
      if (!next) {
        setUser(null)
        setStatus((s) => (s === 'denied' ? 'denied' : 'signed_out'))
        return
      }
      try {
        await assertAllowedUser(next)
        setUser(next)
        setError(null)
        setStatus('signed_in')
      } catch (e) {
        setUser(null)
        setStatus('denied')
        setError(e instanceof Error ? e.message : 'Acceso denegado')
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [cloudEnabled])

  const signIn = useCallback(async () => {
    setError(null)
    setStatus('loading')
    try {
      const u = await signInWithGoogle()
      await assertAllowedUser(u)
      setUser(u)
      setStatus('signed_in')
    } catch (e) {
      if (e instanceof Error && e.message === 'redirect') {
        // La página va a redirigir a Google
        setStatus('loading')
        return
      }
      setUser(null)
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar sesión'
      if (msg.includes('no está autorizada')) {
        setStatus('denied')
      } else {
        setStatus('signed_out')
      }
      setError(msg)
    }
  }, [])

  const signOut = useCallback(async () => {
    await signOutCloud()
    setUser(null)
    setStatus('signed_out')
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      cloudEnabled,
      allowedEmails,
      signIn,
      signOut,
    }),
    [status, user, error, cloudEnabled, allowedEmails, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
