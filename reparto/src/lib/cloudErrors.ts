export function cloudErrorMessage(cause: unknown, fallback: string): string {
  const raw =
    cause instanceof Error
      ? cause.message
      : typeof cause === 'object' &&
          cause &&
          'message' in cause &&
          typeof (cause as { message?: unknown }).message === 'string'
        ? String((cause as { message: string }).message)
        : ''

  if (raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions')) {
    return 'Sin permiso en la nube. Si te invitaron: (1) que agreguen tu Gmail exacto, (2) que desplieguen las reglas de Firebase, (3) que reenvíen el enlace.'
  }
  if (raw.trim()) return raw

  if (typeof cause === 'object' && cause && 'code' in cause) {
    const code = String((cause as { code?: string }).code ?? '')
    if (code === 'permission-denied') {
      return 'Sin permiso en la nube. Si te invitaron: (1) que agreguen tu Gmail exacto, (2) que desplieguen las reglas de Firebase, (3) que reenvíen el enlace.'
    }
    if (code === 'unavailable') {
      return 'No hay conexión con la nube. Revisa tu internet e inténtalo de nuevo.'
    }
  }
  return fallback
}
