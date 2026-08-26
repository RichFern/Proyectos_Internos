import { useAuth } from '../hooks/useAuth'
import { BrandLogo } from './BrandLogo'

interface Props {
  preview?: boolean
  onPreviewEnter?: () => void
}

export function LoginScreen({ preview = false, onPreviewEnter }: Props) {
  const { status, error, signIn } = useAuth()
  const busy = status === 'loading'
  const hasInvitation = new URLSearchParams(window.location.search).has('join')

  return (
    <div className="auth-screen">
      <section className="auth-hero">
        <BrandLogo size="hero" showWordmark />
        <h1>Compartir gastos puede ser simple.</h1>
        <p>
          Organiza tu hogar, un viaje o una salida. A la PaR calcula saldos,
          presupuestos y cuánto aporta cada persona.
        </p>
        <div className="auth-benefits">
          <span>Un hogar para toda la familia</span>
          <span>Reparto por ingreso, partes iguales o porcentajes</span>
          <span>Gastos personales realmente privados</span>
        </div>
      </section>

      <div className="auth-card panel">
        <span className="auth-eyebrow">Tu cuenta</span>
        {hasInvitation ? (
          <div className="invite-notice">
            <strong>Te invitaron a un hogar</strong>
            <span>
              Entra con el correo al que enviaron la invitación.
            </span>
          </div>
        ) : null}
        <h2>Empieza con A la PaR</h2>
        <p className="hint">
          {preview
            ? 'Vista local de desarrollo. En producción el acceso es con Google.'
            : 'Usa Google para entrar o crear tu cuenta. No necesitas otra contraseña.'}
        </p>

        {status === 'error' ? (
          <p className="form-error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        {error && status === 'signed_out' && error !== 'ACCESS_DENIED' ? (
          <p className="form-error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        <div className="auth-actions">
          <button
            type="button"
            className="btn btn-primary google-btn"
            onClick={() =>
              preview ? onPreviewEnter?.() : void signIn()
            }
            disabled={busy}
          >
            {busy
              ? 'Conectando…'
              : preview
                ? 'Probar en este dispositivo'
                : 'Entrar o registrarme con Google'}
          </button>
          <p className="hint">
            ¿Primera vez? Google crea tu acceso y después completas el perfil.
            Si ya tienes cuenta, entras directo. Si recibiste una invitación,
            se abre el hogar al que te invitaron.
          </p>
        </div>

        <div className="privacy-note">
          <h3>Entrada e inscripción en un solo paso</h3>
          <p className="hint">
            Cada hogar tiene un responsable y su lista de integrantes. Google
            confirma tu identidad; A la PaR no conoce tu contraseña.
          </p>
        </div>
      </div>
    </div>
  )
}
