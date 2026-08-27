import { resolveDefaultCurrency } from './userPreferences'
import { DEFAULT_CURRENCY } from './currency'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(resolveDefaultCurrency() === DEFAULT_CURRENCY, 'default currency fallback')
assert(
  resolveDefaultCurrency({ profileCurrency: 'eur' }) === 'EUR',
  'profile currency',
)
assert(
  resolveDefaultCurrency({ localCurrency: 'usd' }) === 'USD',
  'local currency',
)

console.log('userPreferences.test.ts OK')
