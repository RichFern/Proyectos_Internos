import type { Expense, Member, Space } from '../types'
import { categoryLabel } from '../lib/categories'
import { expenseCurrency } from '../lib/currency'
import { formatDate, formatMoney, formatMonth } from '../lib/format'
import { isPersonalExpense } from '../lib/installments'
import { splitBadge } from '../lib/split'

interface Props {
  expenses: Expense[]
  members: Member[]
  customCategories?: Space['customCategories']
  space: Space
  memberName: (id: string) => string
  onEdit: (expense: Expense) => void
  onRepeat: (expense: Expense) => void
  onRemove: (id: string) => void
  emptyTitle: string
}

export function ExpenseCartola({
  expenses,
  members,
  customCategories,
  space,
  memberName,
  onEdit,
  onRepeat,
  onRemove,
  emptyTitle,
}: Props) {
  if (!expenses.length) {
    return (
      <div className="empty">
        <h3>{emptyTitle}</h3>
        <p>La cartola muestra fecha, categoría, quién pagó y cómo se reparte.</p>
      </div>
    )
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currency = expenseCurrency(expenses[0], space)

  return (
    <div className="cartola-wrap">
      <div className="cartola-scroll">
        <table className="cartola">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Descripción</th>
              <th scope="col">Categoría</th>
              <th scope="col">Pagó</th>
              <th scope="col">Reparto</th>
              <th scope="col" className="cartola-num">
                Monto
              </th>
              <th scope="col" className="cartola-actions-col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const badge = splitBadge(expense)
              const payer = members.find((member) => member.id === expense.paidById)
              const rowCurrency = expenseCurrency(expense, space)
              return (
                <tr
                  key={expense.id}
                  className={`cartola-row${expense.provisional ? ' provisional' : ''}`}
                >
                  <td data-label="Fecha">
                    <span className="cartola-date">{formatDate(expense.date)}</span>
                    {expense.accountingMonth &&
                    expense.accountingMonth !== expense.date.slice(0, 7) ? (
                      <span className="cartola-sub">
                        Mes {formatMonth(expense.accountingMonth)}
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Descripción">
                    <strong>{expense.description}</strong>
                    {expense.notes ? <span className="cartola-sub">{expense.notes}</span> : null}
                    <span className="cartola-tags">
                      {expense.provisional ? <span className="chip">Provisorio</span> : null}
                      {isPersonalExpense(expense) ? (
                        <span className="chip">Personal</span>
                      ) : null}
                      {expense.installmentNumber && expense.installmentTotal ? (
                        <span className="chip">
                          Cuota {expense.installmentNumber}/{expense.installmentTotal}
                        </span>
                      ) : null}
                      {expense.hasReceipt ? <span className="chip">Ticket</span> : null}
                    </span>
                  </td>
                  <td data-label="Categoría">
                    {categoryLabel(expense.category, customCategories)}
                  </td>
                  <td data-label="Pagó">
                    <span
                      className="cartola-payer"
                      style={{ borderLeftColor: payer?.color ?? 'transparent' }}
                    >
                      {memberName(expense.paidById)}
                    </span>
                    {expense.paymentMethod ? (
                      <span className="cartola-sub">{expense.paymentMethod}</span>
                    ) : null}
                  </td>
                  <td data-label="Reparto">
                    <span className={`split-badge split-${badge.kind}`}>{badge.label}</span>
                  </td>
                  <td data-label="Monto" className="cartola-num">
                    <strong>{formatMoney(expense.amount, false, rowCurrency)}</strong>
                  </td>
                  <td className="cartola-actions-col">
                    <div className="cartola-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onRepeat(expense)}
                      >
                        Repetir
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onEdit(expense)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm('¿Borrar este gasto?')) onRemove(expense.id)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>
                <strong>Total del período</strong>
                <span className="cartola-sub"> {expenses.length} movimientos</span>
              </td>
              <td className="cartola-num">
                <strong>{formatMoney(total, false, currency)}</strong>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
