import {
  applySettlementRecords,
  filterSettlementRecords,
  pendingSettlements,
  settlementRecordFromSuggestion,
} from './settlements'
import type { MemberBalance, SettlementRecord } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const balances: MemberBalance[] = [
  {
    memberId: 'a',
    name: 'Ana',
    color: '#000',
    income: 100,
    incomeShare: 0.5,
    paid: 200,
    owes: 100,
    net: 100,
  },
  {
    memberId: 'b',
    name: 'Ben',
    color: '#111',
    income: 100,
    incomeShare: 0.5,
    paid: 0,
    owes: 100,
    net: -100,
  },
]

const pending = pendingSettlements(balances)
assert(pending.length === 1, 'one pending settlement')
assert(pending[0].fromId === 'b', 'debtor is b')
assert(Math.abs(pending[0].amount - 100) < 0.01, 'amount 100')

const record: SettlementRecord = {
  id: 'r1',
  fromId: 'b',
  toId: 'a',
  amount: 50,
  date: '2026-08-20',
  periodMonth: '2026-08',
  createdAt: '',
}

const adjusted = applySettlementRecords(balances, [record])
const netA = adjusted.find((b) => b.memberId === 'a')!.net
const netB = adjusted.find((b) => b.memberId === 'b')!.net
assert(Math.abs(netA - 50) < 0.01, 'creditor net reduced')
assert(Math.abs(netB - -50) < 0.01, 'debtor net reduced')

const filtered = filterSettlementRecords(
  [record, { ...record, id: 'r2', periodMonth: '2026-07' }],
  '2026-08',
)
assert(filtered.length === 1, 'filter by month')

const draft = settlementRecordFromSuggestion(pending[0], '2026-08', '2026-08-21')
assert(draft.fromId === 'b' && draft.amount === 100, 'draft from suggestion')

console.log('settlements.test.ts OK')
