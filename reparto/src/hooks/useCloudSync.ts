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
 *
 * Importante: el watcher no se re-suscribe cuando cambia el snapshot local.
 * Si se re-suscribe, Firestore devuelve el estado viejo y pisa el espacio
 * activo, los gastos nuevos y las personas recién cargadas.
 */
export function useCloudSync(
  enabled: boolean,
  uid: string | null,
  householdId: string | null,
  store: StoreLike,
  syncRev: string,
) {
  const skipSnapshot = useRef(false)
  const bootstrapped = useRef(false)
  const lastWritten = useRef('')
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    bootstrapped.current = false
    lastWritten.current = ''
    skipSnapshot.current = false
  }, [householdId, uid])

  useEffect(() => {
    if (!enabled || !uid || !householdId || !store.ready || bootstrapped.current)
      return
    let cancelled = false

    void (async () => {
      try {
        const remote = await loadCloudData(householdId, uid)
        if (cancelled) return
        if (remote && remote.spaces) {
          skipSnapshot.current = true
          storeRef.current.replaceAllData(remote)
          lastWritten.current = JSON.stringify(remote)
        } else {
          const local = storeRef.current.getSnapshot()
          skipSnapshot.current = true
          await saveCloudData(local, uid, householdId)
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
  }, [enabled, uid, householdId, store.ready])

  useEffect(() => {
    if (!enabled || !uid || !householdId || !store.ready) return
    return watchCloudData(householdId, uid, (data) => {
      if (!data) return
      if (!bootstrapped.current) return
      if (skipSnapshot.current) {
        skipSnapshot.current = false
        return
      }
      const serialized = JSON.stringify(data)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      storeRef.current.replaceAllData(data)
    })
  }, [enabled, uid, householdId, store.ready])

  useEffect(() => {
    if (!enabled || !uid || !householdId || !store.ready) return
    if (!bootstrapped.current) return

    const handle = window.setTimeout(() => {
      const snap = storeRef.current.getSnapshot()
      const serialized = JSON.stringify(snap)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      saveData(snap)
      skipSnapshot.current = true
      void saveCloudData(snap, uid, householdId).catch((e) => {
        console.error('Error al guardar en la nube', e)
        skipSnapshot.current = false
      })
    }, 400)

    return () => window.clearTimeout(handle)
  }, [enabled, uid, householdId, store.ready, syncRev])
}
