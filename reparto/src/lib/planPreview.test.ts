import { resolveEffectivePlanTier } from '../hooks/usePlanPreview'
import { limitsFor } from './plans'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  resolveEffectivePlanTier({
    previewTier: 'plus',
    householdTier: 'personal',
    localDevelopment: true,
    cloudEnabled: false,
  }) === 'plus',
  'local preview wins in dev',
)

assert(
  resolveEffectivePlanTier({
    previewTier: 'plus',
    householdTier: 'personal',
    localDevelopment: false,
    cloudEnabled: true,
  }) === 'personal',
  'cloud ignores local preview',
)

assert(
  resolveEffectivePlanTier({
    previewTier: null,
    householdTier: 'family',
    localDevelopment: false,
    cloudEnabled: true,
  }) === 'family',
  'cloud uses household tier',
)

assert(limitsFor('personal').features.savings === false, 'basic blocks savings')
assert(limitsFor('plus').features.savings === true, 'premium has savings')

console.log('planPreview tests OK')
