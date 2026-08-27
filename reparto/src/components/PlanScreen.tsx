import { useState } from 'react'
import type { Household, PlanTier, UserProfile } from '../types'
import {
  PLAN_COPY,
  PLAN_FEATURE_LIST,
  PLAN_LIMITS,
  PLAN_PRICING,
} from '../lib/plans'
import { Modal } from './Modal'

interface Props {
  household: Household | null
  profile: UserProfile | null
  spaceCount: number
  canAssignPlan?: boolean
  onAssignPlan?: (tier: PlanTier) => Promise<void>
  onClose: () => void
}

export function PlanScreen({
  household,
  profile,
  spaceCount,
  canAssignPlan = false,
  onAssignPlan,
  onClose,
}: Props) {
  const currentTier = household?.planTier ?? 'family'
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null)

  const assignPlan = async (tier: PlanTier) => {
    if (!onAssignPlan || !household) return
    if (tier === household.planTier) return
    const next = PLAN_LIMITS[tier]
    if (household.memberEmails.length > next.maxMembers) {
      setMessage(
        `No se puede pasar a ${next.label}: hay ${household.memberEmails.length} integrantes y ese plan admite ${next.maxMembers}.`,
      )
      return
    }
    if (spaceCount > next.maxSpaces) {
      setMessage(
        `No se puede pasar a ${next.label}: hay ${spaceCount} espacios y ese plan admite ${next.maxSpaces}.`,
      )
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await onAssignPlan(tier)
      setMessage(`Plan actualizado a ${next.label}.`)
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : 'No se pudo cambiar el plan',
      )
    } finally {
      setBusy(false)
    }
  }

  const startCheckout = (tier: PlanTier) => {
    if (tier === 'personal') {
      if (canAssignPlan) void assignPlan('personal')
      return
    }
    setCheckoutTier(tier)
  }

  return (
    <>
      <Modal
        title="Tu plan"
        subtitle={
          household
            ? `${household.name} · Plan ${PLAN_LIMITS[currentTier].label}`
            : 'Elige el plan que mejor se adapte a tu hogar'
        }
        onClose={onClose}
        wide
      >
        <p className="hint">
          Los planes desbloquean ahorros, cotizaciones, exportar y más integrantes.
          El cobro online llegará pronto; hasta entonces puedes probar todas las funciones.
        </p>

        <div className="plan-cards plan-cards-checkout">
          {Object.values(PLAN_LIMITS).map((item) => {
            const copy = PLAN_COPY[item.tier]
            const pricing = PLAN_PRICING[item.tier]
            const features = PLAN_FEATURE_LIST[item.tier]
            const active = item.tier === currentTier
            return (
              <article
                className={`plan-card plan-card-rich${active ? ' active' : ''}`}
                key={item.tier}
              >
                <div className="plan-card-top">
                  <strong>{item.label}</strong>
                  <span className="plan-price">{pricing.priceLabel}</span>
                  <span className="plan-price-note">{pricing.priceNote}</span>
                </div>
                <span className="plan-intended">{copy.intendedFor}</span>
                <p className="plan-summary">{copy.summary}</p>
                <ul className="plan-feature-list">
                  {features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {active ? <span className="chip">Plan actual</span> : null}
                {!active ? (
                  canAssignPlan && onAssignPlan ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busy}
                      onClick={() => void assignPlan(item.tier)}
                    >
                      Asignar {item.label}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busy || item.tier === 'personal'}
                      onClick={() => startCheckout(item.tier)}
                    >
                      {item.tier === 'personal' ? 'Plan base' : `Elegir ${item.label}`}
                    </button>
                  )
                ) : null}
              </article>
            )
          })}
        </div>

        {profile ? (
          <p className="hint">
            Cuenta: {profile.displayName || profile.email}
            {household
              ? ` · ${household.memberEmails.length}/${PLAN_LIMITS[currentTier].maxMembers} integrantes · ${spaceCount}/${PLAN_LIMITS[currentTier].maxSpaces} espacios`
              : ''}
          </p>
        ) : null}

        {message ? <p className="hint">{message}</p> : null}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Listo
          </button>
        </div>
      </Modal>

      {checkoutTier ? (
        <Modal
          title={`Contratar ${PLAN_LIMITS[checkoutTier].label}`}
          subtitle={PLAN_PRICING[checkoutTier].priceLabel}
          onClose={() => setCheckoutTier(null)}
        >
          <div className="checkout-placeholder">
            <p>
              <strong>Próximamente:</strong> pago con Stripe y Mercado Pago.
            </p>
            <p className="hint">{PLAN_PRICING[checkoutTier].checkoutNote}</p>
            <p className="hint">
              Cuando esté activo, el plan se actualizará automáticamente al confirmar el pago.
              Mientras tanto, puedes usar todas las funciones en modo de prueba.
            </p>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCheckoutTier(null)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCheckoutTier(null)
                setMessage(
                  'Te avisaremos cuando el cobro esté disponible. Por ahora sigues con acceso completo.',
                )
              }}
            >
              Avisarme cuando esté listo
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
