import {
  DEFAULT_CURRENCY,
  expenseCurrency,
  formatMoneyAmount,
  spaceCurrency,
} from './currency'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(spaceCurrency(null) === DEFAULT_CURRENCY, 'default space currency')
assert(spaceCurrency({ currency: 'usd' }) === 'USD', 'normalizes currency code')
assert(
  expenseCurrency({ currency: 'EUR' }, { currency: 'ARS' }) === 'EUR',
  'expense currency wins',
)
assert(
  expenseCurrency({}, { currency: 'BRL' }) === 'BRL',
  'falls back to space currency',
)

const ars = formatMoneyAmount(12500, 'ARS')
assert(ars.includes('12'), 'formats thousands in ARS')
assert(formatMoneyAmount(-50, 'USD').startsWith('-'), 'negative amounts')

console.log('currency.test.ts OK')
