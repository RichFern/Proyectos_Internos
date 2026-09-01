import type { Space } from '../types'
import { isFolderSpace } from './spacePresets'

/** Última actividad del espacio (edición o gasto más reciente). */
export function spaceActivityAt(space: Space): string {
  let latest = space.updatedAt || space.createdAt || ''
  for (const expense of space.expenses) {
    if (expense.createdAt > latest) latest = expense.createdAt
  }
  for (const template of space.templates) {
    if (template.updatedAt > latest) latest = template.updatedAt
  }
  return latest
}

export function sortSpacesByRecent(spaces: Space[]): Space[] {
  return [...spaces].sort((a, b) =>
    spaceActivityAt(b).localeCompare(spaceActivityAt(a)),
  )
}

export function recentSpaces(spaces: Space[], limit = 5): Space[] {
  return sortSpacesByRecent(spaces.filter((space) => !isFolderSpace(space))).slice(
    0,
    limit,
  )
}

export function formatRecentLabel(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
