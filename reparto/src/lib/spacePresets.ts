import type { BuiltinCategory, Space, SplitMode } from '../types'
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
  defaultSplitMode: SplitMode
  requiresIncome: boolean
  showBudgets: boolean
  isFolder: boolean
  /** Tipo de espacio hijo (solo carpetas) */
  childKind?: Space['kind']
  /** Etiqueta plural del hijo en carpetas */
  childLabel?: string
  defaultCategory: BuiltinCategory
  categoryIds: string[] | null
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
    defaultSplitMode: 'income',
    requiresIncome: true,
    showBudgets: true,
    isFolder: false,
    defaultCategory: 'comida',
    categoryIds: null,
  },
  viajes: {
    icon: 'luggage',
    totalLabel: 'Total en viajes',
    peopleLabel: 'Viajeros',
    expenseButton: 'Nuevo viaje',
    emptyTitle: 'Tu carpeta de viajes',
    description:
      'Agrupa cada viaje por separado: Mendoza, playa, fin de semana…',
    suggestedCategories: 'Un viaje = un espacio adentro',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: false,
    isFolder: true,
    childKind: 'viaje',
    childLabel: 'viaje',
    defaultCategory: 'viaje',
    categoryIds: null,
  },
  viaje: {
    icon: 'plane',
    totalLabel: 'Total del viaje',
    peopleLabel: 'Viajeros',
    expenseButton: 'Gasto del viaje',
    emptyTitle: 'Empieza a planear el viaje',
    description:
      'Transporte, alojamiento y salidas. Reparto 50/50 por defecto, sin sueldos.',
    suggestedCategories: 'Transporte · Alojamiento · Comida · Actividades',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: true,
    isFolder: false,
    defaultCategory: 'transporte',
    categoryIds: [
      'transporte',
      'viaje',
      'comida',
      'entretenimiento',
      'compras',
      'otros',
    ],
  },
  salidas: {
    icon: 'utensils',
    totalLabel: 'Total en salidas',
    peopleLabel: 'Quién va',
    expenseButton: 'Nueva salida',
    emptyTitle: 'Tu carpeta de salidas',
    description: 'Agrupa cenas, almuerzos y cafés con amigos.',
    suggestedCategories: 'Una salida = un espacio adentro',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: false,
    isFolder: true,
    childKind: 'salida',
    childLabel: 'salida',
    defaultCategory: 'comida',
    categoryIds: null,
  },
  salida: {
    icon: 'utensils',
    totalLabel: 'Total de la salida',
    peopleLabel: 'Quién va',
    expenseButton: 'Gasto de la salida',
    emptyTitle: 'Listos para salir',
    description:
      'Cena, almuerzo o café entre amigos. Solo nombres y reparto 50/50.',
    suggestedCategories: 'Comida · Propina · Extras',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: false,
    isFolder: false,
    defaultCategory: 'comida',
    categoryIds: ['comida', 'entretenimiento', 'otros'],
  },
  eventos: {
    icon: 'party-popper',
    totalLabel: 'Total en eventos',
    peopleLabel: 'Participantes',
    expenseButton: 'Nuevo evento',
    emptyTitle: 'Tu carpeta de eventos',
    description: 'Cumpleaños, asados y salidas grupales en un solo lugar.',
    suggestedCategories: 'Un evento = un espacio adentro',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: false,
    isFolder: true,
    childKind: 'evento',
    childLabel: 'evento',
    defaultCategory: 'entretenimiento',
    categoryIds: null,
  },
  evento: {
    icon: 'party-popper',
    totalLabel: 'Costo del evento',
    peopleLabel: 'Participantes',
    expenseButton: 'Gasto del evento',
    emptyTitle: 'Prepara el evento',
    description:
      'Cumpleaños, asados o salidas grupales. Reparto en partes iguales.',
    suggestedCategories: 'Comida · Entretenimiento · Regalos',
    defaultSplitMode: 'equal',
    requiresIncome: false,
    showBudgets: true,
    isFolder: false,
    defaultCategory: 'entretenimiento',
    categoryIds: ['comida', 'entretenimiento', 'compras', 'otros'],
  },
  otros: {
    icon: 'folder',
    totalLabel: 'Total agrupado',
    peopleLabel: 'Personas',
    expenseButton: 'Nuevo espacio',
    emptyTitle: 'Tu carpeta miscelánea',
    description: 'Agrupa espacios que no encajan en hogar, viaje o evento.',
    suggestedCategories: 'Un espacio = una cuenta adentro',
    defaultSplitMode: 'income',
    requiresIncome: true,
    showBudgets: false,
    isFolder: true,
    childKind: 'otro',
    childLabel: 'espacio',
    defaultCategory: 'otros',
    categoryIds: null,
  },
  otro: {
    icon: 'folder',
    totalLabel: 'Total del período',
    peopleLabel: 'Personas',
    expenseButton: 'Registrar gasto',
    emptyTitle: 'Espacio listo',
    description: 'Un espacio flexible para organizar cualquier cuenta.',
    suggestedCategories: 'Todas las categorías',
    defaultSplitMode: 'income',
    requiresIncome: true,
    showBudgets: true,
    isFolder: false,
    defaultCategory: 'otros',
    categoryIds: null,
  },
}

const FOLDER_CHILD: Partial<Record<Space['kind'], Space['kind']>> = {
  viajes: 'viaje',
  salidas: 'salida',
  eventos: 'evento',
  otros: 'otro',
}

const CHILD_FOLDER: Partial<Record<Space['kind'], Space['kind']>> = {
  viaje: 'viajes',
  salida: 'salidas',
  evento: 'eventos',
  otro: 'otros',
}

export const CHILD_KINDS_WITH_FOLDER = Object.keys(CHILD_FOLDER) as Space['kind'][]

export function presetForSpace(space: Pick<Space, 'kind'>): SpacePreset {
  return SPACE_PRESETS[space.kind]
}

export function isFolderSpace(space: Pick<Space, 'kind'>): boolean {
  return SPACE_PRESETS[space.kind].isFolder
}

export function childKindForFolder(folderKind: Space['kind']): Space['kind'] | null {
  return FOLDER_CHILD[folderKind] ?? null
}

export function folderKindForChild(childKind: Space['kind']): Space['kind'] | null {
  return CHILD_FOLDER[childKind] ?? null
}

export function childSpacesOf(spaces: Space[], folderId: string): Space[] {
  return spaces.filter((space) => space.parentSpaceId === folderId)
}

export function foldersForChildKind(
  spaces: Space[],
  childKind: Space['kind'],
): Space[] {
  const folderKind = folderKindForChild(childKind)
  if (!folderKind) return []
  return spaces.filter((space) => space.kind === folderKind)
}

/** @deprecated use foldersForChildKind(spaces, 'viaje') */
export function viajesFolders(spaces: Space[]): Space[] {
  return foldersForChildKind(spaces, 'viaje')
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
