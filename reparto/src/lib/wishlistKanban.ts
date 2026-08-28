import type { WishlistItem } from '../types'

export type WishlistKanbanColumn = 'ideas' | 'evaluating' | 'bought'

export function wishlistKanbanColumn(item: WishlistItem): WishlistKanbanColumn {
  if (item.status === 'bought') return 'bought'
  if (item.status === 'ready' || item.quotes.length > 0) return 'evaluating'
  return 'ideas'
}

export function isQuoteOnSale(quote: { price: number; listPrice?: number }): boolean {
  if (!quote.listPrice || quote.listPrice <= quote.price) return false
  const discount = (quote.listPrice - quote.price) / quote.listPrice
  return discount >= 0.08
}

export function quoteApprovalCount(
  quote: { approvedByMemberIds?: string[] },
  memberCount: number,
): { approved: number; total: number; allApproved: boolean } {
  const approved = quote.approvedByMemberIds?.length ?? 0
  return {
    approved,
    total: memberCount,
    allApproved: memberCount > 0 && approved >= memberCount,
  }
}

export const KANBAN_LABELS: Record<WishlistKanbanColumn, string> = {
  ideas: 'Ideas / Wishlist',
  evaluating: 'En evaluación',
  bought: 'Decidido / Comprado',
}
