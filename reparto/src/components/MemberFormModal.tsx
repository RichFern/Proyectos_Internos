import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Member } from '../types'
import { Modal } from './Modal'

interface Props {
  initial?: Member | null
  onClose: () => void
  onSave: (input: Pick<Member, 'name' | 'income'>) => void
}

export function MemberFormModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [income, setIncome] = useState(String(initial?.income ?? ''))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(income.replace(/\./g, '').replace(',', '.'))
    if (!name.trim() || Number.isNaN(value) || value < 0) return
    onSave({ name: name.trim(), income: value })
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Editar persona' : 'Agregar persona'}
      subtitle="El ingreso se usa para repartir gastos en proporción"
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
          Ingreso mensual
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
        <p className="hint">
          Quien gana más aporta más en los gastos con reparto proporcional.
        </p>
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
