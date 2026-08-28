import { useCallback, useEffect, useState } from 'react'
import type { PlanTier } from '../types'
import { loadPlanPreviewTier, setPlanPreviewTier } from '../lib/planPreview'

export function usePlanPreview() {
  const [previewTier, setPreviewTierState] = useState<PlanTier | null>(() =>
    loadPlanPreviewTier(),
  )

  useEffect(() => {
    const sync = () => setPreviewTierState(loadPlanPreviewTier())
    window.addEventListener('storage', sync)
    window.addEventListener('reparto-plan-preview', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('reparto-plan-preview', sync)
    }
  }, [])

  const setPreviewTier = useCallback((tier: PlanTier | null) => {
    setPlanPreviewTier(tier)
    setPreviewTierState(tier)
    window.dispatchEvent(new Event('reparto-plan-preview'))
  }, [])

  return { previewTier, setPreviewTier }
}

export function resolveEffectivePlanTier(input: {
  previewTier: PlanTier | null
  householdTier: PlanTier | null | undefined
  localDevelopment: boolean
}): PlanTier {
  if (input.previewTier) return input.previewTier
  if (input.householdTier) return input.householdTier
  if (input.localDevelopment) return 'plus'
  return 'family'
}
