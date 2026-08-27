import type { Space } from '../types'

export interface SpacePreset {
  icon: string
  totalLabel: string
  peopleLabel: string
  expenseButton: string
  emptyTitle: string
  description: string
  suggestedCategories: string
}

export const SPACE_PRESETS: Record<Space['kind'], SpacePreset> = {
  hogar: {
    icon: '🏠',
    totalLabel: 'Gasto del mes',
    peopleLabel: 'Integrantes',
    expenseButton: 'Gasto del hogar',
    emptyTitle: 'Tu hogar está listo',
    description: 'Ideal para alquiler, servicios, supermercado y gastos fijos.',
    suggestedCategories: 'Vivienda · Servicios · Comida',
  },
  viaje: {
    icon: '✈️',
    totalLabel: 'Total del viaje',
    peopleLabel: 'Viajeros',
    expenseButton: 'Gasto del viaje',
    emptyTitle: 'Empieza a planear el viaje',
    description: 'Todo el viaje en una vista: transporte, alojamiento y salidas.',
    suggestedCategories: 'Viaje · Transporte · Comida',
  },
  evento: {
    icon: '🎉',
    totalLabel: 'Costo del evento',
    peopleLabel: 'Participantes',
    expenseButton: 'Gasto del evento',
    emptyTitle: 'Prepara el evento',
    description: 'Para cumpleaños, cenas, regalos o cualquier salida grupal.',
    suggestedCategories: 'Entretenimiento · Comida · Compras',
  },
  otro: {
    icon: '📁',
    totalLabel: 'Total del período',
    peopleLabel: 'Personas',
    expenseButton: 'Registrar gasto',
    emptyTitle: 'Espacio listo',
    description: 'Un espacio flexible para organizar cualquier cuenta.',
    suggestedCategories: 'Todas las categorías',
  },
}

export function presetForSpace(space: Pick<Space, 'kind'>): SpacePreset {
  return SPACE_PRESETS[space.kind]
}

export function spaceIcon(space: Pick<Space, 'kind' | 'icon'>): string {
  const custom = space.icon?.trim()
  return custom || presetForSpace(space).icon
}

export const SPACE_ICONS = [
  '🏠',
  '🏡',
  '🛋️',
  '🔑',
  '✈️',
  '🏖️',
  '🚗',
  '🚌',
  '🎉',
  '🎂',
  '🥳',
  '🍕',
  '☕',
  '🎵',
  '🎮',
  '🏋️',
  '🐶',
  '💻',
  '🎓',
  '❤️',
  '🌙',
  '🔥',
  '🌈',
  '⚽',
  '🛒',
  '🌿',
  '🪄',
  '📸',
  '🎧',
  '🧳',
] as const

