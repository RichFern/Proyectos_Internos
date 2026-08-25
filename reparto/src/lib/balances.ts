import type {
  Expense,
  Member,
  MemberBalance,
  Settlement,
  Space,
} from '../types'

function participantsForExpense(expense: Expense, members: Member[]): Member[] {
  if (!expense.participantIds.length) return members
  return members.filter((m) => expense.participantIds.includes(m.id))
}

/** Cuánto le corresponde a cada participante de un gasto */
export function sharesForExpense(
  expense: Expense,
  members: Member[],
): Record<string, number> {
  const participants = participantsForExpense(expense, members)
  if (!participants.length || expense.amount <= 0) return {}

  if (expense.splitMode === 'equal') {
    const each = expense.amount / participants.length
    return Object.fromEntries(participants.map((p) => [p.id, each]))
  }

  if (expense.splitMode === 'custom' && expense.customShares) {
    const raw = expense.customShares
    const total = participants.reduce((s, p) => s + (raw[p.id] ?? 0), 0)
    if (total <= 0) return {}
    // Si suman ~100, tratamos como porcentajes; si no, como montos relativos
    const asPercent = Math.abs(total - 100) < 0.5
    return Object.fromEntries(
      participants.map((p) => {
        const v = raw[p.id] ?? 0
        return [p.id, asPercent ? (expense.amount * v) / 100 : (expense.amount * v) / total]
      }),
    )
  }

  // Proporcional al ingreso
  const totalIncome = participants.reduce((s, p) => s + Math.max(0, p.income), 0)
  if (totalIncome <= 0) {
    const each = expense.amount / participants.length
    return Object.fromEntries(participants.map((p) => [p.id, each]))
  }
  return Object.fromEntries(
    participants.map((p) => [
      p.id,
      (expense.amount * Math.max(0, p.income)) / totalIncome,
    ]),
  )
}

export function computeBalances(space: Space): MemberBalance[] {
  const totalIncome = space.members.reduce((s, m) => s + Math.max(0, m.income), 0)

  const paid: Record<string, number> = {}
  const owes: Record<string, number> = {}
  for (const m of space.members) {
    paid[m.id] = 0
    owes[m.id] = 0
  }

  for (const expense of space.expenses) {
    paid[expense.paidById] = (paid[expense.paidById] ?? 0) + expense.amount
    const shares = sharesForExpense(expense, space.members)
    for (const [id, share] of Object.entries(shares)) {
      owes[id] = (owes[id] ?? 0) + share
    }
  }

  return space.members.map((m) => {
    const p = paid[m.id] ?? 0
    const o = owes[m.id] ?? 0
    return {
      memberId: m.id,
      name: m.name,
      color: m.color,
      income: m.income,
      incomeShare: totalIncome > 0 ? m.income / totalIncome : 0,
      paid: p,
      owes: o,
      net: p - o,
    }
  })
}

/** Minimiza transferencias entre quienes deben y quienes tienen a favor */
export function suggestSettlements(balances: MemberBalance[]): Settlement[] {
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

export function categoryTotals(
  space: Space,
): { category: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const e of space.expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function totalSpent(space: Space): number {
  return space.expenses.reduce((s, e) => s + e.amount, 0)
}
