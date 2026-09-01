import { BrandLogo } from './BrandLogo'
import { useAuth } from '../hooks/useAuth'

export function AccessDeniedScreen() {
  const { signOut, error } = useAuth()

  return (
    <div className="lock-screen">
      <div className="lock-card panel" style={{ textAlign: 'left', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
          <BrandLogo size="lg" showWordmark />
        </div>
        <h2>Acceso restringido</h2>
        <p className="brand-sub">
          No pudimos validar tu acceso. Si te invitaron a un hogar, entrá con el
          mismo Gmail que autorizaron y usá el enlace de invitación que te
          compartieron.
        </p>
        {error && error !== 'ACCESS_DENIED' ? (
          <p className="form-error">{error}</p>
        ) : null}
        <p className="hint" style={{ marginTop: '0.85rem' }}>
          La app no envía correos automáticos: quien te invitó debe compartirte
          el enlace. Si el problema continúa, pide que vuelvan a agregar tu Gmail
          y te reenvíen el enlace.
        </p>
        <div className="modal-actions" style={{ marginTop: '1.1rem' }}>
          <button type="button" className="btn btn-primary" onClick={() => void signOut()}>
            Usar otra cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
