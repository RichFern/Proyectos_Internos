import type { Expense, ExpenseDraft, InstallmentPlan, Member } from '../types'
import { createId } from './id'
import { shiftMonth } from './format'

export function addMonthsToDate(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const target = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  const out = new Date(target.getFullYear(), target.getMonth(), day)
  const yy = out.getFullYear()
  const mm = String(out.getMonth() + 1).padStart(2, '0')
  const dd = String(out.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function splitInstallmentAmounts(
  total: number,
  count: number,
): number[] {
  if (count <= 0) return []
  const base = Math.floor((total / count) * 100) / 100
  const amounts = Array.from({ length: count }, () => base)
  const sum = base * count
  const diff = Math.round((total - sum) * 100) / 100
  amounts[count - 1] = Math.round((amounts[count - 1] + diff) * 100) / 100
  return amounts
}

export function buildInstallmentPlan(input: {
  description: string
  category: InstallmentPlan['category']
  totalAmount: number
  installmentCount: number
  paidById: string
  splitMode: InstallmentPlan['splitMode']
  participantIds: string[]
  visibility?: InstallmentPlan['visibility']
  ownerUid?: string | null
  startDate: string
  notes?: string
}): { plan: InstallmentPlan; expenses: ExpenseDraft[] } {
  const count = Math.max(1, Math.floor(input.installmentCount))
  const amounts = splitInstallmentAmounts(input.totalAmount, count)
  const planId = createId()
  const now = new Date().toISOString()
  const plan: InstallmentPlan = {
    id: planId,
    description: input.description.trim(),
    category: input.category,
    totalAmount: input.totalAmount,
    installmentCount: count,
    paidById: input.paidById,
    splitMode: input.splitMode,
    participantIds: input.participantIds,
    visibility: input.visibility ?? 'shared',
    ownerUid: input.ownerUid ?? null,
    startDate: input.startDate,
    notes: input.notes,
    createdAt: now,
  }

  const expenses: ExpenseDraft[] = amounts.map((amount, i) => {
    const due = addMonthsToDate(input.startDate, i)
    return {
      description: `${plan.description} (${i + 1}/${count})`,
      amount,
      category: plan.category,
      paidById: plan.paidById,
      date: due,
      dueDate: due,
      splitMode: plan.splitMode,
      participantIds: plan.participantIds,
      visibility: plan.visibility,
      ownerUid: plan.ownerUid,
      notes: plan.notes,
      installmentPlanId: planId,
      installmentNumber: i + 1,
      installmentTotal: count,
    }
  })

  return { plan, expenses }
}

export type DueAlert = {
  expense: Expense
  status: 'overdue' | 'due_soon' | 'upcoming'
  daysUntil: number
}

export function dueAlerts(
  expenses: Expense[],
  today = new Date().toISOString().slice(0, 10),
  soonDays = 10,
): DueAlert[] {
  const withDue = expenses.filter((e) => e.dueDate)
  return withDue
    .map((expense) => {
      const due = expense.dueDate!
      const daysUntil = Math.round(
        (new Date(due + 'T12:00:00').getTime() -
          new Date(today + 'T12:00:00').getTime()) /
          86400000,
      )
      let status: DueAlert['status'] = 'upcoming'
      if (daysUntil < 0) status = 'overdue'
      else if (daysUntil <= soonDays) status = 'due_soon'
      return { expense, status, daysUntil }
    })
    .filter((a) => a.status !== 'upcoming' || a.daysUntil <= 45)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export function isPersonalExpense(expense: Expense, payerId?: string): boolean {
  if (expense.participantIds.length !== 1) return false
  if (payerId) return expense.participantIds[0] === payerId
  return true
}

/** Mes de una cuota a partir del plan (helper) */
export function installmentMonthKey(startDate: string, index0: number): string {
  return shiftMonth(startDate.slice(0, 7), index0)
}

export function planProgress(
  plan: InstallmentPlan,
  expenses: Expense[],
  today = new Date().toISOString().slice(0, 10),
): { paidCount: number; paidAmount: number; nextDue?: string } {
  const related = expenses.filter((e) => e.installmentPlanId === plan.id)
  // Consideramos "pagada" si la fecha del gasto/vencimiento ya pasó o es hoy
  const paid = related.filter((e) => (e.dueDate ?? e.date) <= today)
  const upcoming = related
    .filter((e) => (e.dueDate ?? e.date) > today)
    .sort((a, b) => (a.dueDate ?? a.date).localeCompare(b.dueDate ?? b.date))
  return {
    paidCount: paid.length,
    paidAmount: paid.reduce((s, e) => s + e.amount, 0),
    nextDue: upcoming[0]?.dueDate ?? upcoming[0]?.date,
  }
}

export function memberNameSafe(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? '—'
}
