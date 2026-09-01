export const DEFAULT_CURRENCY = 'CLP'

export const COMMON_CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: 'CLP', label: 'Peso chileno', symbol: '$' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$' },
]

export function currencyLabel(code: string): string {
  return COMMON_CURRENCIES.find((item) => item.code === code)?.label ?? code
}

export function spaceCurrency(space?: { currency?: string } | null): string {
  return space?.currency?.trim().toUpperCase() || DEFAULT_CURRENCY
}

export function expenseCurrency(
  expense: { currency?: string },
  space?: { currency?: string } | null,
): string {
  return expense.currency?.trim().toUpperCase() || spaceCurrency(space)
}

const formatters = new Map<string, Intl.NumberFormat>()

function localeFor(currency: string): string {
  return currency === 'CLP' ? 'es-CL' : 'es'
}

function formatter(currency: string, withCents: boolean): Intl.NumberFormat {
  const key = `${currency}:${withCents ? '2' : '0'}`
  let cached = formatters.get(key)
  if (!cached) {
    cached = new Intl.NumberFormat(localeFor(currency), {
      style: 'currency',
      currency: currency.length === 3 ? currency : DEFAULT_CURRENCY,
      minimumFractionDigits: withCents ? 2 : 0,
      maximumFractionDigits: withCents ? 2 : 0,
    })
    formatters.set(key, cached)
  }
  return cached
}

export function formatMoneyAmount(
  amount: number,
  currency = DEFAULT_CURRENCY,
  withCents = false,
): string {
  const code = currency.toUpperCase()
  try {
    const formatted = formatter(code, withCents).format(Math.abs(amount))
    return amount < 0 ? `-${formatted}` : formatted
  } catch {
    const rounded = withCents ? amount.toFixed(2) : String(Math.round(amount))
    return `${code} ${rounded}`
  }
}
