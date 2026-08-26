import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from './hooks/useAppStore'
import { useAuth } from './hooks/useAuth'
import { useCloudSync } from './hooks/useCloudSync'
import { SpaceFormModal } from './components/SpaceFormModal'
import { SpaceView } from './components/SpaceView'
import { InstallButton } from './components/InstallButton'
import { LockScreen } from './components/LockScreen'
import { LoginScreen } from './components/LoginScreen'
import { PrivacyModal } from './components/PrivacyModal'
import { IdentitySetupModal } from './components/IdentitySetupModal'
import { BrandLogo } from './components/BrandLogo'
import { KIND_LABELS } from './types'
import { BRAND } from './lib/brand'
import { formatMoney } from './lib/format'
import { totalSpent } from './lib/balances'
import { hasPinProtection, isUnlocked } from './lib/access'
import { canAccessSpace, identityKeyFrom } from './lib/identity'

export default function App() {
  const auth = useAuth()
  const store = useAppStore()
  const [showSpaceForm, setShowSpaceForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showIdentitySetup, setShowIdentitySetup] = useState(false)
  const [unlocked, setUnlocked] = useState(() => isUnlocked())

  const myKey = useMemo(
    () =>
      identityKeyFrom(
        auth.cloudEnabled ? auth.user?.email : null,
        store.localIdentity,
      ),
    [auth.cloudEnabled, auth.user?.email, store.localIdentity],
  )

  const visibleSpaces = useMemo(
    () => store.spaces.filter((s) => canAccessSpace(s, myKey)),
    [store.spaces, myKey],
  )

  useEffect(() => {
    if (!store.ready) return
    if (auth.cloudEnabled) return
    if (!myKey && !showIdentitySetup) {
      setShowIdentitySetup(true)
    }
  }, [store.ready, auth.cloudEnabled, myKey, showIdentitySetup])

  useEffect(() => {
    if (!store.activeSpaceId) return
    if (visibleSpaces.some((s) => s.id === store.activeSpaceId)) return
    store.setActiveSpaceId(visibleSpaces[0]?.id ?? null)
  }, [visibleSpaces, store.activeSpaceId, store.setActiveSpaceId])

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
        <p className="brand-sub">Cargando {BRAND.name}…</p>
      </div>
    )
  }

  const activeSpace =
    visibleSpaces.find((s) => s.id === store.activeSpaceId) ?? null

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
          <BrandLogo size="md" />
          <div>
            <div className="brand">
              A la <span className="brand-p">P</span>a<span className="brand-r">R</span>
            </div>
            <div className="brand-sub">
              {auth.cloudEnabled
                ? `Privado · ${auth.user?.email ?? ''}`
                : store.localIdentity?.name
                  ? `Local · ${store.localIdentity.name}`
                  : BRAND.tagline}
            </div>
          </div>
        </div>
        <div className="topbar-actions">
          {!auth.cloudEnabled ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowIdentitySetup(true)}
            >
              Identidad
            </button>
          ) : null}
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

      {visibleSpaces.length === 0 ? (
        <section className="panel welcome">
          <div className="welcome-brand">
            <BrandLogo size="hero" showWordmark />
          </div>
          <p>
            Armá espacios para el hogar o un viaje, cargá cuánto gana cada uno y
            registrá quién pagó qué. Calculamos el equilibrio: cuánto le toca a
            cada persona y quién le debe a quién.
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
              {visibleSpaces.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`space-item${store.activeSpaceId === s.id ? ' active' : ''}`}
                  onClick={() => {
                    store.setActiveSpaceId(s.id)
                    setSidebarOpen(false)
                  }}
                >
                  <span className="space-item-name">
                    {s.visibility === 'personal' ? '🔒 ' : null}
                    {s.name}
                  </span>
                  <span className="space-item-meta">
                    {KIND_LABELS[s.kind]} · {formatMoney(totalSpent(s))} ·{' '}
                    {s.members.length} pers.
                    {s.visibility === 'personal' ? ' · personal' : ''}
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

          {activeSpace ? (
            <SpaceView
              space={activeSpace}
              onDeleteSpace={() => store.deleteSpace(activeSpace.id)}
              onAddMember={(input) => store.addMember(activeSpace.id, input)}
              onUpdateMember={(id, input) =>
                store.updateMember(activeSpace.id, id, input)
              }
              onRemoveMember={(id) => store.removeMember(activeSpace.id, id)}
              onAddExpense={(input) => store.addExpense(activeSpace.id, input)}
              onUpdateExpense={(id, input) =>
                store.updateExpense(activeSpace.id, id, input)
              }
              onRemoveExpense={(id) => store.removeExpense(activeSpace.id, id)}
              onAddTemplate={(input) => store.addTemplate(activeSpace.id, input)}
              onRemoveTemplate={(id) =>
                store.removeTemplate(activeSpace.id, id)
              }
              onAddInstallmentPlan={(input) =>
                store.addInstallmentPlan(activeSpace.id, input)
              }
              onRecordSettlement={(input) =>
                store.recordSettlement(activeSpace.id, input)
              }
              onRemoveSettlement={(id) =>
                store.removeSettlementRecord(activeSpace.id, id)
              }
              onSetCategoryBudget={(monthKey, category, limit) =>
                store.setCategoryBudget(activeSpace.id, monthKey, category, limit)
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
          canCreatePersonal={Boolean(myKey)}
          onCreate={(input) => store.createSpace(input, myKey)}
        />
      ) : null}

      {showPrivacy ? (
        <PrivacyModal
          onClose={() => setShowPrivacy(false)}
          onRestored={() => store.reloadFromStorage()}
          onLocked={() => setUnlocked(false)}
        />
      ) : null}

      {showIdentitySetup && !auth.cloudEnabled ? (
        <IdentitySetupModal
          initial={store.localIdentity}
          required={!myKey}
          onClose={() => setShowIdentitySetup(false)}
          onSave={(identity) => {
            store.setLocalIdentity(identity)
            setShowIdentitySetup(false)
          }}
        />
      ) : null}
    </div>
  )
}
