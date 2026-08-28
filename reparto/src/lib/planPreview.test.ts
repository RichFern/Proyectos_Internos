import { resolveEffectivePlanTier } from '../hooks/usePlanPreview'
import { limitsFor } from './plans'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  resolveEffectivePlanTier({
    previewTier: 'plus',
    householdTier: 'personal',
    localDevelopment: false,
  }) === 'plus',
  'preview overrides household',
)

assert(
  resolveEffectivePlanTier({
    previewTier: null,
    householdTier: 'family',
    localDevelopment: false,
  }) === 'family',
  'uses household tier',
)

assert(
  resolveEffectivePlanTier({
    previewTier: null,
    householdTier: null,
    localDevelopment: true,
  }) === 'plus',
  'local dev defaults to plus',
)

assert(limitsFor('personal').features.savings === false, 'personal blocks savings')
assert(limitsFor('plus').features.savings === true, 'plus has savings')

console.log('planPreview tests OK')
