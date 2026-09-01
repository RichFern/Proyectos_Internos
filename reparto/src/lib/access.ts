const ACCESS_KEY = 'reparto-access-v1'
const SESSION_KEY = 'reparto-unlocked-v1'

export interface AccessConfig {
  /** Hash SHA-256 del PIN + salt */
  pinHash: string
  salt: string
  /** Quiénes pueden usar la app (texto libre, p.ej. emails) */
  allowedPeople: string
  updatedAt: string
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return toHex(bytes.buffer)
}

export function loadAccessConfig(): AccessConfig | null {
  try {
    const raw = localStorage.getItem(ACCESS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AccessConfig
  } catch {
    return null
  }
}

export function saveAccessConfig(config: AccessConfig): void {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(config))
}

export function clearAccessConfig(): void {
  localStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export async function setPin(
  pin: string,
  allowedPeople: string,
): Promise<AccessConfig> {
  const salt = randomSalt()
  const pinHash = await hashPin(pin, salt)
  const config: AccessConfig = {
    pinHash,
    salt,
    allowedPeople: allowedPeople.trim(),
    updatedAt: new Date().toISOString(),
  }
  saveAccessConfig(config)
  markUnlocked()
  return config
}

export async function verifyPin(pin: string): Promise<boolean> {
  const config = loadAccessConfig()
  if (!config) return true
  const hash = await hashPin(pin, config.salt)
  return hash === config.pinHash
}

export function isUnlocked(): boolean {
  const config = loadAccessConfig()
  if (!config) return true
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function markUnlocked(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function lockApp(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function hasPinProtection(): boolean {
  return Boolean(loadAccessConfig())
}
