import { DEFAULT_CURRENCY } from './currency'

const PREFS_KEY = 'reparto-prefs-v1'

export interface UserPreferences {
  defaultCurrency: string
  /** true cuando el usuario eligió moneda explícitamente */
  currencyConfigured: boolean
}

const FALLBACK: UserPreferences = {
  defaultCurrency: DEFAULT_CURRENCY,
  currencyConfigured: false,
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...FALLBACK }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    const code = parsed.defaultCurrency?.trim().toUpperCase() || DEFAULT_CURRENCY
    return {
      defaultCurrency: code,
      currencyConfigured: Boolean(parsed.currencyConfigured),
    }
  } catch {
    return { ...FALLBACK }
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      defaultCurrency: prefs.defaultCurrency.trim().toUpperCase(),
      currencyConfigured: prefs.currencyConfigured,
    }),
  )
}

export function setDefaultCurrency(code: string): void {
  saveUserPreferences({
    defaultCurrency: code.trim().toUpperCase(),
    currencyConfigured: true,
  })
}

export function isCurrencyConfigured(): boolean {
  return loadUserPreferences().currencyConfigured
}

export function resolveDefaultCurrency(sources?: {
  profileCurrency?: string | null
  localCurrency?: string | null
}): string {
  const prefs = loadUserPreferences()
  if (prefs.currencyConfigured) return prefs.defaultCurrency
  const fromProfile = sources?.profileCurrency?.trim().toUpperCase()
  if (fromProfile) return fromProfile
  const fromLocal = sources?.localCurrency?.trim().toUpperCase()
  if (fromLocal) return fromLocal
  return DEFAULT_CURRENCY
}
