import {
  monthShareText,
  personBalanceText,
  personDetailText,
  settlementNudgeText,
  settlementsShareText,
} from './export'
import type { Expense, Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const members = [
  { id: 'a', name: 'Patricia', income: 100, color: '#000', createdAt: '' },
  { id: 'b', name: 'Richard', income: 100, color: '#111', createdAt: '' },
]

const expense: Expense = {
  id: '1',
  description: 'Supermercado',
  amount: 200,
  category: 'comida',
  paidById: 'a',
  date: '2026-08-10',
  splitMode: 'equal',
  participantIds: [],
  createdAt: '',
}

const space: Space = {
  id: 's',
  name: 'Casa',
  description: '',
  kind: 'hogar',
  members,
  expenses: [expense],
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
}

const memberName = (id: string) =>
  members.find((member) => member.id === id)?.name ?? '—'

const full = monthShareText(space, '2026-08', memberName)
assert(full.includes('Detalle') || full.includes('Supermercado'), 'full has expense')
assert(full.includes('A la PaR — Casa'), 'full has space name')
assert(full.includes('Richard le transfiere a Patricia'), 'full has settlement')

const settle = settlementsShareText(space, '2026-08')
assert(settle.includes('Cómo saldar'), 'settle title')
assert(settle.includes('$'), 'settle has money')

const patricia = personBalanceText(space, '2026-08', 'a')
assert(Boolean(patricia), 'patricia balance')
assert(patricia!.includes('Patricia'), 'names patricia')
assert(patricia!.includes('Le deben'), 'patricia is owed')

const richard = personBalanceText(space, '2026-08', 'b')
assert(Boolean(richard), 'richard balance')
assert(richard!.includes('Debe'), 'richard owes')

const detail = personDetailText(space, '2026-08', 'a')
assert(Boolean(detail), 'patricia detail')
assert(detail!.includes('Supermercado'), 'detail lists paid expense')

const nudge = settlementNudgeText(space, '2026-08', {
  fromName: 'Richard',
  toName: 'Patricia',
  amount: 100,
})
assert(nudge.includes('Richard le transfiere a Patricia'), 'nudge names')
assert(nudge.includes('Casa'), 'nudge space')

console.log('export tests OK')
