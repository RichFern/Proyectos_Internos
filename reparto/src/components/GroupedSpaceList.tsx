import { useEffect, useMemo, useState } from 'react'
import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { totalSpent } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { sortSpacesByRecent } from '../lib/spaceActivity'
import {
  buildSpaceSections,
  spaceSectionForKind,
  type SpaceSectionId,
} from '../lib/spaceGroups'
import { childKindForFolder, isFolderSpace } from '../lib/spacePresets'
import { SpaceIcon, UiLock } from './AppIcon'

const SECTION_COLLAPSE_KEY = 'a-la-par-sidebar-sections'
const FOLDER_COLLAPSE_KEY = 'a-la-par-sidebar-folders'

const DEFAULT_COLLAPSED_SECTIONS: SpaceSectionId[] = [
  'viajes',
  'salidas',
  'eventos',
  'otros',
]

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  query?: string
  onSelect: (spaceId: string) => void
  onCreateInFolder?: (folderId: string, childKind: Space['kind']) => void
}

function loadCollapsedSections(): Set<SpaceSectionId> {
  try {
    const raw = localStorage.getItem(SECTION_COLLAPSE_KEY)
    if (raw) return new Set(JSON.parse(raw) as SpaceSectionId[])
  } catch {
    /* ignore */
  }
  return new Set(DEFAULT_COLLAPSED_SECTIONS)
}

function loadCollapsedFolders(): Set<string> {
  try {
    const raw = localStorage.getItem(FOLDER_COLLAPSE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore */
  }
  return new Set()
}

function filterSpaces(spaces: Space[], query: string): Space[] {
  const q = query.trim().toLowerCase()
  if (!q) return spaces
  return spaces.filter((space) =>
    [space.name, space.description, KIND_LABELS[space.kind]]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

function sectionSpaceCount(section: ReturnType<typeof buildSpaceSections>[number]) {
  return (
    section.items.length +
    section.folders.reduce((sum, folder) => sum + folder.children.length, 0)
  )
}

function CompactSpaceRow({
  space,
  active,
  amount,
  nested = false,
  onSelect,
}: {
  space: Space
  active: boolean
  amount: string
  nested?: boolean
  onSelect: (spaceId: string) => void
}) {
  return (
    <button
      type="button"
      className={`space-item space-item-compact${nested ? ' space-item-nested' : ''}${active ? ' active' : ''}`}
      onClick={() => onSelect(space.id)}
      title={space.name}
    >
      <span className="space-item-leading">
        {space.visibility === 'personal' ? (
          <UiLock size={12} className="ui-icon ui-icon-lock ui-icon-inline" />
        ) : null}
        <SpaceIcon space={space} size={15} className="ui-icon ui-icon-inline" />
      </span>
      <span className="space-item-name">{space.name}</span>
      <span className="space-item-amount">{amount}</span>
    </button>
  )
}

export function GroupedSpaceList({
  spaces,
  activeSpaceId,
  query = '',
  onSelect,
  onCreateInFolder,
}: Props) {
  const [collapsedSections, setCollapsedSections] = useState(loadCollapsedSections)
  const [collapsedFolders, setCollapsedFolders] = useState(loadCollapsedFolders)

  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? null

  useEffect(() => {
    if (localStorage.getItem(FOLDER_COLLAPSE_KEY)) return
    const folderIds = spaces.filter((space) => isFolderSpace(space)).map((space) => space.id)
    if (folderIds.length === 0) return
    const next = new Set(folderIds)
    setCollapsedFolders(next)
    localStorage.setItem(FOLDER_COLLAPSE_KEY, JSON.stringify([...next]))
  }, [spaces])

  useEffect(() => {
    if (!activeSpace) return
    if (activeSpace.parentSpaceId) {
      setCollapsedFolders((prev) => {
        if (!prev.has(activeSpace.parentSpaceId!)) return prev
        const next = new Set(prev)
        next.delete(activeSpace.parentSpaceId!)
        localStorage.setItem(FOLDER_COLLAPSE_KEY, JSON.stringify([...next]))
        return next
      })
    }
    if (isFolderSpace(activeSpace)) {
      setCollapsedFolders((prev) => {
        if (!prev.has(activeSpace.id)) return prev
        const next = new Set(prev)
        next.delete(activeSpace.id)
        localStorage.setItem(FOLDER_COLLAPSE_KEY, JSON.stringify([...next]))
        return next
      })
    }
    const sectionId = spaceSectionForKind(activeSpace.kind)
    if (sectionId !== 'hogar') {
      setCollapsedSections((prev) => {
        if (!prev.has(sectionId)) return prev
        const next = new Set(prev)
        next.delete(sectionId)
        localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify([...next]))
        return next
      })
    }
  }, [activeSpace])

  const searching = Boolean(query.trim())
  const searchResults = useMemo(
    () => sortSpacesByRecent(filterSpaces(spaces, query)),
    [spaces, query],
  )
  const sections = useMemo(() => buildSpaceSections(spaces), [spaces])

  const toggleSection = (id: SpaceSectionId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      localStorage.setItem(FOLDER_COLLAPSE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  if (searching) {
    if (searchResults.length === 0) {
      return <p className="sidebar-empty">No hay espacios con ese nombre.</p>
    }
    return (
      <div className="space-section space-section-search">
        <div className="space-section-label">
          {searchResults.length} resultado{searchResults.length === 1 ? '' : 's'}
        </div>
        {searchResults.map((space) => (
          <CompactSpaceRow
            key={space.id}
            space={space}
            active={activeSpaceId === space.id}
            amount={formatMoney(totalSpent(space))}
            onSelect={onSelect}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {sections.map((section) => {
        const isHogar = section.id === 'hogar'
        const collapsed = !isHogar && collapsedSections.has(section.id)
        const count = sectionSpaceCount(section)

        return (
          <div
            key={section.id}
            className={`space-section${isHogar ? ' space-section-essential' : ''}`}
          >
            {isHogar ? (
              <div className="space-section-label space-section-label-fixed">
                {section.label}
              </div>
            ) : (
              <button
                type="button"
                className="space-section-toggle"
                aria-expanded={!collapsed}
                onClick={() => toggleSection(section.id)}
              >
                <span className="space-section-chevron" aria-hidden>
                  {collapsed ? '▸' : '▾'}
                </span>
                <span className="space-section-toggle-label">{section.label}</span>
                <span className="space-section-count">{count}</span>
              </button>
            )}

            {!collapsed ? (
              <div className="space-section-body">
                {section.folders.map(({ folder, children }) => {
                  const childKind = childKindForFolder(folder.kind)
                  const folderCollapsed = collapsedFolders.has(folder.id)
                  const folderTotal = children.reduce(
                    (sum, item) => sum + totalSpent(item),
                    0,
                  )
                  const folderActive =
                    activeSpaceId === folder.id ||
                    children.some((child) => child.id === activeSpaceId)

                  return (
                    <div
                      key={folder.id}
                      className={`space-folder${folderActive ? ' space-folder-active' : ''}`}
                    >
                      <div className="space-folder-head">
                        <button
                          type="button"
                          className="space-folder-chevron"
                          aria-expanded={!folderCollapsed}
                          aria-label={folderCollapsed ? 'Expandir carpeta' : 'Contraer carpeta'}
                          onClick={() => toggleFolder(folder.id)}
                        >
                          {folderCollapsed ? '▸' : '▾'}
                        </button>
                        <button
                          type="button"
                          className={`space-item space-item-compact space-item-folder-main${activeSpaceId === folder.id ? ' active' : ''}`}
                          onClick={() => onSelect(folder.id)}
                        >
                          <span className="space-item-leading">
                            <SpaceIcon
                              space={folder}
                              size={14}
                              className="ui-icon ui-icon-inline"
                            />
                          </span>
                          <span className="space-item-name">{folder.name}</span>
                          <span className="space-section-count">{children.length}</span>
                          <span className="space-item-amount">{formatMoney(folderTotal)}</span>
                        </button>
                      </div>
                      {!folderCollapsed ? (
                        <div className="space-folder-body">
                          {children.map((item) => (
                            <CompactSpaceRow
                              key={item.id}
                              space={item}
                              active={activeSpaceId === item.id}
                              nested
                              amount={formatMoney(totalSpent(item))}
                              onSelect={onSelect}
                            />
                          ))}
                          {onCreateInFolder && childKind ? (
                            <button
                              type="button"
                              className="space-item space-item-add space-item-add-compact"
                              onClick={() => onCreateInFolder(folder.id, childKind)}
                            >
                              + Agregar
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
                {section.items.map((space) => (
                  <CompactSpaceRow
                    key={space.id}
                    space={space}
                    active={activeSpaceId === space.id}
                    amount={formatMoney(totalSpent(space))}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}
