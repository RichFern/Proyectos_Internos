import type { Household, PlanLimits, PlanTier, Space } from '../types'

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
    checkoutNote: 'Presupuestos, cuotas, exportar, ahorros y cotizaciones',
  },
  plus: {
    priceLabel: 'USD 8/mes',
    priceNote: 'Facturación mensual · ~CLP 7.600',
    checkoutNote: 'Todo lo de Familia + multimoneda y más límites',
  },
}

export const PLAN_FEATURE_LIST: Record<PlanTier, string[]> = {
  personal: [
    '1 espacio compartido',
    'Hasta 50 gastos',
    'Reparto básico',
  ],
  family: [
    'Hasta 3 integrantes y 3 espacios',
    'Presupuestos, cuotas y exportar',
    'Ahorros y cotizaciones',
    'Espacios personales',
  ],
  plus: [
    'Hasta 8 integrantes y 20 espacios',
    'Multimoneda por gasto',
    'Todo lo de Familia',
    'Límites ampliados',
  ],
}

export const PLAN_COPY: Record<PlanTier, { summary: string; intendedFor: string }> = {
  personal: {
    intendedFor: 'Una sola persona',
    summary: 'Ordenar gastos propios, sin compartir el hogar.',
  },
  family: {
    intendedFor: 'Un hogar chico',
    summary: 'Hasta 3 personas, con presupuestos, cuotas y espacios personales.',
  },
  plus: {
    intendedFor: 'Familias más grandes',
    summary: 'Más integrantes y espacios, pensado para varias cuentas a la vez.',
  },
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  personal: {
    tier: 'personal',
    label: 'Personal',
    maxMembers: 1,
    maxSpaces: 1,
    maxExpensesPerSpace: 50,
    features: {
      budgets: false,
      installments: false,
      export: false,
      personalSpaces: false,
      multipleCurrencies: false,
      savings: false,
      wishlist: false,
    },
  },
  family: {
    tier: 'family',
    label: 'Familia',
    maxMembers: 3,
    maxSpaces: 3,
    maxExpensesPerSpace: 500,
    features: {
      budgets: true,
      installments: true,
      export: true,
      personalSpaces: true,
      multipleCurrencies: false,
      savings: true,
      wishlist: true,
    },
  },
  plus: {
    tier: 'plus',
    label: 'Plus',
    maxMembers: 8,
    maxSpaces: 20,
    maxExpensesPerSpace: 5000,
    features: {
      budgets: true,
      installments: true,
      export: true,
      personalSpaces: true,
      multipleCurrencies: true,
      savings: true,
      wishlist: true,
    },
  },
}

export const PLAN_FEATURE_ROWS: {
  key: keyof PlanLimits['features']
  label: string
}[] = [
  { key: 'budgets', label: 'Presupuestos' },
  { key: 'installments', label: 'Compras en cuotas' },
  { key: 'export', label: 'Exportar cartola' },
  { key: 'savings', label: 'Ahorros' },
  { key: 'wishlist', label: 'Cotizaciones' },
  { key: 'multipleCurrencies', label: 'Multimoneda' },
  { key: 'personalSpaces', label: 'Espacios personales' },
]

export function limitsFor(tier: PlanTier | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'family']
}

export function canAddHouseholdMember(household: Household): boolean {
  return household.memberEmails.length < limitsFor(household.planTier).maxMembers
}

export function canAddSpace(household: Household, spaces: Space[]): boolean {
  return spaces.length < limitsFor(household.planTier).maxSpaces
}

export function canAddExpense(tier: PlanTier, space: Space): boolean {
  return space.expenses.length < limitsFor(tier).maxExpensesPerSpace
}

