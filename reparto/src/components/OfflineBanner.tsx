import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div className="offline-banner" role="status">
      Sin conexión. Puedes seguir viendo y editando; los cambios se sincronizarán al volver en línea.
    </div>
  )
}
