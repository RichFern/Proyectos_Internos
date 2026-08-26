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
          A la PaR está en prueba privada. Solo pueden entrar las cuentas que
          el administrador habilitó.
        </p>
        {error && error !== 'ACCESS_DENIED' ? (
          <p className="form-error">{error}</p>
        ) : null}
        <p className="hint" style={{ marginTop: '0.85rem' }}>
          Si formas parte de la familia, pide que agreguen tu Gmail a la lista
          de acceso. Cuando los planes estén activos, el ingreso se abrirá con
          la membresía.
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
