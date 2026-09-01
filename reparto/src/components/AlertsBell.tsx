import { useEffect, useRef, useState } from 'react'
import type { DueAlert } from '../lib/installments'
import { formatDate, formatMoney } from '../lib/format'
import type { Space } from '../types'
import { AppIcon } from './AppIcon'

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

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    const tomorrow = dueAlerts.filter((alert) => alert.daysUntil === 1)
    if (!tomorrow.length) return
    const stamp = new Date().toISOString().slice(0, 10)
    const key = `alapar-due-${stamp}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const body =
      tomorrow.length === 1
        ? `${tomorrow[0].expense.description} vence mañana`
        : `${tomorrow.length} gastos vencen mañana`
    new Notification('A la PaR', { body })
  }, [dueAlerts])

  return (
    <div className="alerts-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-sm alerts-bell"
        aria-label={`${count} alertas`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <AppIcon name="bell" size={18} className="ui-icon" aria-hidden />
        {count > 0 ? <span className="alerts-badge">{count}</span> : null}
      </button>
      {open ? (
        <div className="alerts-dropdown">
          <div className="section-head">
            <h3>Alertas</h3>
            <span className="chip">{count}</span>
          </div>
          {count === 0 ? (
            <p className="hint">No tienes alertas pendientes.</p>
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
                    {alert.status === 'overdue'
                      ? 'Vencido'
                      : alert.daysUntil === 0
                        ? 'Vence hoy'
                        : alert.daysUntil === 1
                          ? 'Vence mañana'
                          : 'Vence pronto'}{' '}
                    · {formatDate(alert.expense.dueDate!)} ·{' '}
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
                <option value={1}>El día anterior</option>
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
            {typeof Notification !== 'undefined' ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  void Notification.requestPermission()
                }}
              >
                Aviso en este teléfono
              </button>
            ) : null}
          </details>
        </div>
      ) : null}
    </div>
  )
}

