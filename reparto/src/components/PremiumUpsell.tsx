import type { PlanTier } from '../types'
import { PLAN_FEATURE_ROWS, limitsFor } from '../lib/plans'

interface Props {
  feature: 'savings' | 'wishlist' | 'multicurrency'
  planTier: PlanTier
  onOpenPlans?: () => void
}

const COPY = {
  savings: {
    title: 'Metas y Proyectos',
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

export function PremiumUpsell({ feature, planTier, onOpenPlans }: Props) {
  const limits = limitsFor(planTier)
  const allowed =
    feature === 'savings'
      ? limits.features.savings
      : feature === 'wishlist'
        ? limits.features.wishlist
        : limits.features.multipleCurrencies
  if (allowed) return null

  const copy = COPY[feature]
  const unlockRows = PLAN_FEATURE_ROWS.filter((row) => {
    if (feature === 'multicurrency') return row.key === 'multipleCurrencies'
    if (feature === 'savings') return row.key === 'savings'
    return row.key === 'wishlist'
  })

  return (
    <div className="premium-upsell">
      <div className="premium-upsell-icon" aria-hidden>
        🔒
      </div>
      <h2>{copy.title}</h2>
      <p className="brand-sub">{copy.teaser}</p>
      <p className="hint">
        Tu plan <strong>{limits.label}</strong> no incluye esto. Pasa a{' '}
        <strong>Familia</strong> o <strong>Plus</strong> para desbloquearlo en todos tus
        dispositivos.
      </p>
      <ul className="premium-upsell-features">
        {unlockRows.map((row) => (
          <li key={row.key}>{row.label}</li>
        ))}
      </ul>
      {onOpenPlans ? (
        <div className="premium-upsell-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenPlans}>
            Ver planes y mejorar
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
