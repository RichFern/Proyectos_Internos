import type { Space } from '../types'
import type { LucideIconName } from '../lib/categoryIcons'
import { resolveIconName } from '../lib/iconResolve'

export interface SpacePreset {
  icon: LucideIconName
  totalLabel: string
  peopleLabel: string
  expenseButton: string
  emptyTitle: string
  description: string
  suggestedCategories: string
}

export const SPACE_PRESETS: Record<Space['kind'], SpacePreset> = {
  hogar: {
    icon: 'home',
    totalLabel: 'Gasto del mes',
    peopleLabel: 'Integrantes',
    expenseButton: 'Gasto del hogar',
    emptyTitle: 'Tu hogar está listo',
    description: 'Ideal para alquiler, servicios, supermercado y gastos fijos.',
    suggestedCategories: 'Vivienda · Servicios · Comida',
  },
  viaje: {
    icon: 'plane',
    totalLabel: 'Total del viaje',
    peopleLabel: 'Viajeros',
    expenseButton: 'Gasto del viaje',
    emptyTitle: 'Empieza a planear el viaje',
    description: 'Todo el viaje en una vista: transporte, alojamiento y salidas.',
    suggestedCategories: 'Viaje · Transporte · Comida',
  },
  evento: {
    icon: 'party-popper',
    totalLabel: 'Costo del evento',
    peopleLabel: 'Participantes',
    expenseButton: 'Gasto del evento',
    emptyTitle: 'Prepara el evento',
    description: 'Para cumpleaños, cenas, regalos o cualquier salida grupal.',
    suggestedCategories: 'Entretenimiento · Comida · Compras',
  },
  otro: {
    icon: 'folder',
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

export function spaceIconName(space: Pick<Space, 'kind' | 'icon'>): LucideIconName {
  const fallback = presetForSpace(space).icon
  return resolveIconName(space.icon, fallback)
}

/** @deprecated use spaceIconName + SpaceIcon component */
export function spaceIcon(space: Pick<Space, 'kind' | 'icon'>): string {
  return spaceIconName(space)
}

export const SPACE_ICONS: LucideIconName[] = [
  'home',
  'house',
  'armchair',
  'key',
  'plane',
  'palmtree',
  'car',
  'bus',
  'party-popper',
  'cake',
  'utensils',
  'coffee',
  'music',
  'gamepad-2',
  'dog',
  'laptop',
  'graduation-cap',
  'heart',
  'moon',
  'flame',
  'rainbow',
  'trophy',
  'shopping-cart',
  'leaf',
  'wand-sparkles',
  'camera',
  'headphones',
  'luggage',
  'folder',
  'sparkles',
]
