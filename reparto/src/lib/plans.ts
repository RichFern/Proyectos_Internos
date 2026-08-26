import type { Household, PlanLimits, PlanTier, Space } from '../types'

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
    },
  },
}

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

