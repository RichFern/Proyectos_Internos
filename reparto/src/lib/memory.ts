import type { Expense, ExpenseCategory } from '../types'

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Recuerda categoría (y datos) del último gasto con esa descripción, p. ej. "Luz". */
export function suggestFromHistory(
  expenses: Expense[],
  description: string,
): {
  category: ExpenseCategory
  amount?: number
  paidById?: string
  splitMode?: Expense['splitMode']
  paymentMethod?: string
  matchedDescription: string
} | null {
  const query = normalize(description)
  if (query.length < 2) return null

  const sorted = [...expenses].sort((a, b) =>
    (b.createdAt || b.date).localeCompare(a.createdAt || a.date),
  )
  const exact = sorted.find((expense) => normalize(expense.description) === query)
  const partial = exact
    ? null
    : sorted.find((expense) => {
        const name = normalize(expense.description)
        return name.startsWith(query) || query.startsWith(name)
      })
  const match = exact ?? partial
  if (!match) return null
  return {
    category: match.category,
    amount: match.amount,
    paidById: match.paidById,
    splitMode: match.splitMode,
    paymentMethod: match.paymentMethod,
    matchedDescription: match.description,
  }
}
