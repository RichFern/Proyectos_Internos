import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from './Modal'
import {
  clearAccessConfig,
  hasPinProtection,
  loadAccessConfig,
  lockApp,
  setPin,
} from '../lib/access'
import { downloadBackup, readBackupFile, restoreBackup } from '../lib/backup'
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
  onRestored: () => void
  onLocked: () => void
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
}

export function PrivacyModal({
  onClose,
  onRestored,
  onLocked,
  profile,
  onUpdateProfile,
  onEditLocalIdentity,
  onLocalSignOut,
  onOpenHousehold,
  localDefaultCurrency,
  onUpdateLocalCurrency,
}: Props) {
  const auth = useAuth()
  const [pin, setPinValue] = useState('')
  const [pin2, setPin2] = useState('')
  const [people, setPeople] = useState(loadAccessConfig()?.allowedPeople ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [defaultCurrency, setDefaultCurrencyValue] = useState(
    profile?.defaultCurrency ??
      localDefaultCurrency ??
      resolveDefaultCurrency(),
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const protectedNow = hasPinProtection()

  const savePin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos o letras')
      return
    }
    if (pin !== pin2) {
      setError('Los PIN no coinciden')
      return
    }
    await setPin(pin, people)
    setPinValue('')
    setPin2('')
    setMessage('PIN guardado. Pedíselo solo a quien quieras que entre.')
  }

  const removePin = () => {
    if (!confirm('¿Quitar el PIN? Cualquiera con el teléfono podrá abrir A la PaR.')) return
    clearAccessConfig()
    setMessage('Protección por PIN desactivada')
  }

  const doExport = () => {
    downloadBackup(
      people ? `Respaldo privado — ${people}` : 'Respaldo de A la PaR',
    )
    setMessage(
      'Listo. Sube el archivo a una carpeta de Google Drive compartida solo contigo y tu familia.',
    )
  }

  const doImport = async (file: File | null) => {
    if (!file) return
    setError('')
    try {
      const backup = await readBackupFile(file)
      if (
        !confirm(
          `¿Restaurar el respaldo del ${new Date(backup.exportedAt).toLocaleString('es')}? Se reemplazarán los datos actuales del hogar y Firebase sincronizará el cambio.`,
        )
      ) {
        return
      }
      restoreBackup(backup)
      setMessage('Respaldo restaurado. Firebase sincronizará el hogar actualizado.')
      onRestored()
    } catch {
      setError('No se pudo leer ese archivo. Elige un respaldo .json de A la PaR.')
    }
  }

  return (
    <Modal
      title="Ajustes"
      subtitle="Cuenta, seguridad y copias de tus datos"
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
            <p>
              Los datos de esta vista se guardan solo en este navegador.
            </p>
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

        <details className="privacy-block optional-security">
          <summary>PIN opcional en este dispositivo</summary>
          <p>
            Google ya protege tu cuenta. Este PIN solo sirve si varias personas
            usan el mismo teléfono o quieres un bloqueo adicional. No se sincroniza
            entre dispositivos.
          </p>
          <form className="form-grid" onSubmit={savePin}>
            <label className="field">
              Nombres o emails (nota)
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="Ej. Patricia y Richard"
              />
            </label>
            <div className="form-row">
              <label className="field">
                Nuevo PIN
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPinValue(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  minLength={4}
                  required
                />
              </label>
              <label className="field">
                Repetir PIN
                <input
                  type="password"
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value)}
                  placeholder="Igual que arriba"
                  minLength={4}
                  required
                />
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button type="submit" className="btn btn-primary">
                {protectedNow ? 'Cambiar PIN' : 'Activar PIN'}
              </button>
              {protectedNow ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      lockApp()
                      onLocked()
                    }}
                  >
                    Bloquear ahora
                  </button>
                  <button type="button" className="btn btn-danger" onClick={removePin}>
                    Quitar PIN
                  </button>
                </>
              ) : null}
            </div>
          </form>
        </details>

        <section className="privacy-block">
          <h3>Respaldo manual</h3>
          <p>
            Firebase sincroniza automáticamente. Este archivo es una copia
            independiente por si borras algo por error, quieres archivar un estado
            anterior o llevarte tus datos fuera de A la PaR.
          </p>
          <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={doExport}>
              Descargar respaldo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              Restaurar desde archivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void doImport(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </div>
        </section>

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
