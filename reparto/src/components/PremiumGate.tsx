import type { PlanTier } from '../types'
import { limitsFor } from '../lib/plans'

interface Props {
  feature: 'savings' | 'wishlist'
  planTier: PlanTier
  onOpenPlans?: () => void
}

const COPY = {
  savings: {
    title: 'Ahorros',
    description:
      'Metas, depósitos y seguimiento visual de lo que apartan. Disponible en planes Familia y Plus.',
  },
  wishlist: {
    title: 'Cotizaciones',
    description:
      'Compara precios antes de comprar y elige la mejor opción. Disponible en planes Familia y Plus.',
  },
}

export function PremiumGate({ feature, planTier, onOpenPlans }: Props) {
  const limits = limitsFor(planTier)
  const allowed =
    feature === 'savings' ? limits.features.savings : limits.features.wishlist
  if (allowed) return null

  const copy = COPY[feature]
  return (
    <div className="premium-gate-box">
      <p className="brand-sub">{copy.description}</p>
      <p className="hint">
        Plan actual: <strong>{limits.label}</strong>. Actualiza a Familia o Plus para
        desbloquear esta sección.
      </p>
      {onOpenPlans ? (
        <button type="button" className="btn btn-primary" onClick={onOpenPlans}>
          Ver planes
        </button>
      ) : null}
    </div>
  )
}
