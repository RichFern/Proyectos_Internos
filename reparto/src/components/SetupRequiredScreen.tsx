import { useAuth } from '../hooks/useAuth'

/** Pantalla cuando falta configurar Firebase (modo desarrollo / antes de publicar). */
export function SetupRequiredScreen() {
  return (
    <div className="lock-screen">
      <div className="lock-card panel" style={{ textAlign: 'left', maxWidth: 520 }}>
        <div className="brand-mark" aria-hidden style={{ margin: '0 auto 0.85rem' }}>
          R
        </div>
        <h1 className="brand" style={{ textAlign: 'center' }}>
          Reparto privado
        </h1>
        <p className="brand-sub" style={{ textAlign: 'center' }}>
          Falta conectar Google para el modo privado
        </p>
        <ol className="steps-list" style={{ marginTop: '1.25rem' }}>
          <li>
            Seguís la guía <code>docs/PUBLICAR_PRIVADO_GOOGLE.md</code>
          </li>
          <li>
            Creás un proyecto en Firebase (gratis) y activás Login con Google
          </li>
          <li>
            Copiás <code>.env.example</code> a <code>.env</code> con tus claves y los
            2 emails permitidos
          </li>
          <li>Publicás en Netlify/Vercel (HTTPS) e instalás la app en el teléfono</li>
        </ol>
        <p className="hint" style={{ marginTop: '1rem' }}>
          Hasta que eso esté listo, podés seguir en modo local con PIN (botón abajo),
          pero <strong>no es el modo privado total</strong>.
        </p>
        <LocalFallbackNote />
      </div>
    </div>
  )
}

function LocalFallbackNote() {
  const { cloudEnabled } = useAuth()
  if (cloudEnabled) return null
  return (
    <p className="form-success" style={{ marginTop: '1rem' }}>
      Estás en modo local de desarrollo: los datos viven solo en este navegador.
    </p>
  )
}
