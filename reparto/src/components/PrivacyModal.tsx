import { useState } from 'react'
import { Modal } from './Modal'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile } from '../types'
import { CurrencyField } from './CurrencyField'
import {
  loadUserPreferences,
  resolveDefaultCurrency,
  setDefaultCurrency,
} from '../lib/userPreferences'

interface Props {
  onClose: () => void
  profile?: UserProfile | null
  onUpdateProfile?: (input: {
    firstName: string
    lastName: string
    phone: string
    defaultCurrency?: string
  }) => Promise<void>
  localDefaultCurrency?: string | null
  onUpdateLocalCurrency?: (currency: string) => void
  onEditLocalIdentity?: () => void
  onLocalSignOut?: () => void
  onOpenHousehold?: () => void
  onOpenPlans?: () => void
}

export function PrivacyModal({
  onClose,
  profile,
  onUpdateProfile,
  onEditLocalIdentity,
  onLocalSignOut,
  onOpenHousehold,
  onOpenPlans,
  localDefaultCurrency,
  onUpdateLocalCurrency,
}: Props) {
  const auth = useAuth()
  const [message, setMessage] = useState('')
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [defaultCurrency, setDefaultCurrencyValue] = useState(
    profile?.defaultCurrency ??
      localDefaultCurrency ??
      resolveDefaultCurrency(),
  )

  return (
    <Modal
      title="Ajustes"
      subtitle="Cuenta y preferencias"
      onClose={onClose}
    >
      <div className="help-blocks">
        {auth.cloudEnabled ? (
          <section className="privacy-block">
            <h3>Perfil y cuenta Google</h3>
            <p>
              Sesión: <strong>{auth.user?.email ?? '—'}</strong>
            </p>
            {profile && onUpdateProfile ? (
              <form
                className="form-grid settings-profile"
                onSubmit={(event) => {
                  event.preventDefault()
                  void onUpdateProfile({
                    firstName,
                    lastName,
                    phone,
                    defaultCurrency,
                  }).then(() => {
                    setDefaultCurrency(defaultCurrency)
                    setMessage('Perfil actualizado')
                  })
                }}
              >
                <div className="form-row">
                  <label className="field">
                    Nombre
                    <input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    Apellido
                    <input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                    />
                  </label>
                </div>
                <label className="field">
                  Teléfono
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </label>
                <CurrencyField
                  value={defaultCurrency}
                  onChange={setDefaultCurrencyValue}
                  label="Moneda habitual"
                  hint="Se usa al crear espacios nuevos. Cada espacio puede tener otra moneda."
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  Guardar perfil
                </button>
              </form>
            ) : null}
            {onOpenHousehold ? (
              <button
                type="button"
                className="btn btn-family"
                onClick={onOpenHousehold}
              >
                Ir a Mi hogar y familia
              </button>
            ) : (
              <p className="hint">
                Los accesos de familia se administran desde “Mi hogar y familia”.
              </p>
            )}
            {onOpenPlans ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenPlans}
              >
                Ver tu plan
              </button>
            ) : null}
            <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void auth.signOut()}
              >
                Cerrar sesión Google
              </button>
            </div>
          </section>
        ) : (
          <section className="privacy-block">
            <h3>Identidad local</h3>
            <p>Los datos de esta vista se guardan solo en este navegador.</p>
            {onEditLocalIdentity ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onEditLocalIdentity}
                >
                  Editar identidad
                </button>
                {onLocalSignOut ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={onLocalSignOut}
                  >
                    Cerrar sesión
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        <section className="privacy-block">
          <h3>Moneda</h3>
          <p>
            Tu moneda habitual es{' '}
            <strong>{loadUserPreferences().defaultCurrency}</strong>. Puedes
            cambiarla por espacio desde el botón de moneda en cada espacio, y por
            gasto individual en plan Plus.
          </p>
          {!auth.cloudEnabled && onUpdateLocalCurrency ? (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                setDefaultCurrency(defaultCurrency)
                onUpdateLocalCurrency(defaultCurrency)
                setMessage('Moneda habitual actualizada')
              }}
            >
              <CurrencyField
                value={defaultCurrency}
                onChange={setDefaultCurrencyValue}
                label="Moneda habitual"
              />
              <button type="submit" className="btn btn-secondary btn-sm">
                Guardar moneda
              </button>
            </form>
          ) : null}
        </section>

        {message ? <p className="form-success">{message}</p> : null}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
