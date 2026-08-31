import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { Modal } from './Modal'
import { SPACE_PRESETS, viajesFolders } from '../lib/spacePresets'
import { IconPicker } from './IconPicker'
import { CurrencyField } from './CurrencyField'
import { resolveDefaultCurrency } from '../lib/userPreferences'
import { AppIcon } from './AppIcon'

const PRESET_ICONS = new Set(
  Object.values(SPACE_PRESETS).map((preset) => preset.icon),
)

export type SpaceFormDefaults = {
  kind?: Space['kind']
  parentSpaceId?: string
  name?: string
}

interface Props {
  onClose: () => void
  onCreate: (
    input: Pick<Space, 'name' | 'description' | 'kind' | 'icon' | 'currency'> & {
      personal?: boolean
      parentSpaceId?: string
    },
  ) => void
  canCreatePersonal: boolean
  showPersonalUpgrade?: boolean
  onOpenUpgrade?: () => void
  defaultCurrency?: string
  allSpaces?: Space[]
  defaults?: SpaceFormDefaults
}

const KIND_ORDER: Space['kind'][] = [
  'hogar',
  'viajes',
  'viaje',
  'salida',
  'evento',
  'otro',
]

export function SpaceFormModal({
  onClose,
  onCreate,
  canCreatePersonal,
  showPersonalUpgrade = false,
  onOpenUpgrade,
  defaultCurrency,
  allSpaces = [],
  defaults,
}: Props) {
  const initialKind = defaults?.kind ?? 'hogar'
  const [name, setName] = useState(defaults?.name ?? '')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<Space['kind']>(initialKind)
  const [icon, setIcon] = useState(SPACE_PRESETS[initialKind].icon)
  const [personal, setPersonal] = useState(false)
  const [currency, setCurrency] = useState(
    resolveDefaultCurrency({ localCurrency: defaultCurrency }),
  )
  const [parentSpaceId, setParentSpaceId] = useState(defaults?.parentSpaceId ?? '')
  const folders = viajesFolders(allSpaces)

  useEffect(() => {
    if (kind === 'viaje' && !parentSpaceId && folders.length === 1) {
      setParentSpaceId(folders[0]!.id)
    }
  }, [kind, parentSpaceId, folders])

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
      parentSpaceId:
        kind === 'viaje' && parentSpaceId ? parentSpaceId : undefined,
    })
    onClose()
  }

  const preset = SPACE_PRESETS[kind]
  const isFolder = preset.isFolder
  const isQuickSalida = kind === 'salida'

  return (
    <Modal
      title="Nuevo espacio"
      subtitle={
        isFolder
          ? 'Carpeta para agrupar viajes'
          : isQuickSalida
            ? 'Rápido: solo nombres y 50/50'
            : 'Elige icono, moneda y tipo de espacio'
      }
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              kind === 'viajes'
                ? 'Ej. Mis viajes'
                : kind === 'viaje'
                  ? 'Ej. Mendoza 2026, Fin de semana en la playa'
                  : kind === 'salida'
                    ? 'Ej. Cena viernes, Almuerzo domingo'
                    : 'Ej. Casa, Departamento centro'
            }
            autoComplete="off"
            enterKeyHint="next"
            required
          />
        </label>
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
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <span className="space-kind-preview">
            <AppIcon name={preset.icon} size={16} className="ui-icon-inline" />
            <strong>{preset.description}</strong>
            <span>{preset.suggestedCategories}</span>
          </span>
        </label>
        {kind === 'viaje' ? (
          <label className="field">
            Carpeta de viajes (opcional)
            <select
              value={parentSpaceId}
              onChange={(e) => setParentSpaceId(e.target.value)}
            >
              <option value="">Sin carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <span className="hint">
              {folders.length === 0
                ? 'Puedes crear primero una carpeta de viajes para ordenar mejor.'
                : 'El viaje quedará agrupado dentro de la carpeta elegida.'}
            </span>
          </label>
        ) : null}
        {!isQuickSalida ? (
          <>
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
          </>
        ) : (
          <p className="hint">
            Usamos pesos chilenos (CLP) y reparto 50/50. Puedes cambiar la moneda
            después si lo necesitas.
          </p>
        )}
        {!isFolder ? (
          <label className="field">
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional: para qué es esta cuenta"
            />
          </label>
        ) : null}
        {canCreatePersonal && !isFolder ? (
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
        ) : !isFolder ? (
          <p className="hint">
            Para crear un espacio personal, primero indica tu nombre en la
            configuración de identidad.
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {isFolder ? 'Crear carpeta' : 'Crear espacio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
