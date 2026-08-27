import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { CurrencyField } from './CurrencyField'
import { DEFAULT_CURRENCY } from '../lib/currency'
import { setDefaultCurrency } from '../lib/userPreferences'

interface Props {
  onComplete: (currency: string) => void
  onClose?: () => void
  required?: boolean
}

export function DefaultCurrencyModal({
  onComplete,
  onClose,
  required = false,
}: Props) {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setDefaultCurrency(currency)
    onComplete(currency)
  }

  return (
    <Modal
      title="¿Qué moneda usas habitualmente?"
      subtitle="La usaremos al crear espacios. Puedes cambiarla por espacio o por gasto cuando lo necesites."
      onClose={required ? () => {} : onClose ?? (() => {})}
    >
      <form className="form-grid" onSubmit={submit}>
        <CurrencyField
          value={currency}
          onChange={setCurrency}
          label="Moneda habitual"
          hint="Puedes cambiarla después en Ajustes o en cada espacio."
        />
        <div className="modal-actions">
          {!required && onClose ? (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Ahora no
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            Guardar moneda
          </button>
        </div>
      </form>
    </Modal>
  )
}
