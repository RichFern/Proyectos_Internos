import { useMemo, useState } from 'react'
import { useAppStore } from './hooks/useAppStore'
import { useAuth } from './hooks/useAuth'
import { useCloudSync } from './hooks/useCloudSync'
import { SpaceFormModal } from './components/SpaceFormModal'
import { SpaceView } from './components/SpaceView'
import { InstallButton } from './components/InstallButton'
import { LockScreen } from './components/LockScreen'
import { LoginScreen } from './components/LoginScreen'
import { PrivacyModal } from './components/PrivacyModal'
import { KIND_LABELS } from './types'
import { formatMoney } from './lib/format'
import { totalSpent } from './lib/balances'
import { hasPinProtection, isUnlocked } from './lib/access'

export default function App() {
  const auth = useAuth()
  const store = useAppStore()
  const [showSpaceForm, setShowSpaceForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [unlocked, setUnlocked] = useState(() => isUnlocked())

  const storeApi = useMemo(
    () => ({
      ready: store.ready,
      replaceAllData: store.replaceAllData,
      getSnapshot: store.getSnapshot,
    }),
    [store.ready, store.replaceAllData, store.getSnapshot],
  )

  useCloudSync(
    auth.status === 'signed_in',
    auth.user?.uid ?? null,
    storeApi,
  )

  // Modo nube: hay que entrar con Google
  if (auth.cloudEnabled) {
    if (auth.status === 'loading') {
      return (
        <div className="app-shell">
          <p className="brand-sub">Verificando acceso privado…</p>
        </div>
      )
    }
    if (auth.status !== 'signed_in') {
      return <LoginScreen />
    }
  }

  // PIN local opcional (extra en el dispositivo)
  if (hasPinProtection() && !unlocked) {
    return <LockScreen onUnlocked={() => setUnlocked(true)} />
  }

  if (!store.ready) {
    return (
      <div className="app-shell">
        <p className="brand-sub">Cargando Reparto…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <button
            type="button"
            className="btn btn-ghost btn-sm menu-toggle"
            aria-label="Abrir espacios"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
          <div className="brand-mark" aria-hidden>
            R
          </div>
          <div>
            <div className="brand">Reparto</div>
            <div className="brand-sub">
              {auth.cloudEnabled
                ? `Privado · ${auth.user?.email ?? ''}`
                : 'Gastos del hogar y paseos, en proporción'}
            </div>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPrivacy(true)}
          >
            Privacidad
          </button>
          {auth.cloudEnabled ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void auth.signOut()}
            >
              Salir
            </button>
          ) : null}
          <InstallButton />
          {!auth.cloudEnabled ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm hide-sm"
              onClick={() => {
                if (
                  confirm(
                    '¿Restablecer datos de ejemplo? Se perderán los cambios locales.',
                  )
                ) {
                  store.resetDemo()
                }
              }}
            >
              Datos demo
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowSpaceForm(true)}
          >
            + Nuevo espacio
          </button>
        </div>
      </header>

      {!auth.cloudEnabled ? (
        <div className="cloud-banner">
          Modo local: para privacidad total con Google seguí{' '}
          <code>docs/PUBLICAR_PRIVADO_GOOGLE.md</code>
        </div>
      ) : (
        <div className="cloud-banner cloud-banner-ok">
          Sesión Google activa · datos sincronizados solo entre cuentas autorizadas
        </div>
      )}

      {store.spaces.length === 0 ? (
        <section className="panel welcome">
          <h1>Reparto</h1>
          <p>
            Armá espacios para el hogar o un viaje, cargá cuánto gana cada uno y
            registrá quién pagó qué. La app calcula cuánto le toca a cada persona
            y quién le debe a quién.
          </p>
          <div className="welcome-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSpaceForm(true)}
            >
              Crear primer espacio
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPrivacy(true)}
            >
              Privacidad y respaldo
            </button>
            <InstallButton />
          </div>
        </section>
      ) : (
        <div className={`layout${sidebarOpen ? ' sidebar-open' : ''}`}>
          {sidebarOpen ? (
            <button
              type="button"
              className="sidebar-backdrop"
              aria-label="Cerrar menú"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <aside className="panel panel-pad side-panel">
            <div className="side-title">Espacios</div>
            <div className="space-list">
              {store.spaces.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`space-item${store.activeSpaceId === s.id ? ' active' : ''}`}
                  onClick={() => {
                    store.setActiveSpaceId(s.id)
                    setSidebarOpen(false)
                  }}
                >
                  <span className="space-item-name">{s.name}</span>
                  <span className="space-item-meta">
                    {KIND_LABELS[s.kind]} · {formatMoney(totalSpent(s))} ·{' '}
                    {s.members.length} pers.
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm show-sm"
              style={{ marginTop: '0.85rem', width: '100%' }}
              onClick={() => {
                setShowPrivacy(true)
                setSidebarOpen(false)
              }}
            >
              Privacidad y respaldo
            </button>
          </aside>

          {store.activeSpace ? (
            <SpaceView
              space={store.activeSpace}
              onDeleteSpace={() => store.deleteSpace(store.activeSpace!.id)}
              onAddMember={(input) => store.addMember(store.activeSpace!.id, input)}
              onUpdateMember={(id, input) =>
                store.updateMember(store.activeSpace!.id, id, input)
              }
              onRemoveMember={(id) => store.removeMember(store.activeSpace!.id, id)}
              onAddExpense={(input) => store.addExpense(store.activeSpace!.id, input)}
              onUpdateExpense={(id, input) =>
                store.updateExpense(store.activeSpace!.id, id, input)
              }
              onRemoveExpense={(id) => store.removeExpense(store.activeSpace!.id, id)}
              onAddTemplate={(input) => store.addTemplate(store.activeSpace!.id, input)}
              onRemoveTemplate={(id) =>
                store.removeTemplate(store.activeSpace!.id, id)
              }
              onAddInstallmentPlan={(input) =>
                store.addInstallmentPlan(store.activeSpace!.id, input)
              }
            />
          ) : (
            <section className="panel welcome">
              <h1>Elegí un espacio</h1>
              <p>O creá uno nuevo para empezar a cargar gastos.</p>
            </section>
          )}
        </div>
      )}

      {showSpaceForm ? (
        <SpaceFormModal
          onClose={() => setShowSpaceForm(false)}
          onCreate={(input) => store.createSpace(input)}
        />
      ) : null}

      {showPrivacy ? (
        <PrivacyModal
          onClose={() => setShowPrivacy(false)}
          onRestored={() => store.reloadFromStorage()}
          onLocked={() => setUnlocked(false)}
        />
      ) : null}
    </div>
  )
}
