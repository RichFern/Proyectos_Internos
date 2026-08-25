import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { Modal } from './Modal'

interface Props {
  onClose: () => void
  onCreate: (input: Pick<Space, 'name' | 'description' | 'kind'>) => void
}

export function SpaceFormModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<Space['kind']>('hogar')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name: name.trim(), description: description.trim(), kind })
    onClose()
  }

  return (
    <Modal
      title="Nuevo espacio"
      subtitle="Hogar, viaje o cualquier cuenta compartida"
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Casa, Paseo a Mendoza"
            required
          />
        </label>
        <label className="field">
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as Space['kind'])}>
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Descripción
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional: para qué es esta cuenta"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Crear espacio
          </button>
        </div>
      </form>
    </Modal>
  )
}
