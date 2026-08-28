import { PLAN_LIMITS, PRICING_COMPARISON_ROWS } from '../lib/plans'
import type { PlanTier } from '../types'

interface Props {
  effectiveTier?: PlanTier
}

function CellValue({ value }: { value: boolean | 'lock' }) {
  if (value === true) return <span className="pricing-yes">✓</span>
  if (value === 'lock') return <span className="pricing-lock" title="Requiere plan superior">🔒</span>
  return <span className="pricing-no">—</span>
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
            {PRICING_COMPARISON_ROWS.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td className={effectiveTier === 'personal' ? 'active-col' : undefined}>
                  <CellValue value={row.personal} />
                </td>
                <td className={effectiveTier === 'family' ? 'active-col' : undefined}>
                  <CellValue value={row.family} />
                </td>
                <td className={effectiveTier === 'plus' ? 'active-col' : undefined}>
                  <CellValue value={row.plus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
