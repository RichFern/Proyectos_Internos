import type {
  Expense,
  Member,
  MemberBalance,
  PersonMonthStats,
  Settlement,
  Space,
} from '../types'
import { isPersonalExpense } from './installments'
import { membersWithMonthIncome } from './members'

function participantsForExpense(expense: Expense, members: Member[]): Member[] {
  if (!expense.participantIds.length) return members
  return members.filter((m) => expense.participantIds.includes(m.id))
}

function hasManualContributionPlan(members: Member[]): boolean {
  if (!members.length) return false
  const total = members.reduce(
    (sum, member) => sum + (member.contributionPercent ?? 0),
    0,
  )
  return Math.abs(total - 100) < 0.01
}

/** Cuánto le corresponde a cada participante de un gasto */
export function sharesForExpense(
  expense: Expense,
  members: Member[],
): Record<string, number> {
  const participants = participantsForExpense(expense, members)
  if (!participants.length || expense.amount <= 0) return {}

  // Gasto personal: solo le corresponde a esa persona
  if (participants.length === 1) {
    return { [participants[0].id]: expense.amount }
  }

  if (expense.splitMode === 'equal') {
    const each = expense.amount / participants.length
    return Object.fromEntries(participants.map((p) => [p.id, each]))
  }

  if (expense.splitMode === 'custom' && expense.customShares) {
    const raw = expense.customShares
    const total = participants.reduce((s, p) => s + (raw[p.id] ?? 0), 0)
    if (total <= 0) return {}
    const asPercent = Math.abs(total - 100) < 0.5
    return Object.fromEntries(
      participants.map((p) => {
        const v = raw[p.id] ?? 0
        return [p.id, asPercent ? (expense.amount * v) / 100 : (expense.amount * v) / total]
      }),
    )
  }

  if (hasManualContributionPlan(members)) {
    const totalPercent = participants.reduce(
      (sum, participant) =>
        sum + Math.max(0, participant.contributionPercent ?? 0),
      0,
    )
    if (totalPercent > 0) {
      return Object.fromEntries(
        participants.map((participant) => [
          participant.id,
          (expense.amount *
            Math.max(0, participant.contributionPercent ?? 0)) /
            totalPercent,
        ]),
      )
    }
  }

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

/**
 * @param month YYYY-MM o null/'all' — ajusta ingresos del mes antes de calcular
 */
export function computeBalances(
  space: Space,
  month?: string | null,
): MemberBalance[] {
  const members = membersWithMonthIncome(
    space.members,
    month && month !== 'all' ? month : null,
  )
  const totalIncome = members.reduce((s, m) => s + Math.max(0, m.income), 0)
  const manualPlan = hasManualContributionPlan(members)

  const paid: Record<string, number> = {}
  const owes: Record<string, number> = {}
  for (const m of members) {
    paid[m.id] = 0
    owes[m.id] = 0
  }

  for (const expense of space.expenses) {
    paid[expense.paidById] = (paid[expense.paidById] ?? 0) + expense.amount
    const shares = sharesForExpense(expense, members)
    for (const [id, share] of Object.entries(shares)) {
      owes[id] = (owes[id] ?? 0) + share
    }
  }

  return members.map((m) => {
    const p = paid[m.id] ?? 0
    const o = owes[m.id] ?? 0
    return {
      memberId: m.id,
      name: m.name,
      color: m.color,
      income: m.income,
      incomeShare: manualPlan
        ? (m.contributionPercent ?? 0) / 100
        : totalIncome > 0
          ? m.income / totalIncome
          : 0,
      paid: p,
      owes: o,
      net: p - o,
    }
  })
}

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

export function personStats(
  space: Space,
  memberId: string,
  month?: string | null,
): PersonMonthStats | null {
  const members = membersWithMonthIncome(
    space.members,
    month && month !== 'all' ? month : null,
  )
  const member = members.find((m) => m.id === memberId)
  if (!member) return null

  const totalIncome = members.reduce((s, m) => s + m.income, 0)
  const paidExpenses = space.expenses.filter((e) => e.paidById === memberId)
  const participatedExpenses = space.expenses.filter((e) => {
    if (!e.participantIds.length) return true
    return e.participantIds.includes(memberId)
  })

  let share = 0
  let personalShare = 0
  let personalPaid = 0
  for (const e of space.expenses) {
    const shares = sharesForExpense(e, members)
    const part = shares[memberId] ?? 0
    share += part
    if (isPersonalExpense(e, memberId)) {
      personalShare += part
      if (e.paidById === memberId) personalPaid += e.amount
    }
  }

  const paid = paidExpenses.reduce((s, e) => s + e.amount, 0)

  return {
    memberId,
    name: member.name,
    color: member.color,
    income: member.income,
    incomeShare: totalIncome > 0 ? member.income / totalIncome : 0,
    paid,
    share,
    net: paid - share,
    paidExpenses,
    participatedExpenses,
    personalPaid,
    personalShare,
  }
}

export function personCategoryTotals(
  space: Space,
  memberId: string,
  month?: string | null,
): { category: string; amount: number }[] {
  const members = membersWithMonthIncome(
    space.members,
    month && month !== 'all' ? month : null,
  )
  const map = new Map<string, number>()
  for (const expense of space.expenses) {
    const shares = sharesForExpense(expense, members)
    const part = shares[memberId] ?? 0
    if (part <= 0) continue
    map.set(expense.category, (map.get(expense.category) ?? 0) + part)
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}
