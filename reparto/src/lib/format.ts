const percent = new Intl.NumberFormat('es', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const dateFmt = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const monthFmt = new Intl.DateTimeFormat('es', {
  month: 'long',
  year: 'numeric',
})

const monthShortFmt = new Intl.DateTimeFormat('es', {
  month: 'short',
  year: 'numeric',
})

const monthNameFmt = new Intl.DateTimeFormat('es', {
  month: 'long',
})

import { DEFAULT_CURRENCY, formatMoneyAmount } from './currency'

export function formatMoney(
  n: number,
  withCents = false,
  currency = DEFAULT_CURRENCY,
): string {
  return formatMoneyAmount(n, currency, withCents)
}

export function formatPercent(n: number): string {
  return percent.format(n)
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')))
}

export function formatMonth(ym: string): string {
  const label = monthFmt.format(new Date(`${ym}-01T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMonthShort(ym: string): string {
  const label = monthShortFmt.format(new Date(`${ym}-01T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
}

export function formatMonthName(ym: string): string {
  const label = monthNameFmt.format(new Date(`${ym}-01T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function currentMonth(date = new Date()): string {
  return todayISO(date).slice(0, 7)
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Mes al que imputa un gasto: mes contable o, si no hay, el de la fecha */
export function expenseMonth(expense: {
  date: string
  accountingMonth?: string
}): string {
  const key = expense.accountingMonth || monthKey(expense.date)
  return key.length >= 7 ? key.slice(0, 7) : monthKey(expense.date)
}

export function dateInShiftedMonth(isoDate: string, deltaMonths: number): string {
  const day = Number(isoDate.slice(8, 10) || '1')
  const next = shiftMonth(monthKey(isoDate), deltaMonths)
  const last = new Date(
    Number(next.slice(0, 4)),
    Number(next.slice(5, 7)),
    0,
  ).getDate()
  return `${next}-${String(Math.min(day, last)).padStart(2, '0')}`
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}`
}

/** Primer día del mes como fecha ISO */
export function monthStartISO(ym: string): string {
  return `${ym}-01`
}

/** Acepta 5000, 5.000, 5000,50 o 5,5 */
export function parseAmount(raw: string): number {
  const t = raw.trim().replace(/\s/g, '')
  if (!t) return Number.NaN
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ''))
  if (t.includes(',') && t.includes('.')) {
    const lastComma = t.lastIndexOf(',')
    const lastDot = t.lastIndexOf('.')
    if (lastComma > lastDot) {
      return Number(t.replace(/\./g, '').replace(',', '.'))
    }
    return Number(t.replace(/,/g, ''))
  }
  if (t.includes(',')) return Number(t.replace(',', '.'))
  return Number(t)
}
