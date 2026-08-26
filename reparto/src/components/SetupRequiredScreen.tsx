import { BrandLogo } from './BrandLogo'

/** Pantalla cuando el build no trajo las variables VITE_FIREBASE_*. */
export function SetupRequiredScreen() {
  const production = import.meta.env.PROD

  return (
    <div className="lock-screen">
      <div className="lock-card panel" style={{ textAlign: 'left', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
          <BrandLogo size="lg" showWordmark />
        </div>
        <p className="brand-sub" style={{ textAlign: 'center' }}>
          Este sitio se publicó sin la conexión a Google
        </p>
        {production ? (
          <>
            <p className="hint" style={{ marginTop: '1.1rem' }}>
              Las claves ya pueden estar en Netlify, pero este build no las
              incluye. Hay que <strong>volver a compilar</strong>.
            </p>
            <ol className="steps-list" style={{ marginTop: '1rem' }}>
              <li>
                En Netlify → Deploys → Options →{' '}
                <strong>Retry without cache with latest branch commit</strong>
              </li>
              <li>
                Espera un deploy que ejecute <code>npm run build</code> (no
                “All files already uploaded”)
              </li>
              <li>Abre el sitio en una ventana privada</li>
            </ol>
          </>
        ) : (
          <ol className="steps-list" style={{ marginTop: '1.25rem' }}>
            <li>
              Copia <code>.env.example</code> a <code>.env</code> con la
              configuración web de Firebase
            </li>
            <li>Reinicia <code>npm run dev</code></li>
          </ol>
        )}
      </div>
    </div>
  )
}
