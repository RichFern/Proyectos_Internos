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
  'local preview overrides household',
)

assert(
  resolveEffectivePlanTier({
    previewTier: 'plus',
    householdTier: 'personal',
    localDevelopment: false,
    cloudEnabled: true,
  }) === 'personal',
  'cloud ignores preview',
)

assert(
  resolveEffectivePlanTier({
    previewTier: null,
    householdTier: 'family',
    localDevelopment: false,
    cloudEnabled: true,
  }) === 'family',
  'uses household tier in cloud',
)

assert(limitsFor('personal').features.savings === false, 'personal blocks savings')
assert(limitsFor('plus').features.savings === true, 'plus has savings')

console.log('planPreview tests OK')
