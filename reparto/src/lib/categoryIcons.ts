export const CATEGORY_ICON_NAMES = {
  comida: 'utensils',
  transporte: 'bus',
  vivienda: 'home',
  servicios: 'lightbulb',
  entretenimiento: 'gamepad-2',
  compras: 'shopping-bag',
  salud: 'pill',
  viaje: 'plane',
  otros: 'sparkles',
} as const

export type LucideIconName =
  | (typeof CATEGORY_ICON_NAMES)[keyof typeof CATEGORY_ICON_NAMES]
  | string
