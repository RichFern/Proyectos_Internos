import type { WishlistItem, WishlistQuote } from '../types'
import { formatMoneyAmount, spaceCurrency } from './currency'

export function bestQuote(item: WishlistItem): WishlistQuote | null {
  if (!item.quotes.length) return null
  if (
    item.bestQuoteIndex != null &&
    item.quotes[item.bestQuoteIndex]
  ) {
    return item.quotes[item.bestQuoteIndex]
  }
  return [...item.quotes].sort((a, b) => a.price - b.price)[0] ?? null
}

export function formatQuotePrice(
  quote: WishlistQuote,
  space?: { currency?: string } | null,
): string {
  const currency = quote.currency || spaceCurrency(space)
  return formatMoneyAmount(quote.price, currency)
}

export function wishlistStatusLabel(status: WishlistItem['status']): string {
  if (status === 'ready') return 'Lista para comprar'
  if (status === 'bought') return 'Comprada'
  return 'En cotización'
}

export function wishlistPriorityLabel(priority: WishlistItem['priority']): string {
  if (priority === 'high') return 'Alta'
  if (priority === 'low') return 'Baja'
  return 'Media'
}

export function wishlistSummary(items: WishlistItem[]): {
  total: number
  research: number
  ready: number
  bought: number
} {
  return {
    total: items.length,
    research: items.filter((item) => item.status === 'research').length,
    ready: items.filter((item) => item.status === 'ready').length,
    bought: items.filter((item) => item.status === 'bought').length,
  }
}
