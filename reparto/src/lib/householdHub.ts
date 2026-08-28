import type { Member, Space } from '../types'

export const MODULE_HUB_NAME = 'Módulos del hogar'

export function isModuleHubSpace(space: Space): boolean {
  return space.moduleHub === true
}

/** Espacios visibles en el módulo de gastos (sin hub interno). */
export function expenseSpaces(spaces: Space[]): Space[] {
  return spaces.filter((space) => !isModuleHubSpace(space))
}

export function findModuleHubSpace(spaces: Space[]): Space | null {
  return spaces.find(isModuleHubSpace) ?? null
}

/** Integrantes únicos de todos los espacios de gasto (para metas/cotizaciones globales). */
export function aggregateHouseholdMembers(spaces: Space[]): Member[] {
  const byId = new Map<string, Member>()
  for (const space of expenseSpaces(spaces)) {
    for (const member of space.members) {
      if (!byId.has(member.id)) byId.set(member.id, member)
    }
  }
  return [...byId.values()]
}
