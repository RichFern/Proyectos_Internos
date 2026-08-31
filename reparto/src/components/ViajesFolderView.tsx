import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { totalSpent } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { presetForSpace } from '../lib/spacePresets'
import { SpaceIcon } from './AppIcon'

interface Props {
  folder: Space
  trips: Space[]
  onOpenTrip: (spaceId: string) => void
  onCreateTrip: () => void
  onDeleteFolder: () => void
}

export function ViajesFolderView({
  folder,
  trips,
  onOpenTrip,
  onCreateTrip,
  onDeleteFolder,
}: Props) {
  const preset = presetForSpace(folder)
  const folderTotal = trips.reduce((sum, trip) => sum + totalSpent(trip), 0)

  return (
    <div className="panel main-panel">
      <header className="hero-space">
        <div className="section-head" style={{ marginBottom: '0.35rem' }}>
          <div>
            <h1 className="hero-space-title">
              <SpaceIcon space={folder} size={20} className="ui-icon space-icon" />
              <span className="hero-space-name">{folder.name}</span>
            </h1>
            <p>{folder.description || preset.description}</p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-danger btn-sm hide-sm"
              onClick={() => {
                const msg =
                  trips.length > 0
                    ? `¿Eliminar “${folder.name}” y sus ${trips.length} viaje(s)?`
                    : `¿Eliminar la carpeta “${folder.name}”?`
                if (confirm(msg)) onDeleteFolder()
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
        <div className="hero-meta hide-mobile">
          <span className="chip">{KIND_LABELS.viajes}</span>
          <span className="chip">{trips.length} viaje(s)</span>
          <span className="chip">{formatMoney(folderTotal)} en total</span>
        </div>
      </header>

      <div className="folder-body">
        <div className="section-head">
          <h2>Viajes en esta carpeta</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreateTrip}>
            + Nuevo viaje
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="empty">
            <h3>{preset.emptyTitle}</h3>
            <p>
              Cada viaje es un espacio aparte: transporte, alojamiento y salidas.
              Reparto 50/50, sin cargar sueldos.
            </p>
            <button type="button" className="btn btn-primary" onClick={onCreateTrip}>
              Crear primer viaje
            </button>
          </div>
        ) : (
          <div className="folder-trip-list">
            {trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                className="folder-trip-card"
                onClick={() => onOpenTrip(trip.id)}
              >
                <span className="folder-trip-head">
                  <SpaceIcon space={trip} size={18} className="ui-icon ui-icon-inline" />
                  <strong>{trip.name}</strong>
                </span>
                <span className="folder-trip-meta">
                  {formatMoney(totalSpent(trip))} · {trip.members.length} viajero(s) ·{' '}
                  {trip.expenses.length} gasto(s)
                </span>
                {trip.description ? (
                  <span className="folder-trip-desc">{trip.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
