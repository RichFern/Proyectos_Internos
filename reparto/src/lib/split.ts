import type { Expense, SplitMode } from '../types'
import { isPersonalExpense } from './installments'

export function splitBadge(expense: Pick<Expense, 'splitMode' | 'participantIds'>): {
  label: string
  short: string
  kind: 'equal' | 'income' | 'custom' | 'personal'
} {
  if (isPersonalExpense(expense as Expense)) {
    return { label: 'Personal', short: 'Solo vos', kind: 'personal' }
  }
  if (expense.splitMode === 'equal') {
    const count = expense.participantIds.length || 2
    if (count === 2) {
      return { label: 'En partes iguales (50/50)', short: '50/50', kind: 'equal' }
    }
    return { label: 'En partes iguales', short: 'Iguales', kind: 'equal' }
  }
  if (expense.splitMode === 'custom') {
    return { label: 'Porcentajes manuales', short: 'Manual', kind: 'custom' }
  }
  return { label: 'Proporcional', short: 'Proporcional', kind: 'income' }
}

export function splitModeLabel(mode: SplitMode): string {
  if (mode === 'equal') return 'En partes iguales (50/50)'
  if (mode === 'custom') return 'Porcentajes manuales'
  return 'Proporcional'
}
