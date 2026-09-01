import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { totalSpent } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { formatRecentLabel, recentSpaces, spaceActivityAt } from '../lib/spaceActivity'
import { buildSpaceSections } from '../lib/spaceGroups'
import { childKindForFolder, presetForSpace } from '../lib/spacePresets'
import { SpaceIcon, UiLock } from './AppIcon'

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  onSelect: (spaceId: string) => void
  onCreateInFolder?: (folderId: string, childKind: Space['kind']) => void
  showRecents?: boolean
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
  onCreateInFolder,
  showRecents = true,
}: Props) {
  const sections = buildSpaceSections(spaces)
  const recents = showRecents ? recentSpaces(spaces, 5) : []

  return (
    <>
      {recents.length > 1 ? (
        <div className="space-section space-section-recents">
          <div className="space-section-label">Recientes</div>
          {recents.map((space) => (
            <SpaceRow
              key={`recent-${space.id}`}
              space={space}
              active={activeSpaceId === space.id}
              meta={`${formatRecentLabel(spaceActivityAt(space))} · ${formatMoney(totalSpent(space))}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
      {sections.map((section) => (
        <div key={section.id} className="space-section">
          <div className="space-section-label">{section.label}</div>
          {section.folders.map(({ folder, children }) => {
            const preset = presetForSpace(folder)
            const childKind = childKindForFolder(folder.kind)
            const childLabel = preset.childLabel ?? 'espacio'
            const folderTotal = children.reduce(
              (sum, item) => sum + totalSpent(item),
              0,
            )
            return (
              <div key={folder.id} className="space-folder">
                <SpaceRow
                  space={folder}
                  active={activeSpaceId === folder.id}
                  meta={`${children.length} ${childLabel}(s) · ${formatMoney(folderTotal)}`}
                  onSelect={onSelect}
                />
                {children.map((item) => (
                  <SpaceRow
                    key={item.id}
                    space={item}
                    active={activeSpaceId === item.id}
                    nested
                    meta={`${formatMoney(totalSpent(item))} · ${item.members.length} pers.`}
                    onSelect={onSelect}
                  />
                ))}
                {onCreateInFolder && childKind ? (
                  <button
                    type="button"
                    className="space-item space-item-add"
                    onClick={() => onCreateInFolder(folder.id, childKind)}
                  >
                    + Nuevo en {folder.name}
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
