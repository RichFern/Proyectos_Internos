import type { MemberBalance, Settlement, SettlementRecord } from '../types'

/** Ajusta el neto según transferencias ya hechas (saldadas) */
export function applySettlementRecords(
  balances: MemberBalance[],
  records: SettlementRecord[],
): MemberBalance[] {
  if (!records.length) return balances
  const adjust: Record<string, number> = {}
  for (const r of records) {
    adjust[r.fromId] = (adjust[r.fromId] ?? 0) + r.amount
    adjust[r.toId] = (adjust[r.toId] ?? 0) - r.amount
  }
  return balances.map((b) => ({
    ...b,
    net: b.net + (adjust[b.memberId] ?? 0),
  }))
}

export function filterSettlementRecords(
  records: SettlementRecord[],
  month: string | null,
): SettlementRecord[] {
  if (!month) return records
  return records.filter((r) => !r.periodMonth || r.periodMonth === month)
}

export function pendingSettlements(balances: MemberBalance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ ...b, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ ...b, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].remaining, creditors[j].remaining)
    if (amount > 0.005) {
      settlements.push({
        fromId: debtors[i].memberId,
        fromName: debtors[i].name,
        toId: creditors[j].memberId,
        toName: creditors[j].name,
        amount,
      })
    }
    debtors[i].remaining -= amount
    creditors[j].remaining -= amount
    if (debtors[i].remaining <= 0.005) i += 1
    if (creditors[j].remaining <= 0.005) j += 1
  }

  return settlements
}

export function settlementRecordFromSuggestion(
  s: Settlement,
  periodMonth: string | null,
  date: string,
): Omit<SettlementRecord, 'id' | 'createdAt'> {
  return {
    fromId: s.fromId,
    toId: s.toId,
    amount: s.amount,
    date,
    periodMonth: periodMonth ?? undefined,
    note: `${s.fromName} → ${s.toName}`,
  }
}
