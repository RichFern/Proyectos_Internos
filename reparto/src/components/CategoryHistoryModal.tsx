import { useMemo } from 'react'
import type { Space } from '../types'
import { Modal } from './Modal'
import { categoryMonthHistory } from '../lib/year'
import { categoryLabel } from '../lib/categories'
import { formatMoney, formatMonth } from '../lib/format'
import { CategoryIcon } from './AppIcon'

interface Props {
  space: Space
  category: string
  onClose: () => void
}

export function CategoryHistoryModal({ space, category, onClose }: Props) {
  const history = useMemo(
    () => categoryMonthHistory(space.expenses, category),
    [space.expenses, category],
  )
  const max = Math.max(1, ...history.months.map((row) => row.amount))
  const label = categoryLabel(category, space.customCategories)

  return (
    <Modal
      title={
        <span className="modal-title-with-icon">
          <CategoryIcon id={category} size={20} className="ui-icon ui-icon-inline" />
          {label}
        </span>
      }
      subtitle={`Histórico ${formatMoney(history.historicalTotal)} · ${history.months.length} mes(es)`}
      onClose={onClose}
    >
      {history.months.length === 0 ? (
        <div className="empty">
          <h3>Sin movimientos</h3>
          <p>Todavía no hay gastos en esta categoría.</p>
        </div>
      ) : (
        <div className="list">
          {history.months.map((row) => (
            <div className="statement-row" key={row.month}>
              <div className="statement-date">{formatMonth(row.month)}</div>
              <div>
                <div className="cat-bar" style={{ margin: '0.35rem 0' }}>
                  <span style={{ width: `${Math.max(8, (row.amount / max) * 100)}%` }} />
                </div>
                <div className="row-meta">
                  {row.count} {row.count === 1 ? 'gasto' : 'gastos'}
                </div>
              </div>
              <div className="row-amount">{formatMoney(row.amount)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}
