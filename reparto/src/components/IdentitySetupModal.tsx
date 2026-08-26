import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LocalIdentity } from '../lib/identity'
import { Modal } from './Modal'

interface Props {
  initial?: LocalIdentity | null
  required?: boolean
  onSave: (identity: LocalIdentity) => void
  onClose?: () => void
}

export function IdentitySetupModal({ initial, required, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      email: email.trim() || undefined,
    })
  }

  return (
    <Modal
      title="¿Cómo te llamas?"
      subtitle="Para espacios personales privados y saber cuáles son solo tuyos"
      onClose={required ? () => {} : onClose ?? (() => {})}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Tu nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ana"
            required
            autoFocus
          />
        </label>
        <label className="field">
          Email (opcional)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Si lo cargas, identifica mejor tus espacios"
          />
        </label>
        <p className="hint">
          Los espacios personales solo los ves tú en este dispositivo o cuenta.
        </p>
        <div className="modal-actions">
          {!required && onClose ? (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
