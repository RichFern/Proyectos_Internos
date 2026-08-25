import { useEffect, useState } from 'react'
import { Modal } from './Modal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS
      ('standalone' in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
    setInstalled(standalone)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setDeferred(null)
      return
    }
    setShowHelp(true)
  }

  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={install}>
        Instalar app
      </button>
      {showHelp ? (
        <Modal
          title="Usar Reparto como app"
          subtitle="Sin tiendas ni instalación complicada"
          onClose={() => setShowHelp(false)}
        >
          <div className="help-blocks">
            <div>
              <h3>En el teléfono (Android)</h3>
              <p>
                Abrí Reparto en Chrome → menú ⋮ → <strong>Instalar aplicación</strong> o{' '}
                <strong>Agregar a la pantalla de inicio</strong>.
              </p>
            </div>
            <div>
              <h3>En el iPhone</h3>
              <p>
                Abrí Reparto en Safari → botón Compartir →{' '}
                <strong>Agregar a pantalla de inicio</strong>.
              </p>
            </div>
            <div>
              <h3>En la PC</h3>
              <p>
                En Chrome o Edge, mirá el ícono ⊕ en la barra de dirección, o menú →{' '}
                <strong>Instalar Reparto</strong>. Queda como una ventana aparte.
              </p>
            </div>
            <p className="hint">
              Funciona offline con los datos guardados en este dispositivo. No hace falta
              cuenta ni App Store.
            </p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowHelp(false)}>
              Entendido
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
