import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { Modal } from './Modal'
import { SPACE_PRESETS } from '../lib/spacePresets'
import { IconPicker } from './IconPicker'
import { CurrencyField } from './CurrencyField'
import { resolveDefaultCurrency } from '../lib/userPreferences'
import { AppIcon } from './AppIcon'

const PRESET_ICONS = new Set(
  Object.values(SPACE_PRESETS).map((preset) => preset.icon),
)

interface Props {
  onClose: () => void
  onCreate: (
    input: Pick<Space, 'name' | 'description' | 'kind' | 'icon' | 'currency'> & {
      personal?: boolean
    },
  ) => void
  canCreatePersonal: boolean
  showPersonalUpgrade?: boolean
  onOpenUpgrade?: () => void
  defaultCurrency?: string
}

export function SpaceFormModal({
  onClose,
  onCreate,
  canCreatePersonal,
  showPersonalUpgrade = false,
  onOpenUpgrade,
  defaultCurrency,
}: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<Space['kind']>('hogar')
  const [icon, setIcon] = useState(SPACE_PRESETS.hogar.icon)
  const [personal, setPersonal] = useState(false)
  const [currency, setCurrency] = useState(
    resolveDefaultCurrency({ localCurrency: defaultCurrency }),
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      description: description.trim(),
      kind,
      icon,
      currency,
      personal: personal && canCreatePersonal,
    })
    onClose()
  }

  return (
    <Modal
      title="Nuevo espacio"
      subtitle="Elige icono, moneda y tipo de espacio"
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Casa, Paseo a Mendoza"
            autoComplete="off"
            enterKeyHint="next"
            required
          />
        </label>
        <div className="field">
          Icono
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <CurrencyField
          value={currency}
          onChange={setCurrency}
          label="Moneda del espacio"
          hint="Usa tu moneda habitual por defecto. Puedes cambiarla después en este espacio o por gasto."
        />
        <label className="field">
          Tipo
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as Space['kind']
              setKind(next)
              if (!icon || PRESET_ICONS.has(icon)) {
                setIcon(SPACE_PRESETS[next].icon)
              }
            }}
          >
            {(['hogar', 'viaje', 'evento', 'otro'] as const).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <span className="space-kind-preview">
            <AppIcon name={SPACE_PRESETS[kind].icon} size={16} className="ui-icon-inline" />
            <strong>{SPACE_PRESETS[kind].description}</strong>
            <span>{SPACE_PRESETS[kind].suggestedCategories}</span>
          </span>
        </label>
        <label className="field">
          Descripción
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional: para qué es esta cuenta"
          />
        </label>
        {canCreatePersonal ? (
          <label className="choice-check">
            <input
              type="checkbox"
              checked={personal}
              onChange={(e) => setPersonal(e.target.checked)}
            />
            <span>
              <strong>Espacio personal (solo yo)</strong>
              <span className="hint block">
                Solo tú puedes verlo en este dispositivo o cuenta Google.
              </span>
            </span>
          </label>
        ) : showPersonalUpgrade ? (
          <div className="hint">
            <p>Espacios personales están disponibles en el plan Premium.</p>
            {onOpenUpgrade ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenUpgrade}>
                Ver plan Premium
              </button>
            ) : null}
          </div>
        ) : (
          <p className="hint">
            Para crear un espacio personal, primero indica tu nombre en la
            configuración de identidad.
          </p>
        )}
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
