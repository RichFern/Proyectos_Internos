export function cloudErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message.trim()) {
    const msg = cause.message
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return 'Sin permiso en la nube. Si te invitaron, pide que reenvíen el enlace y que desplieguen las reglas de Firebase.'
    }
    return msg
  }
  if (typeof cause === 'object' && cause && 'code' in cause) {
    const code = String((cause as { code?: string }).code ?? '')
    if (code === 'permission-denied') {
      return 'Sin permiso en la nube. Si te invitaron, pide que reenvíen el enlace y que desplieguen las reglas de Firebase.'
    }
    if (code === 'unavailable') {
      return 'No hay conexión con la nube. Revisa tu internet e inténtalo de nuevo.'
    }
  }
  return fallback
}
