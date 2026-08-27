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
