/** Emails de operador de A la PaR (vos), no de cada hogar. */

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function isPlatformAdminEmail(
  email: string | null | undefined,
  allowed: string[],
): boolean {
  if (!email) return false
  return allowed.includes(email.trim().toLowerCase())
}

export function platformAdminEmails(): string[] {
  return parseAdminEmails(import.meta.env.VITE_ADMIN_EMAILS)
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  return isPlatformAdminEmail(email, platformAdminEmails())
}
