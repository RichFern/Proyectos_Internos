import type { Space } from '../types'

export const DEFAULT_PAYMENT_METHODS = [
  'Débito',
  'Crédito',
  'Transferencia',
  'Efectivo',
] as const

export const OTHER_PAYMENT_METHOD = 'Otro'

export function allPaymentMethods(
  space?: Pick<Space, 'paymentMethods'> | null,
): string[] {
  const extras = (space?.paymentMethods ?? []).filter(
    (item) =>
      item.trim() &&
      item !== OTHER_PAYMENT_METHOD &&
      !DEFAULT_PAYMENT_METHODS.includes(item as (typeof DEFAULT_PAYMENT_METHODS)[number]),
  )
  return [...DEFAULT_PAYMENT_METHODS, ...extras, OTHER_PAYMENT_METHOD]
}

export function addPaymentMethod(
  current: Space['paymentMethods'],
  rawLabel: string,
): { label: string; next: string[] } | null {
  const label = rawLabel.trim()
  if (!label || label === OTHER_PAYMENT_METHOD) return null
  const list = current ?? []
  if (
    DEFAULT_PAYMENT_METHODS.includes(label as (typeof DEFAULT_PAYMENT_METHODS)[number]) ||
    list.some((item) => item.toLowerCase() === label.toLowerCase())
  ) {
    return { label, next: list }
  }
  return { label, next: [...list, label] }
}
