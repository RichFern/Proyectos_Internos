import {
  DEFAULT_CURRENCY,
  expenseCurrency,
  formatMoneyAmount,
  spaceCurrency,
} from './currency'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(spaceCurrency(null) === DEFAULT_CURRENCY, 'default space currency is CLP')
assert(spaceCurrency({ currency: 'usd' }) === 'USD', 'normalizes currency code')
assert(
  expenseCurrency({ currency: 'EUR' }, { currency: 'CLP' }) === 'EUR',
  'expense currency wins',
)

const clp = formatMoneyAmount(12500, 'CLP')
assert(clp.includes('12'), 'formats thousands in CLP')

console.log('currency.test.ts OK')
