import type { Space } from '../types'
import { childSpacesOf, isFolderSpace } from './spacePresets'
import { sortSpacesByRecent, spaceActivityAt } from './spaceActivity'

export type SpaceSectionId = 'hogar' | 'viajes' | 'salidas' | 'eventos' | 'otros'

export interface SpaceFolderGroup {
  folder: Space
  children: Space[]
}

export interface SpaceSection {
  id: SpaceSectionId
  label: string
  items: Space[]
  folders: SpaceFolderGroup[]
}

const SECTION_ORDER: SpaceSectionId[] = [
  'hogar',
  'viajes',
  'salidas',
  'eventos',
  'otros',
]

const SECTION_LABELS: Record<SpaceSectionId, string> = {
  hogar: 'Hogar',
  viajes: 'Viajes',
  salidas: 'Salidas',
  eventos: 'Eventos',
  otros: 'Otros',
}

function sectionForSpaceKind(kind: Space['kind']): SpaceSectionId {
  if (kind === 'hogar') return 'hogar'
  if (kind === 'viajes' || kind === 'viaje') return 'viajes'
  if (kind === 'salidas' || kind === 'salida') return 'salidas'
  if (kind === 'eventos' || kind === 'evento') return 'eventos'
  return 'otros'
}

function hasKnownParent(space: Space, allSpaces: Space[]): boolean {
  return Boolean(
    space.parentSpaceId &&
      allSpaces.some((item) => item.id === space.parentSpaceId),
  )
}

export function buildSpaceSections(allSpaces: Space[]): SpaceSection[] {
  const map = new Map<SpaceSectionId, SpaceSection>()
  for (const id of SECTION_ORDER) {
    map.set(id, { id, label: SECTION_LABELS[id], items: [], folders: [] })
  }

  for (const space of allSpaces) {
    if (isFolderSpace(space)) {
      const sectionId = sectionForSpaceKind(space.kind)
      map.get(sectionId)!.folders.push({
        folder: space,
        children: childSpacesOf(allSpaces, space.id),
      })
      continue
    }
    if (hasKnownParent(space, allSpaces)) continue

    map.get(sectionForSpaceKind(space.kind))!.items.push(space)
  }

  for (const section of map.values()) {
    section.items = sortSpacesByRecent(section.items)
    section.folders.sort((a, b) =>
      spaceActivityAt(b.folder).localeCompare(spaceActivityAt(a.folder)),
    )
    for (const folder of section.folders) {
      folder.children = sortSpacesByRecent(folder.children)
    }
  }

  return SECTION_ORDER.map((id) => map.get(id)!).filter(
    (section) => section.items.length > 0 || section.folders.length > 0,
  )
}

export function spaceSectionForKind(kind: Space['kind']): SpaceSectionId {
  return sectionForSpaceKind(kind)
}

export function sectionLabel(id: SpaceSectionId): string {
  return SECTION_LABELS[id]
}
