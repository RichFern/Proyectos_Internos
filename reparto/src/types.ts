export type SplitMode = 'income' | 'equal' | 'custom'
export type PlanTier = 'personal' | 'family' | 'plus'
export type HouseholdRole = 'owner' | 'admin' | 'member'
export type BudgetType = 'category' | 'total' | 'savings'

export type BuiltinCategory =
  | 'comida'
  | 'transporte'
  | 'vivienda'
  | 'servicios'
  | 'entretenimiento'
  | 'compras'
  | 'salud'
  | 'viaje'
  | 'otros'

export type ExpenseCategory = BuiltinCategory | (string & {})

export interface Member {
  id: string
  name: string
  /** Ingreso base (si un mes no tiene override) */
  income: number
  /** Overrides por mes YYYY-MM → ingreso de ese mes */
  incomeByMonth?: Record<string, number>
  /** Porcentaje acordado permanente del espacio (debe sumar 100 entre todos) */
  contributionPercent?: number
  color: string
  createdAt: string
  /** Usuario Google vinculado a esta persona (opcional) */
  userUid?: string
  /** Pedir confirmación del monto cada mes */
  incomeVariable?: boolean
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
  customShares?: Record<string, number>
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
  /** Hay una foto de ticket guardada en este dispositivo */
  hasReceipt?: boolean
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
  /** Medio de pago (débito, crédito, transferencia…) */
  paymentMethod?: string
  /** Estimado que aún no llegó: reserva presupuesto */
  provisional?: boolean
  /** Mes al que imputa el gasto (YYYY-MM). Si falta, se usa la fecha */
  accountingMonth?: string
  /** Moneda de este gasto; si falta, usa la del espacio */
  currency?: string
}

export interface ExpenseTemplate {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  paidById: string
  splitMode: SplitMode
  participantIds: string[]
  customShares?: Record<string, number>
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
  kind: 'hogar' | 'viajes' | 'viaje' | 'salidas' | 'salida' | 'eventos' | 'evento' | 'otros' | 'otro'
  /** Espacio dentro de una carpeta del mismo tipo */
  parentSpaceId?: string
  /** Emoji propio; si falta se usa el del tipo */
  icon?: string
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
  alertSettings?: {
    dueEnabled: boolean
    dueDays: number
    budgetEnabled: boolean
  }
  customCategories?: { id: string; label: string }[]
  /** Medios de pago propios, además de los preescritos */
  paymentMethods?: string[]
  /** Moneda del espacio (ISO 4217). Por defecto CLP */
  currency?: string
  /** Metas de ahorro del espacio */
  savingsGoals?: SavingsGoal[]
  /** Movimientos hacia metas de ahorro */
  savingsMovements?: SavingsMovement[]
  /** Lista de compras planificadas */
  wishlistItems?: WishlistItem[]
  /** Espacio interno para ahorros/cotizaciones globales (no aparece en gastos) */
  moduleHub?: boolean
  createdAt: string
  updatedAt: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  color: string
  /** Fecha objetivo opcional (YYYY-MM-DD) */
  deadline?: string
  note?: string
  /** shared = meta del hogar; personal = solo una persona */
  visibility?: 'shared' | 'personal'
  ownerMemberId?: string
  createdAt: string
}

export interface SavingsMovement {
  id: string
  goalId: string
  amount: number
  /** Fecha real del depósito (YYYY-MM-DD) */
  date: string
  /** Mes al que corresponde el esfuerzo de ahorro (YYYY-MM) */
  accountingMonth?: string
  note?: string
  memberId?: string
  createdAt: string
}

export interface WishlistQuote {
  store: string
  url?: string
  price: number
  currency?: string
  /** Precio de referencia / lista para marcar ofertas */
  listPrice?: number
  /** IDs de miembros que aprueban esta opción */
  approvedByMemberIds?: string[]
  updatedAt: string
}

export interface WishlistItem {
  id: string
  title: string
  notes?: string
  quotes: WishlistQuote[]
  /** Índice de la cotización elegida como mejor opción */
  bestQuoteIndex?: number
  status: 'research' | 'ready' | 'bought'
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export interface AppData {
  spaces: Space[]
  activeSpaceId: string | null
  localIdentity?: { name: string; email?: string; defaultCurrency?: string } | null
}

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  displayName: string
  photoURL?: string
  /** Moneda habitual al crear espacios nuevos */
  defaultCurrency?: string
  createdAt: string
  updatedAt: string
}

export interface Household {
  id: string
  name: string
  ownerUid: string
  memberUids: string[]
  memberEmails: string[]
  memberUidByEmail?: Record<string, string>
  /** Nombre visible por email; el listado de familia no muestra el correo */
  memberNamesByEmail?: Record<string, string>
  roles: Record<string, HouseholdRole>
  planTier: PlanTier
  createdAt: string
  updatedAt: string
}

export interface PlanLimits {
  tier: PlanTier
  label: string
  tagline: string
  maxMembers: number
  maxSpaces: number
  maxExpensesPerSpace: number
  /** null = historial ilimitado */
  historyMonths: number | null
  features: {
    expenseSplit: boolean
    budgets: boolean
    installments: boolean
    personalSpaces: boolean
    customCategories: boolean
    savings: boolean
    wishlist: boolean
    multipleCurrencies: boolean
    receiptScan: boolean
    advancedExport: boolean
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

export const CATEGORY_LABELS: Record<BuiltinCategory, string> = {
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
  viajes: 'Carpeta de viajes',
  viaje: 'Viaje',
  salidas: 'Carpeta de salidas',
  salida: 'Salida a comer',
  eventos: 'Carpeta de eventos',
  evento: 'Evento / salida grupal',
  otros: 'Carpeta miscelánea',
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
