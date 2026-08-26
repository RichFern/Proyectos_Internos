import { useAuth } from '../hooks/useAuth'
import { BrandLogo } from './BrandLogo'
import { BRAND } from '../lib/brand'

export function LoginScreen() {
  const { status, error, signIn } = useAuth()
  const busy = status === 'loading'

  return (
    <div className="lock-screen">
      <div className="lock-card panel">
        <BrandLogo size="lg" showWordmark />
        <p className="brand-sub">{BRAND.tagline}</p>
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          Ingresá con Google para crear tu hogar o sumarte a una familia que te
          haya dado acceso.
        </p>

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
          <h3>Tu información, bajo control</h3>
          <p className="hint">
            Cada hogar tiene un owner y su propia lista de integrantes. Los
            espacios y gastos personales se guardan separados del resto.
          </p>
        </div>
      </div>
    </div>
  )
}
