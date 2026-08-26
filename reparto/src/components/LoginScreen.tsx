import { useAuth } from '../hooks/useAuth'
import { BrandLogo } from './BrandLogo'
import { BRAND } from '../lib/brand'

export function LoginScreen() {
  const { status, error, signIn, allowedEmails } = useAuth()
  const busy = status === 'loading'

  return (
    <div className="lock-screen">
      <div className="lock-card panel">
        <BrandLogo size="lg" showWordmark />
        <p className="brand-sub">{BRAND.tagline}</p>
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          Acceso privado con Google. Solo entran las cuentas autorizadas. Si no
          estás en la lista, no vas a poder usar la app aunque tengas el link.
        </p>

        {status === 'denied' ? (
          <p className="form-error" style={{ marginTop: '1rem' }}>
            {error ?? 'Esta cuenta de Google no está autorizada.'}
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="form-error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        {error && status === 'signed_out' ? (
          <p className="form-error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-primary google-btn"
          style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}
          onClick={() => void signIn()}
          disabled={busy}
        >
          {busy ? 'Conectando…' : 'Entrar con Google'}
        </button>

        <div className="privacy-note">
          <h3>Quién puede entrar</h3>
          {allowedEmails.length ? (
            <ul>
              {allowedEmails.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : (
            <p className="hint">Todavía no hay emails configurados en el servidor.</p>
          )}
          <p className="hint">
            Los datos van cifrados en tránsito (HTTPS) y en Firebase solo esas
            cuentas pueden leer o escribir (reglas del servidor).
          </p>
        </div>
      </div>
    </div>
  )
}
