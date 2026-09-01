import { bestQuote, wishlistStatusLabel } from './wishlist'
import type { WishlistItem } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const item: WishlistItem = {
  id: 'w1',
  title: 'Heladera',
  status: 'research',
  quotes: [
    { store: 'Tienda A', price: 500000, updatedAt: '' },
    { store: 'Tienda B', price: 450000, updatedAt: '' },
  ],
  createdAt: '',
  updatedAt: '',
}

assert(bestQuote(item)?.store === 'Tienda B', 'picks cheapest quote')

const picked: WishlistItem = {
  ...item,
  bestQuoteIndex: 0,
}
assert(bestQuote(picked)?.store === 'Tienda A', 'respects manual pick')
assert(wishlistStatusLabel('ready') === 'Lista para comprar', 'status labels')

console.log('wishlist.test.ts OK')
