const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const currencyExact = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percent = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatMoney(n: number, exact = false): string {
  return (exact ? currencyExact : currency).format(n)
}

export function formatPercent(n: number): string {
  return percent.format(n)
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')))
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
