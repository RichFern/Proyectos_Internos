import type {
  BudgetType,
  ExpenseCategory,
  Space,
} from '../types'
import type { categoryBudgetStatus } from '../lib/budgets'
import { formatMoney, formatMonth } from '../lib/format'
import { Modal } from './Modal'

type Status = ReturnType<typeof categoryBudgetStatus>

interface Props {
  space: Space
  month: string
  status: Status
  spent: number
  onSetCategory: (
    month: string,
    category: ExpenseCategory,
    limit: number | null,
  ) => void
  onUpdateSettings: (settings: NonNullable<Space['budgetSettings']>) => void
  onClose: () => void
}

export function BudgetModal({
  space,
  month,
  status,
  spent,
  onSetCategory,
  onUpdateSettings,
  onClose,
}: Props) {
  const settings = space.budgetSettings ?? {
    type: 'category' as BudgetType,
    recurring: false,
    defaultByCategory: {},
  }

  const update = (patch: Partial<typeof settings>) => {
    onUpdateSettings({ ...settings, ...patch })
  }

  return (
    <Modal
      title="Presupuesto"
      subtitle={`${formatMonth(month)} · gastado ${formatMoney(spent)}`}
      onClose={onClose}
    >
      <div className="budget-type-tabs">
        {(
          [
            ['category', 'Por categoría'],
            ['total', 'Total mensual'],
            ['savings', 'Meta de ahorro'],
          ] as const
        ).map(([type, label]) => (
          <button
            type="button"
            className={`chip${settings.type === type ? ' active' : ''}`}
            key={type}
            onClick={() => update({ type })}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="choice-check budget-recurring">
        <input
          type="checkbox"
          checked={settings.recurring}
          onChange={(event) => update({ recurring: event.target.checked })}
        />
        <span>
          <strong>Usar como presupuesto mensual</strong>
          <span className="hint block">
            Se aplicará por defecto a los próximos meses. Puedes cambiar un mes
            puntual cuando quieras.
          </span>
        </span>
      </label>

      {settings.type === 'category' ? (
        <div className="budget-grid budget-modal-grid">
          {status.map((item) => (
            <label className="budget-field" key={item.category}>
              <span>{item.label}</span>
              <input
                type="number"
                min={0}
                step={1000}
                placeholder="Sin tope"
                value={item.limit ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                    ? Number(event.target.value)
                    : null
                  onSetCategory(month, item.category, value)
                  if (settings.recurring) {
                    const defaults = { ...(settings.defaultByCategory ?? {}) }
                    if (value == null || value <= 0) delete defaults[item.category]
                    else defaults[item.category] = value
                    update({ defaultByCategory: defaults })
                  }
                }}
              />
              <span className={`budget-spent${item.over ? ' over' : ''}`}>
                {formatMoney(item.spent)}
                {item.limit
                  ? ` · ${Math.round((item.percent ?? 0) * 100)}%`
                  : ''}
              </span>
            </label>
          ))}
        </div>
      ) : null}

      {settings.type === 'total' ? (
        <label className="field">
          Tope total mensual
          <input
            type="number"
            min={0}
            step={1000}
            value={settings.totalLimit ?? ''}
            onChange={(event) =>
              update({
                totalLimit: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            placeholder="Ej. 500000"
          />
          {settings.totalLimit ? (
            <span
              className={`budget-spent${spent > settings.totalLimit ? ' over' : ''}`}
            >
              Usado {Math.round((spent / settings.totalLimit) * 100)}%
            </span>
          ) : null}
        </label>
      ) : null}

      {settings.type === 'savings' ? (
        <label className="field">
          Meta de ahorro mensual
          <input
            type="number"
            min={0}
            step={1000}
            value={settings.savingsGoal ?? ''}
            onChange={(event) =>
              update({
                savingsGoal: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            placeholder="Ej. 100000"
          />
          <span className="hint">
            La meta queda registrada junto al presupuesto del hogar.
          </span>
        </label>
      ) : null}

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

