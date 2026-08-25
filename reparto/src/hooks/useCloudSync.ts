import { useEffect, useRef } from 'react'
import type { AppData } from '../types'
import { loadCloudData, saveCloudData, watchCloudData } from '../lib/cloud'
import { saveData } from '../lib/storage'

interface StoreLike {
  ready: boolean
  replaceAllData: (data: AppData) => void
  getSnapshot: () => AppData
}

/**
 * Sincroniza el hogar con Firestore cuando hay sesión Google.
 * - Si la nube está vacía, sube lo local.
 * - Si hay datos en la nube, los aplica.
 * - Escucha cambios en tiempo real (el otro teléfono).
 */
export function useCloudSync(
  enabled: boolean,
  uid: string | null,
  store: StoreLike,
) {
  const skipSnapshot = useRef(false)
  const bootstrapped = useRef(false)
  const lastWritten = useRef('')

  // Bootstrap inicial
  useEffect(() => {
    if (!enabled || !uid || !store.ready || bootstrapped.current) return
    let cancelled = false

    void (async () => {
      try {
        const remote = await loadCloudData()
        if (cancelled) return
        if (remote && remote.spaces) {
          skipSnapshot.current = true
          store.replaceAllData(remote)
          lastWritten.current = JSON.stringify(remote)
        } else {
          const local = store.getSnapshot()
          skipSnapshot.current = true
          await saveCloudData(local, uid)
          lastWritten.current = JSON.stringify(local)
        }
        bootstrapped.current = true
      } catch (e) {
        console.error('No se pudo sincronizar con la nube', e)
        bootstrapped.current = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, uid, store])

  // Escucha remota
  useEffect(() => {
    if (!enabled || !uid || !store.ready) return
    return watchCloudData((data) => {
      if (!data) return
      if (skipSnapshot.current) {
        skipSnapshot.current = false
        return
      }
      const serialized = JSON.stringify(data)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      store.replaceAllData(data)
    })
  }, [enabled, uid, store])

  // Guardar cambios locales → nube (+ caché local ya lo hace el store)
  useEffect(() => {
    if (!enabled || !uid || !store.ready || !bootstrapped.current) return

    const handle = window.setTimeout(() => {
      const snap = store.getSnapshot()
      const serialized = JSON.stringify(snap)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      saveData(snap)
      skipSnapshot.current = true
      void saveCloudData(snap, uid).catch((e) => {
        console.error('Error al guardar en la nube', e)
        skipSnapshot.current = false
      })
    }, 600)

    return () => window.clearTimeout(handle)
  }, [enabled, uid, store, store.getSnapshot])
}
