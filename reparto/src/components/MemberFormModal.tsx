import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Member } from '../types'
import { Modal } from './Modal'
import { formatMonth } from '../lib/format'
import { incomeForMonth } from '../lib/members'

interface Props {
  initial?: Member | null
  /** Mes seleccionado en la UI (YYYY-MM) para override */
  month?: string | null
  onClose: () => void
  onSave: (input: {
    name: string
    income: number
    /** amount >= 0 setea override; amount < 0 limpia override del mes */
    monthIncome?: { month: string; amount: number } | null
  }) => void
}

export function MemberFormModal({ initial, month, onClose, onSave }: Props) {
  const activeMonth = month && month !== 'all' ? month : null
  const baseIncome = initial?.income ?? 0
  const hasOverride = Boolean(
    activeMonth && initial?.incomeByMonth?.[activeMonth] != null,
  )
  const currentMonthIncome = initial
    ? incomeForMonth(initial, activeMonth)
    : baseIncome

  const [name, setName] = useState(initial?.name ?? '')
  const [income, setIncome] = useState(String(baseIncome || ''))
  const [useMonthOverride, setUseMonthOverride] = useState(hasOverride)
  const [monthAmount, setMonthAmount] = useState(
    String(hasOverride ? currentMonthIncome : baseIncome || ''),
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const base = Number(income.replace(/\./g, '').replace(',', '.'))
    if (!name.trim() || Number.isNaN(base) || base < 0) return

    let monthIncomePayload: { month: string; amount: number } | null = null
    if (activeMonth) {
      if (useMonthOverride) {
        const mVal = Number(monthAmount.replace(/\./g, '').replace(',', '.'))
        if (Number.isNaN(mVal) || mVal < 0) return
        monthIncomePayload = { month: activeMonth, amount: mVal }
      } else {
        monthIncomePayload = { month: activeMonth, amount: -1 }
      }
    }

    onSave({
      name: name.trim(),
      income: base,
      monthIncome: monthIncomePayload,
    })
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Editar persona' : 'Agregar persona'}
      subtitle="El ingreso se usa para repartir en proporción. Podés cambiarlo solo para un mes."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            required
          />
        </label>
        <label className="field">
          Ingreso base (meses sin cambio)
          <input
            type="number"
            min={0}
            step={1000}
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="850000"
            required
          />
        </label>

        {activeMonth ? (
          <div className="month-income-box">
            <p className="hint" style={{ marginBottom: '0.5rem' }}>
              Mes seleccionado: <strong>{formatMonth(activeMonth)}</strong>
            </p>
            <label className="check-pill">
              <input
                type="checkbox"
                checked={useMonthOverride}
                onChange={(e) => setUseMonthOverride(e.target.checked)}
              />
              Usar otro ingreso solo en este mes
            </label>
            {useMonthOverride ? (
              <label className="field" style={{ marginTop: '0.65rem' }}>
                Ingreso de este mes
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={monthAmount}
                  onChange={(e) => setMonthAmount(e.target.value)}
                  required
                />
              </label>
            ) : (
              <p className="hint">Se usará el ingreso base para este mes.</p>
            )}
          </div>
        ) : (
          <p className="hint">
            Elegí un mes concreto arriba para cargar un sueldo distinto solo ese
            mes (aguinaldo, cambio de laburo, etc.).
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
