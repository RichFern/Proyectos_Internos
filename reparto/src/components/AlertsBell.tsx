import { useEffect, useRef, useState } from 'react'
import type { DueAlert } from '../lib/installments'
import { formatDate, formatMoney } from '../lib/format'
import type { Space } from '../types'

interface BudgetAlert {
  label: string
  spent: number
  limit: number
}

interface Props {
  dueAlerts: DueAlert[]
  budgetAlerts: BudgetAlert[]
  onOpenExpense: (expenseId: string) => void
  settings: NonNullable<Space['alertSettings']>
  onUpdateSettings: (
    settings: NonNullable<Space['alertSettings']>,
  ) => void
}

export function AlertsBell({
  dueAlerts,
  budgetAlerts,
  onOpenExpense,
  settings,
  onUpdateSettings,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = dueAlerts.length + budgetAlerts.length

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="alerts-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-sm alerts-bell"
        aria-label={`${count} alertas`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden>🔔</span>
        {count > 0 ? <span className="alerts-badge">{count}</span> : null}
      </button>
      {open ? (
        <div className="alerts-dropdown">
          <div className="section-head">
            <h3>Alertas</h3>
            <span className="chip">{count}</span>
          </div>
          {count === 0 ? (
            <p className="hint">No tenés alertas pendientes.</p>
          ) : (
            <div className="alert-list">
              {dueAlerts.map((alert) => (
                <button
                  type="button"
                  className={`alert-item ${alert.status}`}
                  key={alert.expense.id}
                  onClick={() => {
                    onOpenExpense(alert.expense.id)
                    setOpen(false)
                  }}
                >
                  <strong>{alert.expense.description}</strong>
                  <span>
                    {alert.status === 'overdue' ? 'Vencido' : 'Vence pronto'} ·{' '}
                    {formatDate(alert.expense.dueDate!)} ·{' '}
                    {formatMoney(alert.expense.amount)}
                  </span>
                </button>
              ))}
              {budgetAlerts.map((alert) => (
                <div className="alert-item budget" key={alert.label}>
                  <strong>Presupuesto: {alert.label}</strong>
                  <span>
                    Gastaste {formatMoney(alert.spent)} de{' '}
                    {formatMoney(alert.limit)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <details className="alerts-settings">
            <summary>Configurar alertas</summary>
            <label className="check-pill">
              <input
                type="checkbox"
                checked={settings.dueEnabled}
                onChange={(event) =>
                  onUpdateSettings({
                    ...settings,
                    dueEnabled: event.target.checked,
                  })
                }
              />
              Vencimientos
            </label>
            <label className="field">
              Avisar con anticipación
              <select
                value={settings.dueDays}
                onChange={(event) =>
                  onUpdateSettings({
                    ...settings,
                    dueDays: Number(event.target.value),
                  })
                }
              >
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={10}>10 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días</option>
              </select>
            </label>
            <label className="check-pill">
              <input
                type="checkbox"
                checked={settings.budgetEnabled}
                onChange={(event) =>
                  onUpdateSettings({
                    ...settings,
                    budgetEnabled: event.target.checked,
                  })
                }
              />
              Presupuestos superados
            </label>
          </details>
        </div>
      ) : null}
    </div>
  )
}

