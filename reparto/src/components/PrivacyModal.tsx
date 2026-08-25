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

interface Props {
  onClose: () => void
  onRestored: () => void
  onLocked: () => void
}

export function PrivacyModal({ onClose, onRestored, onLocked }: Props) {
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
    if (!confirm('¿Quitar el PIN? Cualquiera con el teléfono podrá abrir Reparto.')) return
    clearAccessConfig()
    setMessage('Protección por PIN desactivada')
  }

  const doExport = () => {
    downloadBackup(
      people
        ? `Respaldo privado — ${people}`
        : 'Respaldo de Reparto',
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
      setError('No se pudo leer ese archivo. Elegí un respaldo .json de Reparto.')
    }
  }

  return (
    <Modal
      title="Privacidad y respaldo"
      subtitle="Que entre solo quien vos quieras, y no pierdas los datos"
      onClose={onClose}
    >
      <div className="help-blocks">
        <section className="privacy-block">
          <h3>1. ¿Quién puede entrar?</h3>
          <p>
            Hoy los gastos viven <strong>en este teléfono o PC</strong>, no en una red
            pública. Con un PIN, aunque alguien abra el navegador, no ve la app sin el
            código. Compartí el PIN solo con la persona de confianza.
          </p>
          <form className="form-grid" onSubmit={savePin}>
            <label className="field">
              Nombres o emails permitidos (opcional, solo como nota)
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="Ej. Ana y Luis — ana@gmail.com, luis@gmail.com"
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
          <h3>2. Respaldo en Google Drive</h3>
          <p>
            Reparto puede generar un archivo con todos tus espacios y gastos. Ese
            archivo lo subís a <strong>Google Drive</strong> (carpeta privada o compartida
            solo con tu pareja). En el otro teléfono: descargás el archivo y tocás
            Restaurar.
          </p>
          <ol className="steps-list">
            <li>Tocá <strong>Descargar respaldo</strong>.</li>
            <li>En el celular o PC, subilo a Drive (carpeta “Reparto” recomendada).</li>
            <li>En el otro dispositivo: abrí Reparto → Privacidad → Restaurar.</li>
          </ol>
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

        <section className="privacy-block">
          <h3>3. ¿Y que nadie más entre por internet?</h3>
          <p>
            Si publicás la app en internet para instalarla en el teléfono, pedile a quien
            la suba (o usá Netlify/Vercel) que active{' '}
            <strong>protección con contraseña del sitio</strong> o acceso solo con
            cuentas Google invitadas. Mientras tanto, el PIN + Drive privado ya cubren el
            uso en casa.
          </p>
          <p className="hint">
            Guía paso a paso: archivo <code>docs/ACCESO_Y_RESPALDO.md</code> en el
            proyecto.
          </p>
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
