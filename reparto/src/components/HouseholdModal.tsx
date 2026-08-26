import { useState, type FormEvent } from 'react'
import type { Household, UserProfile } from '../types'
import { PLAN_LIMITS } from '../lib/plans'
import { Modal } from './Modal'

interface Props {
  household: Household
  profile: UserProfile
  onInvite: (email: string) => Promise<void>
  onClose: () => void
}

export function HouseholdModal({
  household,
  profile,
  onInvite,
  onClose,
}: Props) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const limits = PLAN_LIMITS[household.planTier]
  const isOwner = household.ownerUid === profile.uid

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    if (household.memberEmails.length >= limits.maxMembers) {
      setMessage(`El plan ${limits.label} admite ${limits.maxMembers} integrantes.`)
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await onInvite(email)
      setMessage(
        `${email.toLowerCase()} ya puede ingresar con Google y unirse al hogar.`,
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

  return (
    <Modal
      title={household.name}
      subtitle={`Plan ${limits.label} · ${household.memberEmails.length}/${limits.maxMembers} integrantes`}
      onClose={onClose}
    >
      <section className="household-section">
        <h3>Familia con acceso</h3>
        <div className="member-access-list">
          {household.memberEmails.map((memberEmail) => (
            <div className="member-access" key={memberEmail}>
              <span>{memberEmail}</span>
              <span className="chip">
                {memberEmail === profile.email
                  ? 'Vos'
                  : household.memberUids.length > 1
                    ? 'Invitado'
                    : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
        {isOwner ? (
          <form className="inline-invite" onSubmit={invite}>
            <label className="field">
              Dar acceso por email
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
        ) : null}
        {message ? <p className="hint">{message}</p> : null}
      </section>

      <section className="household-section">
        <h3>Membresías preparadas</h3>
        <div className="plan-cards">
          {Object.values(PLAN_LIMITS).map((item) => (
            <article
              className={`plan-card${item.tier === household.planTier ? ' active' : ''}`}
              key={item.tier}
            >
              <strong>{item.label}</strong>
              <span>{item.maxMembers} integrante(s)</span>
              <span>{item.maxSpaces} espacio(s)</span>
              <span>{item.maxExpensesPerSpace} gastos por espacio</span>
              <span>
                {item.features.budgets ? 'Con presupuestos' : 'Sin presupuestos'}
              </span>
              {item.tier === household.planTier ? (
                <span className="chip">Plan actual</span>
              ) : null}
            </article>
          ))}
        </div>
        <p className="hint">
          La estructura de planes ya está preparada. El cobro se activará con
          Stripe o Mercado Pago antes del lanzamiento público.
        </p>
      </section>

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}

