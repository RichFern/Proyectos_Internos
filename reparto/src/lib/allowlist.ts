/** Emails que pueden usar la app mientras los planes no están a la venta. */

function parseEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

/** Junta lista de acceso + admins. Un admin siempre puede entrar e invitarse. */
export function mergeAccessEmails(
  allowedRaw?: string,
  adminRaw?: string,
): string[] {
  return [...new Set([...parseEmails(allowedRaw), ...parseEmails(adminRaw)])]
}

export function accessEmails(): string[] {
  const viteEnvMissing = typeof import.meta.env === 'undefined'
  return mergeAccessEmails(
    viteEnvMissing ? undefined : import.meta.env.VITE_ALLOWED_EMAILS,
    viteEnvMissing ? undefined : import.meta.env.VITE_ADMIN_EMAILS,
  )
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  const list = accessEmails()
  if (list.length === 0) {
    const production =
      typeof import.meta.env !== 'undefined' && import.meta.env.PROD
    return !production
  }
  return list.includes(email.trim().toLowerCase())
}
