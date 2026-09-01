import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { totalSpent } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { buildSpaceSections } from '../lib/spaceGroups'
import { SpaceIcon, UiLock } from './AppIcon'

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  onSelect: (spaceId: string) => void
  onCreateTripInFolder?: (folderId: string) => void
}

function spaceMeta(space: Space): string {
  return `${KIND_LABELS[space.kind]} · ${formatMoney(totalSpent(space))} · ${space.members.length} pers.`
}

function SpaceRow({
  space,
  active,
  meta,
  nested = false,
  onSelect,
}: {
  space: Space
  active: boolean
  meta: string
  nested?: boolean
  onSelect: (spaceId: string) => void
}) {
  return (
    <button
      type="button"
      className={`space-item${nested ? ' space-item-nested' : ''}${active ? ' active' : ''}`}
      onClick={() => onSelect(space.id)}
    >
      <span className="space-item-name">
        {space.visibility === 'personal' ? (
          <UiLock size={14} className="ui-icon ui-icon-lock ui-icon-inline" />
        ) : null}
        <SpaceIcon space={space} size={16} className="ui-icon ui-icon-inline" />{' '}
        {space.name}
      </span>
      <span className="space-item-meta">{meta}</span>
    </button>
  )
}

export function GroupedSpaceList({
  spaces,
  activeSpaceId,
  onSelect,
  onCreateTripInFolder,
}: Props) {
  const sections = buildSpaceSections(spaces)

  return (
    <>
      {sections.map((section) => (
        <div key={section.id} className="space-section">
          <div className="space-section-label">{section.label}</div>
          {section.folders.map(({ folder, trips }) => {
            const folderTotal = trips.reduce(
              (sum, trip) => sum + totalSpent(trip),
              0,
            )
            return (
              <div key={folder.id} className="space-folder">
                <SpaceRow
                  space={folder}
                  active={activeSpaceId === folder.id}
                  meta={`${trips.length} viaje(s) · ${formatMoney(folderTotal)}`}
                  onSelect={onSelect}
                />
                {trips.map((trip) => (
                  <SpaceRow
                    key={trip.id}
                    space={trip}
                    active={activeSpaceId === trip.id}
                    nested
                    meta={`${formatMoney(totalSpent(trip))} · ${trip.members.length} viajero(s)`}
                    onSelect={onSelect}
                  />
                ))}
                {onCreateTripInFolder ? (
                  <button
                    type="button"
                    className="space-item space-item-add"
                    onClick={() => onCreateTripInFolder(folder.id)}
                  >
                    + Viaje en {folder.name}
                  </button>
                ) : null}
              </div>
            )
          })}
          {section.items.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              active={activeSpaceId === space.id}
              meta={spaceMeta(space)}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </>
  )
}
