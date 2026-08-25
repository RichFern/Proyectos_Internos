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
  /** Ingreso base (si un mes no tiene override) */
  income: number
  /** Overrides por mes YYYY-MM → ingreso de ese mes */
  incomeByMonth?: Record<string, number>
  color: string
  createdAt: string
}

export interface InstallmentPlan {
  id: string
  description: string
  category: ExpenseCategory
  /** Monto total de la compra */
  totalAmount: number
  installmentCount: number
  /** Quién paga las cuotas (tarjeta / efectivo) */
  paidById: string
  splitMode: SplitMode
  /** Vacío = todos; un solo id = gasto personal */
  participantIds: string[]
  /** Fecha de la 1ª cuota (YYYY-MM-DD) */
  startDate: string
  notes?: string
  createdAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  paidById: string
  date: string
  /** Vencimiento (útil en cuotas / servicios) */
  dueDate?: string
  splitMode: SplitMode
  /** IDs de participantes; vacío = todos */
  participantIds: string[]
  customShares?: Record<string, number>
  notes?: string
  templateId?: string
  /** Plan de cuotas al que pertenece */
  installmentPlanId?: string
  /** N° de cuota (1..N) */
  installmentNumber?: number
  installmentTotal?: number
  createdAt: string
}

export interface ExpenseTemplate {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  paidById: string
  splitMode: SplitMode
  participantIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SettlementRecord {
  id: string
  fromId: string
  toId: string
  amount: number
  date: string
  /** YYYY-MM del período (mes del gasto) */
  periodMonth?: string
  note?: string
  createdAt: string
}

export interface Space {
  id: string
  name: string
  description: string
  kind: 'hogar' | 'viaje' | 'evento' | 'otro'
  /** shared = todos; personal = solo ownerKey */
  visibility?: 'shared' | 'personal'
  /** Email (Google) o local:nombre — dueño del espacio personal */
  ownerKey?: string | null
  members: Member[]
  expenses: Expense[]
  templates: ExpenseTemplate[]
  installmentPlans: InstallmentPlan[]
  settlementRecords?: SettlementRecord[]
  /** YYYY-MM → categoría → tope */
  budgetsByMonth?: Record<string, Partial<Record<ExpenseCategory, number>>>
  createdAt: string
  updatedAt: string
}

export interface AppData {
  spaces: Space[]
  activeSpaceId: string | null
  localIdentity?: { name: string; email?: string } | null
}

export interface MemberBalance {
  memberId: string
  name: string
  color: string
  income: number
  incomeShare: number
  paid: number
  owes: number
  net: number
}

export interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface PersonMonthStats {
  memberId: string
  name: string
  color: string
  income: number
  incomeShare: number
  paid: number
  share: number
  net: number
  /** Gastos que pagó */
  paidExpenses: Expense[]
  /** Gastos donde participa (incluye personales) */
  participatedExpenses: Expense[]
  /** Solo suyos (un participante = esa persona) */
  personalPaid: number
  personalShare: number
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
