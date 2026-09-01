import type { PlanTier } from '../types'
import { PLAN_LIMITS, limitsFor, minimumTierForFeature } from '../lib/plans'
import { UiLock } from './AppIcon'

interface Props {
  feature: 'savings' | 'wishlist' | 'multicurrency'
  planTier: PlanTier
  onOpenUpgrade?: () => void
}

const COPY = {
  savings: {
    title: 'Metas de Ahorro',
    teaser: 'Anillos de progreso, metas compartidas y proyección mensual.',
  },
  wishlist: {
    title: 'Planificador de Compras',
    teaser: 'Tablero Kanban, comparar precios y pasar a gasto con un clic.',
  },
  multicurrency: {
    title: 'Multimoneda',
    teaser: 'Registra gastos en distintas monedas por movimiento.',
  },
}

export function PremiumUpsell({ feature, planTier, onOpenUpgrade }: Props) {
  const limits = limitsFor(planTier)
  const allowed =
    feature === 'savings'
      ? limits.features.savings
      : feature === 'wishlist'
        ? limits.features.wishlist
        : limits.features.multipleCurrencies
  if (allowed) return null

  const copy = COPY[feature]
  const minTier = minimumTierForFeature(
    feature === 'multicurrency' ? 'multipleCurrencies' : feature,
  )
  const target = PLAN_LIMITS[minTier]

  return (
    <div className="premium-upsell">
      <div className="premium-upsell-icon" aria-hidden>
        <UiLock size={28} className="ui-icon ui-icon-lock ui-icon-muted" />
      </div>
      <h2>{copy.title}</h2>
      <p className="brand-sub">{copy.teaser}</p>
      <p className="hint">
        Tu plan <strong>{limits.label}</strong> no incluye este módulo. Pasa a{' '}
        <strong>{target.label}</strong> para desbloquearlo en todos tus dispositivos.
      </p>
      {onOpenUpgrade ? (
        <div className="premium-upsell-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenUpgrade}>
            Ver beneficios y mejorar plan
          </button>
          <p className="hint">Pronto: pago con Mercado Pago y Stripe.</p>
        </div>
      ) : null}
    </div>
  )
}

/** @deprecated use PremiumUpsell */
export function PremiumGate(props: Props) {
  return <PremiumUpsell {...props} />
}
