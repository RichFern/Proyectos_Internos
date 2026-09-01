import { PLAN_LIMITS, PRICING_TABLE_ROWS, type PricingCellValue } from '../lib/plans'
import type { PlanTier } from '../types'
import { UiCheck, UiExcluded } from './AppIcon'

interface Props {
  effectiveTier?: PlanTier
}

function PricingCell({ value }: { value: PricingCellValue }) {
  if (value.kind === 'text') {
    return <span className="pricing-text">{value.value}</span>
  }
  if (value.kind === 'included') {
    return <UiCheck size={20} className="pricing-icon pricing-icon-check" />
  }
  return <UiExcluded className="pricing-excluded" />
}

export function PricingComparison({ effectiveTier }: Props) {
  const tiers = Object.values(PLAN_LIMITS)

  return (
    <div className="pricing-comparison-wrap">
      <h3>Comparativa de planes</h3>
      <div className="pricing-comparison-scroll">
        <table className="pricing-comparison">
          <thead>
            <tr>
              <th scope="col">Función</th>
              {tiers.map((plan) => (
                <th
                  scope="col"
                  key={plan.tier}
                  className={plan.tier === effectiveTier ? 'active-col' : undefined}
                >
                  <span className="pricing-col-name">{plan.label}</span>
                  <span className="pricing-col-tag">{plan.tagline}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_TABLE_ROWS.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td className={effectiveTier === 'personal' ? 'active-col' : undefined}>
                  <PricingCell value={row.personal} />
                </td>
                <td className={effectiveTier === 'family' ? 'active-col' : undefined}>
                  <PricingCell value={row.family} />
                </td>
                <td className={effectiveTier === 'plus' ? 'active-col' : undefined}>
                  <PricingCell value={row.plus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
