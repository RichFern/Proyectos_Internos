import type { Space } from '../types'
import { childSpacesOf, isFolderSpace } from './spacePresets'

export type SpaceSectionId = 'hogar' | 'viajes' | 'salidas' | 'eventos' | 'otros'

export interface SpaceFolderGroup {
  folder: Space
  trips: Space[]
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

function sectionForKind(kind: Space['kind']): SpaceSectionId {
  if (kind === 'hogar') return 'hogar'
  if (kind === 'viajes' || kind === 'viaje') return 'viajes'
  if (kind === 'salida') return 'salidas'
  if (kind === 'evento') return 'eventos'
  return 'otros'
}

function sortByName(a: Space, b: Space): number {
  return a.name.localeCompare(b.name, 'es')
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
      map.get('viajes')!.folders.push({
        folder: space,
        trips: childSpacesOf(allSpaces, space.id),
      })
      continue
    }
    if (space.kind === 'viaje' && hasKnownParent(space, allSpaces)) continue

    map.get(sectionForKind(space.kind))!.items.push(space)
  }

  for (const section of map.values()) {
    section.items.sort(sortByName)
    section.folders.sort((a, b) => sortByName(a.folder, b.folder))
    for (const folder of section.folders) {
      folder.trips.sort(sortByName)
    }
  }

  return SECTION_ORDER.map((id) => map.get(id)!).filter(
    (section) => section.items.length > 0 || section.folders.length > 0,
  )
}
