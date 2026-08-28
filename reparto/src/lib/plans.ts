import type { Household, PlanLimits, PlanTier, Space } from '../types'
import { currentMonth, shiftMonth } from './format'
import { expenseSpaces } from './householdHub'

export const UNLIMITED = 99

export const PLAN_PRICING: Record<
  PlanTier,
  { priceLabel: string; priceNote: string; checkoutNote: string }
> = {
  personal: {
    priceLabel: 'Gratis',
    priceNote: 'Para siempre',
    checkoutNote: 'No requiere pago',
  },
  family: {
    priceLabel: 'USD 4/mes',
    priceNote: 'Facturación mensual · ~CLP 3.800',
    checkoutNote: 'Cuotas, presupuestos y categorías personalizadas',
  },
  plus: {
    priceLabel: 'USD 8/mes',
    priceNote: 'Facturación mensual · ~CLP 7.600',
    checkoutNote: 'Ahorros, cotizaciones, multimoneda y exportación avanzada',
  },
}

export const PLAN_FEATURE_LIST: Record<PlanTier, string[]> = {
  personal: [
    '1 persona · 1 espacio compartido',
    'Historial de 3 meses',
    'Gastos manuales (100% personales)',
    'Saldos del mes actual',
    'Categorías del sistema',
  ],
  family: [
    'Hasta 3 personas · 3 espacios',
    'Historial ilimitado',
    'Compras en cuotas y proyección de deuda',
    'Presupuestos mensuales con alertas',
    'Categorías personalizadas',
  ],
  plus: [
    'Personas y espacios ilimitados',
    'Espacios personales privados',
    'Metas de ahorro y planificador de compras',
    'Multimoneda por gasto',
    'Escaneo de comprobantes',
    'Exportación avanzada PDF / Excel',
  ],
}

export const PLAN_COPY: Record<PlanTier, { summary: string; intendedFor: string }> = {
  personal: {
    intendedFor: 'Empezar solo',
    summary: 'Lo esencial para registrar gastos y ver saldos del mes.',
  },
  family: {
    intendedFor: 'Pareja o hogar chico',
    summary: 'Control total del día a día con cuotas, presupuestos y categorías personalizadas.',
  },
  plus: {
    intendedFor: 'Familias y planificación larga',
    summary: 'Planificación de vida financiera: metas, compras grandes y multimoneda.',
  },
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  personal: {
    tier: 'personal',
    label: 'Básico',
    tagline: 'Lo esencial para empezar',
    maxMembers: 1,
    maxSpaces: 1,
    maxExpensesPerSpace: 9999,
    historyMonths: 3,
    features: {
      expenseSplit: false,
      budgets: false,
      installments: false,
      personalSpaces: false,
      customCategories: false,
      savings: false,
      wishlist: false,
      multipleCurrencies: false,
      receiptScan: false,
      advancedExport: false,
    },
  },
  family: {
    tier: 'family',
    label: 'A la PaR Pro',
    tagline: 'Control total del día a día',
    maxMembers: 3,
    maxSpaces: 3,
    maxExpensesPerSpace: 9999,
    historyMonths: null,
    features: {
      expenseSplit: true,
      budgets: true,
      installments: true,
      personalSpaces: false,
      customCategories: true,
      savings: false,
      wishlist: false,
      multipleCurrencies: false,
      receiptScan: false,
      advancedExport: false,
    },
  },
  plus: {
    tier: 'plus',
    label: 'Premium',
    tagline: 'Planificación de vida financiera',
    maxMembers: UNLIMITED,
    maxSpaces: UNLIMITED,
    maxExpensesPerSpace: 9999,
    historyMonths: null,
    features: {
      expenseSplit: true,
      budgets: true,
      installments: true,
      personalSpaces: true,
      customCategories: true,
      savings: true,
      wishlist: true,
      multipleCurrencies: true,
      receiptScan: true,
      advancedExport: true,
    },
  },
}

export type PlanFeatureKey = keyof PlanLimits['features']

export const PLAN_FEATURE_ROWS: { key: PlanFeatureKey; label: string; minTier: PlanTier }[] = [
  { key: 'budgets', label: 'Presupuestos mensuales', minTier: 'family' },
  { key: 'installments', label: 'Compras en cuotas', minTier: 'family' },
  { key: 'personalSpaces', label: 'Espacios personales', minTier: 'plus' },
  { key: 'customCategories', label: 'Categorías personalizadas', minTier: 'family' },
  { key: 'savings', label: 'Metas de ahorro y proyectos', minTier: 'plus' },
  { key: 'wishlist', label: 'Planificador de compras', minTier: 'plus' },
  { key: 'multipleCurrencies', label: 'Multimoneda', minTier: 'plus' },
  { key: 'receiptScan', label: 'Escaneo de comprobantes', minTier: 'plus' },
  { key: 'advancedExport', label: 'Exportación PDF / Excel', minTier: 'plus' },
]

export type PricingCellValue =
  | { kind: 'text'; value: string }
  | { kind: 'included' }
  | { kind: 'excluded' }

/** Filas consolidadas de la tabla comparativa (una fila por concepto). */
export const PRICING_TABLE_ROWS: {
  id: string
  label: string
  personal: PricingCellValue
  family: PricingCellValue
  plus: PricingCellValue
}[] = [
  {
    id: 'members',
    label: 'Límite de Personas',
    personal: { kind: 'text', value: 'Hasta 1' },
    family: { kind: 'text', value: 'Hasta 3' },
    plus: { kind: 'text', value: 'Ilimitadas' },
  },
  {
    id: 'spaces',
    label: 'Espacios de Gastos',
    personal: { kind: 'text', value: '1 espacio' },
    family: { kind: 'text', value: 'Hasta 3' },
    plus: { kind: 'text', value: 'Ilimitados' },
  },
  {
    id: 'history',
    label: 'Historial de Datos',
    personal: { kind: 'text', value: '3 meses' },
    family: { kind: 'text', value: 'Ilimitado' },
    plus: { kind: 'text', value: 'Ilimitado' },
  },
  {
    id: 'register-split',
    label: 'Registro y División 50/50',
    personal: { kind: 'excluded' },
    family: { kind: 'included' },
    plus: { kind: 'included' },
  },
  {
    id: 'dashboard',
    label: 'Dashboard Mensual',
    personal: { kind: 'included' },
    family: { kind: 'included' },
    plus: { kind: 'included' },
  },
  {
    id: 'installments',
    label: 'Compras en Cuotas',
    personal: { kind: 'excluded' },
    family: { kind: 'included' },
    plus: { kind: 'included' },
  },
  {
    id: 'budgets',
    label: 'Presupuestos Mensuales',
    personal: { kind: 'excluded' },
    family: { kind: 'included' },
    plus: { kind: 'included' },
  },
  {
    id: 'custom-categories',
    label: 'Categorías Personalizadas',
    personal: { kind: 'excluded' },
    family: { kind: 'included' },
    plus: { kind: 'included' },
  },
  {
    id: 'savings',
    label: 'Proyectos de Ahorro',
    personal: { kind: 'excluded' },
    family: { kind: 'excluded' },
    plus: { kind: 'included' },
  },
  {
    id: 'wishlist',
    label: 'Planificador (Cotizaciones)',
    personal: { kind: 'excluded' },
    family: { kind: 'excluded' },
    plus: { kind: 'included' },
  },
  {
    id: 'personal-spaces',
    label: 'Espacios Personales',
    personal: { kind: 'excluded' },
    family: { kind: 'excluded' },
    plus: { kind: 'included' },
  },
  {
    id: 'multicurrency',
    label: 'Multimoneda',
    personal: { kind: 'excluded' },
    family: { kind: 'excluded' },
    plus: { kind: 'included' },
  },
]

export function limitsFor(tier: PlanTier | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'family']
}

export function formatPlanCap(value: number): string {
  return value >= UNLIMITED ? 'Ilimitado' : String(value)
}

export function formatPlanCapNote(value: number): string | null {
  return value >= UNLIMITED ? `hasta ${UNLIMITED}` : null
}

export function formatPlanUsage(current: number, max: number): string {
  return `${current}/${formatPlanCap(max)}`
}

export function formatExpenseCap(value: number): string {
  return value >= 9999 ? 'Ilimitado' : String(value)
}

export function tierIncludesFeature(tier: PlanTier, key: PlanFeatureKey): boolean {
  return limitsFor(tier).features[key]
}

export function minimumTierForFeature(key: PlanFeatureKey): PlanTier {
  const row = PLAN_FEATURE_ROWS.find((item) => item.key === key)
  return row?.minTier ?? 'plus'
}

export function canAccessHistoryMonth(tier: PlanTier, monthKey: string): boolean {
  const { historyMonths } = limitsFor(tier)
  if (historyMonths == null) return true
  if (monthKey === 'all') return false
  const oldest = shiftMonth(currentMonth(), -(historyMonths - 1))
  return monthKey >= oldest
}

export function canAddHouseholdMember(household: Household): boolean {
  return household.memberEmails.length < limitsFor(household.planTier).maxMembers
}

export function canAddSpace(household: Household, spaces: Space[]): boolean {
  return expenseSpaces(spaces).length < limitsFor(household.planTier).maxSpaces
}

export function canAddExpense(tier: PlanTier, space: Space): boolean {
  return space.expenses.length < limitsFor(tier).maxExpensesPerSpace
}
