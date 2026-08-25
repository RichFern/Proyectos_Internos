export type SplitMode = 'income' | 'equal' | 'custom'

export type ExpenseCategory =
  | 'comida'
  | 'transporte'
  | 'vivienda'
  | 'servicios'
  | 'entretenimiento'
  | 'compras'
  | 'salud'
  | 'viaje'
  | 'otros'

export interface Member {
  id: string
  name: string
  /** Ingreso mensual (o estimado) usado para repartir en proporción */
  income: number
  color: string
  createdAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  /** Quién pagó */
  paidById: string
  date: string
  splitMode: SplitMode
  /** IDs de participantes; vacío = todos */
  participantIds: string[]
  /** Solo si splitMode === 'custom': porcentajes o montos por persona */
  customShares?: Record<string, number>
  notes?: string
  /** Si viene de una plantilla */
  templateId?: string
  createdAt: string
}

/** Gasto recurrente / plantilla (alquiler, luz, supermercado…) */
export interface ExpenseTemplate {
  id: string
  description: string
  /** Monto sugerido; se puede cambiar al repetir */
  amount: number
  category: ExpenseCategory
  paidById: string
  splitMode: SplitMode
  participantIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Space {
  id: string
  name: string
  description: string
  kind: 'hogar' | 'viaje' | 'evento' | 'otro'
  members: Member[]
  expenses: Expense[]
  templates: ExpenseTemplate[]
  createdAt: string
  updatedAt: string
}

export interface AppData {
  spaces: Space[]
  activeSpaceId: string | null
}

export interface MemberBalance {
  memberId: string
  name: string
  color: string
  income: number
  incomeShare: number
  paid: number
  owes: number
  /** Positivo = le deben; negativo = debe */
  net: number
}

export interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'>

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  comida: 'Comida',
  transporte: 'Transporte',
  vivienda: 'Vivienda',
  servicios: 'Servicios',
  entretenimiento: 'Entretenimiento',
  compras: 'Compras',
  salud: 'Salud',
  viaje: 'Viaje',
  otros: 'Otros',
}

export const KIND_LABELS: Record<Space['kind'], string> = {
  hogar: 'Hogar',
  viaje: 'Viaje / paseo',
  evento: 'Evento',
  otro: 'Otro',
}

export const MEMBER_COLORS = [
  '#2F6F5E',
  '#C45C26',
  '#3D5A80',
  '#8B5E3C',
  '#5C6B4A',
  '#A15C6E',
  '#4A6FA5',
  '#6B4F3A',
]
