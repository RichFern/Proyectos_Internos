export type SplitMode = 'income' | 'equal' | 'custom'
export type PlanTier = 'personal' | 'family' | 'plus'
export type HouseholdRole = 'owner' | 'admin' | 'member'
export type BudgetType = 'category' | 'total' | 'savings'

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
  /** Usuario Google vinculado a esta persona (opcional) */
  userUid?: string
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
  visibility?: 'shared' | 'personal'
  ownerUid?: string | null
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
  /** Un gasto personal solo es visible para quien lo creó */
  visibility?: 'shared' | 'personal'
  ownerUid?: string | null
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
  visibility?: 'shared' | 'personal'
  ownerUid?: string | null
  recurrence?: {
    frequency: 'monthly'
    dayOfMonth: number
    active: boolean
  }
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
  /** UID Google del dueño; se usa para privacidad real en la nube */
  ownerUid?: string | null
  members: Member[]
  expenses: Expense[]
  templates: ExpenseTemplate[]
  installmentPlans: InstallmentPlan[]
  settlementRecords?: SettlementRecord[]
  /** YYYY-MM → categoría → tope */
  budgetsByMonth?: Record<string, Partial<Record<ExpenseCategory, number>>>
  budgetSettings?: {
    type: BudgetType
    recurring: boolean
    defaultByCategory?: Partial<Record<ExpenseCategory, number>>
    totalLimit?: number
    savingsGoal?: number
  }
  createdAt: string
  updatedAt: string
}

export interface AppData {
  spaces: Space[]
  activeSpaceId: string | null
  localIdentity?: { name: string; email?: string } | null
}

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  displayName: string
  photoURL?: string
  createdAt: string
  updatedAt: string
}

export interface Household {
  id: string
  name: string
  ownerUid: string
  memberUids: string[]
  memberEmails: string[]
  roles: Record<string, HouseholdRole>
  planTier: PlanTier
  createdAt: string
  updatedAt: string
}

export interface PlanLimits {
  tier: PlanTier
  label: string
  maxMembers: number
  maxSpaces: number
  maxExpensesPerSpace: number
  features: {
    budgets: boolean
    installments: boolean
    export: boolean
    personalSpaces: boolean
    multipleCurrencies: boolean
  }
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
  '#FF7F50',
  '#008080',
  '#3CB371',
  '#FFA500',
  '#3D5A80',
  '#A15C6E',
  '#5C6B4A',
  '#6B4F3A',
]
