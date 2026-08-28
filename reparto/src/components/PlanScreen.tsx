import { useState } from 'react'
import type { Household, PlanTier, UserProfile } from '../types'
import {
  PLAN_COPY,
  PLAN_FEATURE_LIST,
  PLAN_FEATURE_ROWS,
  PLAN_LIMITS,
  PLAN_PRICING,
} from '../lib/plans'
import { Modal } from './Modal'

interface Props {
  household: Household | null
  profile: UserProfile | null
  spaceCount: number
  effectiveTier: PlanTier
  householdTier: PlanTier | null
  previewTier: PlanTier | null
  canAssignPlan?: boolean
  onAssignPlan?: (tier: PlanTier) => Promise<void>
  onPreviewPlan: (tier: PlanTier | null) => void
  onClose: () => void
}

export function PlanScreen({
  household,
  profile,
  spaceCount,
  effectiveTier,
  householdTier,
  previewTier,
  canAssignPlan = false,
  onAssignPlan,
  onPreviewPlan,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

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
      onPreviewPlan(null)
      setMessage(`Plan del hogar actualizado a ${next.label}.`)
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : 'No se pudo cambiar el plan',
      )
    } finally {
      setBusy(false)
    }
  }

  const tryPlan = (tier: PlanTier) => {
    onPreviewPlan(tier)
    setMessage(
      `Vista previa activa: ${PLAN_LIMITS[tier].label}. Ahorros, cotizaciones y exportar se muestran según este plan.`,
    )
  }

  const currentLimits = PLAN_LIMITS[effectiveTier]

  return (
    <Modal
      title="Tu plan"
      subtitle={
        household
          ? `${household.name} · Vista: ${currentLimits.label}${
              previewTier
                ? ` (prueba; hogar: ${PLAN_LIMITS[householdTier ?? 'family'].label})`
                : ''
            }`
          : `Vista previa: ${currentLimits.label}`
      }
      onClose={onClose}
      wide
    >
      {previewTier ? (
        <div className="plan-preview-banner">
          <strong>Modo prueba activo:</strong> estás viendo el plan{' '}
          {PLAN_LIMITS[previewTier].label}. No cambia el cobro ni el hogar en la nube
          hasta que haya pago o un admin lo aplique.
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onPreviewPlan(null)
              setMessage('Vista previa desactivada. Volviste al plan del hogar.')
            }}
          >
            Quitar prueba
          </button>
        </div>
      ) : null}

      <p className="hint">
        Elige un plan para probar cómo se ven Ahorros, Cotizaciones y el resto antes de
        publicar. Usa <strong>Probar plan</strong> para simular en esta pantalla.
      </p>

      <div className="plan-status-bar">
        <span>
          Plan en uso ahora: <strong>{currentLimits.label}</strong>
        </span>
        {householdTier && householdTier !== effectiveTier ? (
          <span className="plan-status-note">
            Hogar en nube: {PLAN_LIMITS[householdTier].label}
          </span>
        ) : null}
      </div>

      <div className="plan-cards plan-cards-checkout">
        {Object.values(PLAN_LIMITS).map((item) => {
          const copy = PLAN_COPY[item.tier]
          const pricing = PLAN_PRICING[item.tier]
          const features = PLAN_FEATURE_LIST[item.tier]
          const active = item.tier === effectiveTier
          const householdActive = item.tier === householdTier
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
              <div className="plan-card-badges">
                {active ? <span className="chip">En uso ahora</span> : null}
                {householdActive ? <span className="chip chip-muted">Plan del hogar</span> : null}
              </div>
              <div className="plan-card-actions">
                {!active ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy}
                    onClick={() => tryPlan(item.tier)}
                  >
                    Probar plan
                  </button>
                ) : null}
                {canAssignPlan && onAssignPlan && household && !householdActive ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busy}
                    onClick={() => void assignPlan(item.tier)}
                  >
                    Aplicar al hogar
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <div className="plan-matrix-wrap">
        <h3>Qué incluye cada plan</h3>
        <table className="plan-matrix">
          <thead>
            <tr>
              <th scope="col">Función</th>
              {Object.values(PLAN_LIMITS).map((item) => (
                <th
                  scope="col"
                  key={item.tier}
                  className={item.tier === effectiveTier ? 'active-col' : undefined}
                >
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURE_ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {Object.values(PLAN_LIMITS).map((item) => (
                  <td
                    key={item.tier}
                    className={item.tier === effectiveTier ? 'active-col' : undefined}
                  >
                    {item.features[row.key] ? '✓' : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profile ? (
        <p className="hint">
          Cuenta: {profile.displayName || profile.email}
          {household
            ? ` · ${household.memberEmails.length}/${currentLimits.maxMembers} integrantes · ${spaceCount}/${currentLimits.maxSpaces} espacios`
            : ''}
        </p>
      ) : null}

      {message ? <p className="hint plan-message">{message}</p> : null}

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}
