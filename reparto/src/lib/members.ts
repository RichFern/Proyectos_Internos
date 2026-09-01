import type { Member } from '../types'
import { monthKey } from './format'

/** Ingreso efectivo de una persona en un mes (YYYY-MM) o ingreso base */
export function incomeForMonth(member: Member, month: string | null | undefined): number {
  if (month && month !== 'all' && member.incomeByMonth?.[month] != null) {
    return Math.max(0, member.incomeByMonth[month]!)
  }
  return Math.max(0, member.income)
}

export function setIncomeForMonth(
  member: Member,
  month: string,
  amount: number,
): Member {
  const incomeByMonth = { ...(member.incomeByMonth ?? {}) }
  if (Number.isFinite(amount) && amount >= 0) {
    incomeByMonth[month] = amount
  }
  return { ...member, incomeByMonth }
}

export function clearIncomeForMonth(member: Member, month: string): Member {
  if (!member.incomeByMonth?.[month]) return member
  const incomeByMonth = { ...member.incomeByMonth }
  delete incomeByMonth[month]
  return { ...member, incomeByMonth }
}

export function membersWithMonthIncome(
  members: Member[],
  month: string | null | undefined,
): Member[] {
  return members.map((m) => ({
    ...m,
    income: incomeForMonth(m, month),
  }))
}

export function expenseMonth(date: string): string {
  return monthKey(date)
}
