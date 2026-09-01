import type { PlanTier } from '../types'

const PREVIEW_KEY = 'reparto-plan-preview-v1'

export function loadPlanPreviewTier(): PlanTier | null {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY)
    if (!raw) return null
    if (raw === 'personal' || raw === 'family' || raw === 'plus') return raw
    return null
  } catch {
    return null
  }
}

export function setPlanPreviewTier(tier: PlanTier | null): void {
  try {
    if (!tier) {
      localStorage.removeItem(PREVIEW_KEY)
      return
    }
    localStorage.setItem(PREVIEW_KEY, tier)
  } catch {
    /* ignore */
  }
}

export function isPlanPreviewActive(): boolean {
  return loadPlanPreviewTier() != null
}
