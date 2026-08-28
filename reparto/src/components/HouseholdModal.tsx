import { useMemo, useState, type FormEvent } from 'react'
import type { Household, PlanTier, UserProfile } from '../types'
import { PLAN_COPY, PLAN_LIMITS, formatPlanCap, formatPlanCapNote, formatPlanUsage } from '../lib/plans'
import { Modal } from './Modal'
import { shareInviteWhatsApp } from '../lib/export'

function memberName(
  email: string,
  household: Household,
  profile: UserProfile,
): string {
  if (email.toLowerCase() === profile.email.toLowerCase()) {
    return profile.displayName || profile.firstName || 'Tú'
  }
  return household.memberNamesByEmail?.[email.toLowerCase()] || 'Invitado pendiente'
}

interface Props {
  household: Household
  profile: UserProfile
  onInvite: (email: string) => Promise<void>
  onRemove: (email: string) => Promise<void>
  onAssignPlan?: (tier: PlanTier) => Promise<void>
  canAssignPlan?: boolean
  spaceCount: number
  onClose: () => void
}

export function HouseholdModal({
  household,
  profile,
  onInvite,
  onRemove,
  onAssignPlan,
  canAssignPlan = false,
  spaceCount,
  onClose,
}: Props) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const limits = PLAN_LIMITS[household.planTier]
  const isOwner = household.ownerUid === profile.uid
  const inviteLink = useMemo(
    () => `${window.location.origin}/?join=${encodeURIComponent(household.id)}`,
    [household.id],
  )

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    if (household.memberEmails.length >= limits.maxMembers) {
      const note = formatPlanCapNote(limits.maxMembers)
      setMessage(
        `El plan ${limits.label} admite ${formatPlanCap(limits.maxMembers)} integrantes${note ? ` (${note})` : ''}.`,
      )
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const normalized = email.trim().toLowerCase()
      await onInvite(normalized)
      setMessage(
        `${normalized} ya está autorizado. Copiá el enlace y enviáselo (WhatsApp, correo o como prefieras). A la PaR no manda emails automáticos.`,
      )
      setEmail('')
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : 'No se pudo agregar el acceso',
      )
    } finally {
      setBusy(false)
    }
  }

  const assignPlan = async (tier: PlanTier) => {
    if (!onAssignPlan || tier === household.planTier) return
    const next = PLAN_LIMITS[tier]
    if (household.memberEmails.length > next.maxMembers) {
      const note = formatPlanCapNote(next.maxMembers)
      setMessage(
        `No se puede pasar a ${next.label}: hay ${household.memberEmails.length} integrantes y ese plan admite ${formatPlanCap(next.maxMembers)}${note ? ` (${note})` : ''}.`,
      )
      return
    }
    if (spaceCount > next.maxSpaces) {
      const note = formatPlanCapNote(next.maxSpaces)
      setMessage(
        `No se puede pasar a ${next.label}: hay ${spaceCount} espacios y ese plan admite ${formatPlanCap(next.maxSpaces)}${note ? ` (${note})` : ''}.`,
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

  const copyInvite = () => {
    void navigator.clipboard.writeText(inviteLink)
    setMessage('Enlace copiado. Enviáselo al Gmail que autorizaste.')
  }

  const mailInvite = (targetEmail: string) => {
    const subject = encodeURIComponent(`Invitación a A la PaR · ${household.name}`)
    const body = encodeURIComponent(
      `Hola,\n\nTe invito a unirte al hogar "${household.name}" en A la PaR.\n\n1. Entrá con este enlace:\n${inviteLink}\n\n2. Usá la misma cuenta Google que autorizamos: ${targetEmail}\n\nNos vemos adentro.`,
    )
    window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${subject}&body=${body}`
  }

  return (
    <Modal
      title="Mi hogar y familia"
      subtitle={`${household.name} · Plan ${limits.label} · ${formatPlanUsage(household.memberEmails.length, limits.maxMembers)} integrantes`}
      onClose={onClose}
    >
      <section className="household-section">
        <h3>Invitar</h3>
        <p className="hint">
          Autorizás el Gmail, copiás el enlace y se lo enviás tú (WhatsApp, correo,
          etc.). La app no manda invitaciones por email sola.
        </p>
        <div className="member-access-list">
          {household.memberEmails.map((memberEmail) => (
            <div className="member-access" key={memberEmail}>
              <span>
                {memberName(memberEmail, household, profile)}
              </span>
              <div className="member-access-actions">
                <span className="chip">
                  {memberEmail === profile.email
                    ? 'Tú'
                    : household.memberUidByEmail?.[memberEmail]
                      ? 'Activo'
                      : 'Pendiente'}
                </span>
                {isOwner && memberEmail !== profile.email ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const label = memberName(memberEmail, household, profile)
                      if (confirm(`¿Quitar el acceso de ${label}?`)) {
                        void onRemove(memberEmail)
                      }
                    }}
                  >
                    Quitar
                  </button>
                ) : null}
                {isOwner &&
                memberEmail !== profile.email &&
                !household.memberUidByEmail?.[memberEmail] ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => mailInvite(memberEmail)}
                  >
                    Enviar correo
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {isOwner ? (
          <>
            <form className="inline-invite" onSubmit={invite}>
              <label className="field">
                Autorizar email de un familiar
                <div className="inline-control">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="familiar@gmail.com"
                    required
                  />
                  <button className="btn btn-primary btn-sm" disabled={busy}>
                    Agregar
                  </button>
                </div>
              </label>
            </form>
            <div className="invite-link-box">
              <input value={inviteLink} readOnly aria-label="Enlace de invitación" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyInvite}
              >
                Copiar enlace
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => shareInviteWhatsApp(household.name, inviteLink)}
              >
                WhatsApp
              </button>
            </div>
            <p className="hint">
              Escribí el Gmail del familiar, tocá <strong>Agregar</strong>, copiá el
              enlace y enviáselo. Tiene que entrar con esa misma cuenta de Google.
            </p>
          </>
        ) : (
          <p className="hint">
            Solo quien creó el hogar puede invitar o quitar integrantes.
          </p>
        )}
        {message ? <p className="hint">{message}</p> : null}
      </section>

      <section className="household-section">
        <h3>Plan de este hogar</h3>
        <div className="plan-usage">
          <span>
            Integrantes:{' '}
            <strong>{formatPlanUsage(household.memberEmails.length, limits.maxMembers)}</strong>
            {formatPlanCapNote(limits.maxMembers) ? (
              <span className="plan-cap-note"> ({formatPlanCapNote(limits.maxMembers)})</span>
            ) : null}
          </span>
          <span>
            Espacios:{' '}
            <strong>{formatPlanUsage(spaceCount, limits.maxSpaces)}</strong>
            {formatPlanCapNote(limits.maxSpaces) ? (
              <span className="plan-cap-note"> ({formatPlanCapNote(limits.maxSpaces)})</span>
            ) : null}
          </span>
        </div>
        <div className="plan-cards">
          {Object.values(PLAN_LIMITS).map((item) => {
            const copy = PLAN_COPY[item.tier]
            const active = item.tier === household.planTier
            const body = (
              <>
                <strong>{item.label}</strong>
                <span>{copy.intendedFor}</span>
                <span>
                  {formatPlanCap(item.maxMembers)} integrante(s)
                  {formatPlanCapNote(item.maxMembers) ? (
                    <small className="plan-cap-note">
                      {' '}
                      ({formatPlanCapNote(item.maxMembers)})
                    </small>
                  ) : null}
                </span>
                <span>
                  {formatPlanCap(item.maxSpaces)} espacio(s)
                  {formatPlanCapNote(item.maxSpaces) ? (
                    <small className="plan-cap-note">
                      {' '}
                      ({formatPlanCapNote(item.maxSpaces)})
                    </small>
                  ) : null}
                </span>
                <span>{item.maxExpensesPerSpace} gastos por espacio</span>
                <span>
                  {item.features.budgets
                    ? 'Presupuestos, cuotas y exportar'
                    : 'Sin presupuestos ni cuotas'}
                </span>
                {active ? <span className="chip">Plan actual</span> : null}
              </>
            )
            return canAssignPlan ? (
              <button
                type="button"
                className={`plan-card${active ? ' active' : ''}`}
                key={item.tier}
                disabled={busy || active}
                onClick={() => void assignPlan(item.tier)}
              >
                {body}
              </button>
            ) : (
              <article
                className={`plan-card${active ? ' active' : ''}`}
                key={item.tier}
              >
                {body}
              </article>
            )
          })}
        </div>
        {canAssignPlan ? (
          <p className="hint">
            Estás viendo la asignación de operador. Elige un plan para este
            hogar. El cobro (Stripe o Mercado Pago) todavía no está conectado:
            hasta entonces el plan se asigna a mano.
          </p>
        ) : (
          <p className="hint">
            Un hogar nuevo nace en plan Familia. El plan lo asigna A la PaR;
            no se cambia desde aquí. Cuando haya cobro, el pago va a actualizar
            el plan solo.
          </p>
        )}
      </section>

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}
