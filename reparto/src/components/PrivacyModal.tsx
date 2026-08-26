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

interface Props {
  onClose: () => void
  onRestored: () => void
  onLocked: () => void
}

export function PrivacyModal({ onClose, onRestored, onLocked }: Props) {
  const auth = useAuth()
  const [pin, setPinValue] = useState('')
  const [pin2, setPin2] = useState('')
  const [people, setPeople] = useState(loadAccessConfig()?.allowedPeople ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
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
      'Listo. Subí el archivo a una carpeta de Google Drive compartida solo con vos y tu pareja/familia.',
    )
  }

  const doImport = async (file: File | null) => {
    if (!file) return
    setError('')
    try {
      const backup = await readBackupFile(file)
      if (
        !confirm(
          `¿Restaurar el respaldo del ${new Date(backup.exportedAt).toLocaleString('es-AR')}? Se reemplazan los datos actuales de este dispositivo.`,
        )
      ) {
        return
      }
      restoreBackup(backup)
      setMessage('Respaldo restaurado. Los gastos ya están en este dispositivo.')
      onRestored()
    } catch {
      setError('No se pudo leer ese archivo. Elegí un respaldo .json de A la PaR.')
    }
  }

  return (
    <Modal
      title="Privacidad y respaldo"
      subtitle="Que entre solo quien vos quieras, y no pierdas los datos"
      onClose={onClose}
    >
      <div className="help-blocks">
        {auth.cloudEnabled ? (
          <section className="privacy-block">
            <h3>Acceso Google (privado)</h3>
            <p>
              Sesión: <strong>{auth.user?.email ?? '—'}</strong>
            </p>
            <p>Solo estas cuentas pueden entrar (configuradas en el servidor):</p>
            <ul className="steps-list">
              {auth.allowedEmails.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="hint">
              Aunque alguien tenga el link, sin una de esas cuentas de Google no
              puede ver ni escribir nada. Las reglas de Firebase lo bloquean en el
              servidor.
            </p>
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
            <h3>Acceso Google (recomendado para publicar)</h3>
            <p>
              Para que sea privado de verdad en internet, configurá Firebase y los
              emails permitidos. Guía: <code>docs/PUBLICAR_PRIVADO_GOOGLE.md</code>
            </p>
          </section>
        )}

        <section className="privacy-block">
          <h3>PIN extra en este dispositivo</h3>
          <p>
            Opcional: además de Google, un PIN en este teléfono. Compartí el PIN
            solo con quien uses este aparato.
          </p>
          <form className="form-grid" onSubmit={savePin}>
            <label className="field">
              Nombres o emails (nota)
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="Ej. Ana y Luis"
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
        </section>

        <section className="privacy-block">
          <h3>Respaldo archivo (Google Drive)</h3>
          <p>
            Copia de seguridad extra en un archivo. Con Google + Firebase ya tenés
            sync en la nube; el archivo sirve por si querés guardar una copia en
            Drive.
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
