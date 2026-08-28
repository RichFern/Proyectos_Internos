import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from './hooks/useAppStore'
import { useAuth } from './hooks/useAuth'
import { useCloudSync } from './hooks/useCloudSync'
import { useHouseholds } from './hooks/useHouseholds'
import { SpaceFormModal } from './components/SpaceFormModal'
import { SpaceView } from './components/SpaceView'
import { SavingsSection } from './components/SavingsSection'
import { WishlistSection } from './components/WishlistSection'
import { InstallButton } from './components/InstallButton'
import { LockScreen } from './components/LockScreen'
import { LoginScreen } from './components/LoginScreen'
import { PrivacyModal } from './components/PrivacyModal'
import { IdentitySetupModal } from './components/IdentitySetupModal'
import { ProfileOnboardingModal } from './components/ProfileOnboardingModal'
import { DefaultCurrencyModal } from './components/DefaultCurrencyModal'
import { HouseholdModal } from './components/HouseholdModal'
import { HouseholdDashboard } from './components/HouseholdDashboard'
import { PlanScreen } from './components/PlanScreen'
import { OnboardingTour } from './components/OnboardingTour'
import { OfflineBanner } from './components/OfflineBanner'
import { SetupRequiredScreen } from './components/SetupRequiredScreen'
import { AccessDeniedScreen } from './components/AccessDeniedScreen'
import { BrandLogo } from './components/BrandLogo'
import { KIND_LABELS, MEMBER_COLORS } from './types'
import type { ExpenseDraft } from './types'
import { BRAND } from './lib/brand'
import { formatMoney } from './lib/format'
import { totalSpent } from './lib/balances'
import { hasPinProtection, isUnlocked } from './lib/access'
import { canAccessSpace, identityKeyFrom } from './lib/identity'
import { starterData } from './lib/storage'
import { canAddSpace, limitsFor } from './lib/plans'
import { isPlatformAdmin } from './lib/admin'
import { spaceIcon } from './lib/spacePresets'
import { captureJoinFromWindow, peekPendingJoin } from './lib/joinInvite'
import { usePlanPreview, resolveEffectivePlanTier } from './hooks/usePlanPreview'
import {
  isCurrencyConfigured,
  resolveDefaultCurrency,
  setDefaultCurrency,
} from './lib/userPreferences'

captureJoinFromWindow(
  window.location.search,
  sessionStorage,
  localStorage,
  (path) => window.history.replaceState({}, '', path),
  window.location.pathname,
)

export default function App() {
  const auth = useAuth()
  const store = useAppStore()
  const tenant = useHouseholds(auth.user)
  const [showSpaceForm, setShowSpaceForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    window.matchMedia('(min-width: 861px)').matches,
  )
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showIdentitySetup, setShowIdentitySetup] = useState(false)
  const [showHousehold, setShowHousehold] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [showDefaultCurrency, setShowDefaultCurrency] = useState(false)
  const [localSessionOpen, setLocalSessionOpen] = useState(true)
  const [spaceQuery, setSpaceQuery] = useState('')
  const [unlocked, setUnlocked] = useState(() => isUnlocked())
  const [expenseNudge, setExpenseNudge] = useState(0)
  const [peopleNudge, setPeopleNudge] = useState(0)
  const [mainView, setMainView] = useState<
    'espacios' | 'ahorros' | 'cotizaciones' | 'hogar'
  >('espacios')
  const [pendingExpenseDraft, setPendingExpenseDraft] = useState<{
    spaceId: string
    draft: ExpenseDraft
  } | null>(null)

  const { previewTier, setPreviewTier } = usePlanPreview()
  const localDevelopment = !auth.cloudEnabled && import.meta.env.DEV
  const householdTier = tenant.activeHousehold?.planTier ?? null
  const planTier = resolveEffectivePlanTier({
    previewTier,
    householdTier,
    localDevelopment,
  })

  const myKey = useMemo(
    () =>
      identityKeyFrom(
        auth.cloudEnabled ? auth.user?.email : null,
        store.localIdentity,
      ),
    [auth.cloudEnabled, auth.user?.email, store.localIdentity],
  )
  const myUid = auth.user?.uid ?? null

  const visibleSpaces = useMemo(
    () =>
      store.spaces.filter((space) => {
        if (space.visibility !== 'personal') return true
        if (space.ownerUid) return space.ownerUid === myUid
        return canAccessSpace(space, myKey)
      }),
    [store.spaces, myKey, myUid],
  )
  const filteredSpaces = useMemo(() => {
    const query = spaceQuery.trim().toLowerCase()
    if (!query) return visibleSpaces
    return visibleSpaces.filter((space) =>
      [space.name, space.description, KIND_LABELS[space.kind]]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [visibleSpaces, spaceQuery])

  useEffect(() => {
    if (!store.ready) return
    if (auth.cloudEnabled) return
    if (!myKey && !showIdentitySetup) {
      setShowIdentitySetup(true)
    }
  }, [store.ready, auth.cloudEnabled, myKey, showIdentitySetup])

  useEffect(() => {
    if (!store.ready) return
    if (isCurrencyConfigured()) return
    if (auth.cloudEnabled && !tenant.profile) return
    if (!auth.cloudEnabled && !myKey) return
    if (showIdentitySetup) return
    setShowDefaultCurrency(true)
  }, [
    store.ready,
    auth.cloudEnabled,
    tenant.profile,
    myKey,
    showIdentitySetup,
  ])

  useEffect(() => {
    if (!store.activeSpaceId) return
    if (visibleSpaces.some((s) => s.id === store.activeSpaceId)) return
    store.setActiveSpaceId(visibleSpaces[0]?.id ?? null)
  }, [visibleSpaces, store.activeSpaceId, store.setActiveSpaceId])

  const getSnapshotRef = useRef(store.getSnapshot)
  getSnapshotRef.current = store.getSnapshot

  const storeApi = useMemo(
    () => ({
      ready: store.ready,
      replaceAllData: store.replaceAllData,
      getSnapshot: () => getSnapshotRef.current(),
    }),
    [store.ready, store.replaceAllData],
  )

  const syncRev = `${store.activeSpaceId}:${store.spaces
    .map(
      (s) =>
        `${s.id}:${s.updatedAt}:${s.expenses.length}:${s.members.length}`,
    )
    .join('|')}`

  useCloudSync(
    auth.status === 'signed_in',
    auth.user?.uid ?? null,
    tenant.activeHouseholdId,
    storeApi,
    syncRev,
  )

  if (!auth.cloudEnabled && !localDevelopment) {
    return <SetupRequiredScreen />
  }

  if (localDevelopment && !localSessionOpen) {
    return (
      <LoginScreen
        preview
        onPreviewEnter={() => setLocalSessionOpen(true)}
      />
    )
  }

  if (auth.cloudEnabled && auth.status === 'loading') {
    return (
      <div className="app-shell">
        <p className="brand-sub">Cargando tu cuenta…</p>
      </div>
    )
  }
  if (auth.cloudEnabled && auth.status === 'signed_out' && auth.error === 'ACCESS_DENIED') {
    return <AccessDeniedScreen />
  }

  if (auth.cloudEnabled && auth.status !== 'signed_in') {
    return <LoginScreen />
  }

  if (auth.cloudEnabled && tenant.loading) {
    return (
      <div className="app-shell">
        <p className="brand-sub">Preparando tu hogar…</p>
      </div>
    )
  }

  if (auth.cloudEnabled && auth.user?.email && !tenant.profile) {
    return (
      <ProfileOnboardingModal
        email={auth.user.email}
        googleName={auth.user.displayName}
        joiningHouseholdName={
          tenant.households.find((h) => h.id === peekPendingJoin(sessionStorage, localStorage))
            ?.name ?? tenant.households[0]?.name ?? null
        }
        onComplete={async (input) => {
          setDefaultCurrency(input.defaultCurrency)
          const initial = starterData(input.defaultCurrency)
          initial.spaces[0].members.push({
            id: auth.user!.uid,
            userUid: auth.user!.uid,
            name: `${input.firstName} ${input.lastName}`.trim(),
            income: 0,
            color: MEMBER_COLORS[0],
            createdAt: new Date().toISOString(),
          })
          store.replaceAllData(initial)
          await tenant.completeProfile(input)
        }}
      />
    )
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
  const canOpenHousehold = Boolean(auth.cloudEnabled && tenant.activeHousehold)
  const householdLimits = tenant.activeHousehold
    ? limitsFor(planTier)
    : null
  const openHousehold = () => {
    setShowHousehold(true)
    setSidebarOpen(false)
  }
  const openPlans = () => {
    setShowPlans(true)
    setSidebarOpen(false)
  }
  const registerWishlistExpense = (spaceId: string, draft: ExpenseDraft) => {
    store.setActiveSpaceId(spaceId)
    setMainView('espacios')
    setSidebarOpen(false)
    setPendingExpenseDraft({ spaceId, draft })
  }

  return (
    <div className="app-shell">
      <OfflineBanner />
      {previewTier ? (
        <div className="plan-preview-banner plan-preview-banner-top">
          <span>
            Plan de prueba: <strong>{limitsFor(planTier).label}</strong>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={openPlans}>
            Cambiar
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPreviewTier(null)}
          >
            Quitar
          </button>
        </div>
      ) : null}
      <OnboardingTour ready={store.ready} />
      <header className="topbar">
        <div className="brand-block">
          <button
            type="button"
            className="btn btn-ghost btn-sm menu-toggle hide-sm"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
          <BrandLogo size="md" showWordmark />
          <div className="brand-sub-wrap">
            {canOpenHousehold ? (
              <>
                <button
                  type="button"
                  className="brand-sub brand-sub-link hide-sm"
                  onClick={openHousehold}
                >
                  {tenant.activeHousehold?.name ?? 'Mi hogar'}
                  {householdLimits ? ` · Plan ${householdLimits.label}` : ''}
                  {tenant.profile?.firstName
                    ? ` · ${tenant.profile.firstName}`
                    : ''}
                </button>
                <button
                  type="button"
                  className="brand-sub brand-sub-link show-sm"
                  onClick={openHousehold}
                >
                  {tenant.activeHousehold?.name ?? 'Mi hogar'}
                </button>
              </>
            ) : (
              <div className="brand-sub">
                {store.localIdentity?.name
                  ? `Local · ${store.localIdentity.name}`
                  : BRAND.tagline}
              </div>
            )}
          </div>
        </div>
        <div className="topbar-actions">
          {localDevelopment ? (
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
              Datos de ejemplo
            </button>
          ) : null}
          {canOpenHousehold ? (
            <button
              type="button"
              className="btn btn-secondary family-entry hide-sm"
              onClick={openHousehold}
            >
              Familia
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (
                tenant.activeHousehold &&
                !canAddSpace(tenant.activeHousehold, visibleSpaces)
              ) {
                alert(
                  `El plan ${limitsFor(tenant.activeHousehold.planTier).label} admite hasta ${limitsFor(tenant.activeHousehold.planTier).maxSpaces} espacios.`,
                )
                return
              }
              setShowSpaceForm(true)
            }}
          >
            + Nuevo espacio
          </button>
        </div>
      </header>

      <div
        className={`layout${sidebarOpen ? ' sidebar-open' : ' sidebar-closed'}`}
      >
        {sidebarOpen ? (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <aside className="panel panel-pad side-panel">
          {tenant.households.length > 1 ? (
            <label className="field household-switcher">
              Hogar
              <select
                value={tenant.activeHouseholdId ?? ''}
                onChange={(event) =>
                  tenant.setActiveHouseholdId(event.target.value)
                }
              >
                {tenant.households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="side-head">
            <div className="side-title">Espacios</div>
            <button
              type="button"
              className="btn btn-ghost btn-sm sidebar-close show-sm"
              onClick={() => setSidebarOpen(false)}
            >
              Cerrar
            </button>
          </div>
          {visibleSpaces.length > 5 ? (
            <label className="sidebar-search">
              <span className="sr-only">Buscar espacio</span>
              <input
                type="search"
                value={spaceQuery}
                onChange={(event) => setSpaceQuery(event.target.value)}
                placeholder="Buscar espacio…"
              />
            </label>
          ) : null}
          <div className="space-list">
            {filteredSpaces.map((s) => (
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
                  {spaceIcon(s)} {s.name}
                </span>
                <span className="space-item-meta">
                  {KIND_LABELS[s.kind]} · {formatMoney(totalSpent(s))} ·{' '}
                  {s.members.length} pers.
                  {s.visibility === 'personal' ? ' · personal' : ''}
                </span>
              </button>
            ))}
            {visibleSpaces.length === 0 ? (
              <p className="sidebar-empty">
                Todavía no hay espacios. Crea uno con Nuevo, abajo.
              </p>
            ) : null}
            {visibleSpaces.length > 0 && filteredSpaces.length === 0 ? (
              <p className="hint">No hay espacios con ese nombre.</p>
            ) : null}
          </div>
          <div className="sidebar-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSidebarOpen(false)
                setShowSpaceForm(true)
              }}
            >
              + Nuevo espacio
            </button>
            {canOpenHousehold ? (
              <button
                type="button"
                className="btn btn-family btn-sm dock-duplicate"
                onClick={openHousehold}
              >
                Mi hogar y familia
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-duplicate"
              onClick={() => {
                setSidebarOpen(false)
                setShowPrivacy(true)
              }}
            >
              Ajustes
            </button>
            <InstallButton />
          </div>
        </aside>

        {mainView === 'espacios' && activeSpace ? (
          <SpaceView
            space={activeSpace}
            expenseNudge={expenseNudge}
            peopleNudge={peopleNudge}
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
            currentUserUid={myUid}
            viewerName={tenant.profile?.displayName ?? store.localIdentity?.name ?? null}
            otherSpaces={visibleSpaces
              .filter((item) => item.id !== activeSpace.id)
              .map((item) => ({ id: item.id, name: item.name }))}
            onMoveExpense={(expenseId, toSpaceId) =>
              store.moveExpense(activeSpace.id, expenseId, toSpaceId)
            }
            planTier={planTier}
            onUpdateSpace={(patch) => store.updateSpace(activeSpace.id, patch)}
            pendingExpenseDraft={
              pendingExpenseDraft?.spaceId === activeSpace.id
                ? pendingExpenseDraft.draft
                : null
            }
            onConsumePendingExpenseDraft={() => setPendingExpenseDraft(null)}
          />
        ) : mainView === 'hogar' && tenant.activeHousehold ? (
          <HouseholdDashboard
            household={tenant.activeHousehold}
            spaces={visibleSpaces}
            planTier={planTier}
            onOpenHousehold={openHousehold}
            onOpenPlans={openPlans}
          />
        ) : mainView === 'ahorros' ? (
          <SavingsSection
            spaces={visibleSpaces}
            activeSpaceId={store.activeSpaceId}
            onSelectSpace={store.setActiveSpaceId}
            planTier={planTier}
            onOpenPlans={openPlans}
            defaultMemberId={myUid}
            onAddGoal={store.addSavingsGoal}
            onRemoveGoal={store.removeSavingsGoal}
            onAddMovement={store.addSavingsMovement}
            onRemoveMovement={store.removeSavingsMovement}
          />
        ) : mainView === 'cotizaciones' ? (
          <WishlistSection
            spaces={visibleSpaces}
            activeSpaceId={store.activeSpaceId}
            onSelectSpace={store.setActiveSpaceId}
            planTier={planTier}
            onOpenPlans={openPlans}
            onAddItem={store.addWishlistItem}
            onUpdateItem={store.updateWishlistItem}
            onRemoveItem={store.removeWishlistItem}
            onAddQuote={store.addWishlistQuote}
            onRemoveQuote={store.removeWishlistQuote}
            onRegisterExpense={registerWishlistExpense}
            defaultPaidById={myUid}
          />
        ) : mainView === 'espacios' ? (
          <section className="panel welcome">
            {visibleSpaces.length === 0 ? (
              <>
                <div className="welcome-brand">
                  <BrandLogo size="hero" showWordmark />
                </div>
                <p>
                  Arma un espacio para el hogar o un viaje, o invita a la familia
                  para compartir la cuenta.
                </p>
                <div className="welcome-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowSpaceForm(true)}
                  >
                    Crear primer espacio
                  </button>
                  {canOpenHousehold ? (
                    <button
                      type="button"
                      className="btn btn-family"
                      onClick={openHousehold}
                    >
                      Invitar a la familia
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPrivacy(true)}
                  >
                    Ajustes
                  </button>
                  <InstallButton />
                </div>
              </>
            ) : (
              <>
                <h1>Elige un espacio</h1>
                <p>O crea uno nuevo para empezar a cargar gastos.</p>
              </>
            )}
          </section>
        ) : null}
      </div>

      {showSpaceForm ? (
        <SpaceFormModal
          onClose={() => setShowSpaceForm(false)}
          canCreatePersonal={Boolean(myKey || myUid)}
          defaultCurrency={resolveDefaultCurrency({
            profileCurrency: tenant.profile?.defaultCurrency,
            localCurrency: store.localIdentity?.defaultCurrency,
          })}
          onCreate={(input) =>
            store.createSpace(input, myKey, myUid, input.currency)
          }
        />
      ) : null}

      {showDefaultCurrency ? (
        <DefaultCurrencyModal
          required
          onComplete={(currency) => {
            setDefaultCurrency(currency)
            setShowDefaultCurrency(false)
          }}
        />
      ) : null}

      {showPrivacy ? (
        <PrivacyModal
          onClose={() => setShowPrivacy(false)}
          onRestored={() => store.reloadFromStorage()}
          onLocked={() => setUnlocked(false)}
          profile={tenant.profile}
          onUpdateProfile={tenant.updateProfile}
          onEditLocalIdentity={
            localDevelopment
              ? () => {
                  setShowPrivacy(false)
                  setShowIdentitySetup(true)
                }
              : undefined
          }
          onLocalSignOut={
            localDevelopment
              ? () => {
                  setShowPrivacy(false)
                  setLocalSessionOpen(false)
                }
              : undefined
          }
          onOpenHousehold={
            canOpenHousehold
              ? () => {
                  setShowPrivacy(false)
                  setShowHousehold(true)
                }
              : undefined
          }
          onOpenPlans={() => {
            setShowPrivacy(false)
            openPlans()
          }}
          localDefaultCurrency={store.localIdentity?.defaultCurrency}
          onUpdateLocalCurrency={
            localDevelopment
              ? (currency) => {
                  const identity = store.localIdentity
                  if (!identity) return
                  setDefaultCurrency(currency)
                  store.setLocalIdentity({ ...identity, defaultCurrency: currency })
                }
              : undefined
          }
        />
      ) : null}

      {showIdentitySetup && !auth.cloudEnabled ? (
        <IdentitySetupModal
          initial={store.localIdentity}
          required={!myKey}
          onClose={() => setShowIdentitySetup(false)}
          onSave={(identity) => {
            if (identity.defaultCurrency) setDefaultCurrency(identity.defaultCurrency)
            store.setLocalIdentity(identity)
            setShowIdentitySetup(false)
          }}
        />
      ) : null}

      {showPlans ? (
        <PlanScreen
          household={tenant.activeHousehold}
          profile={tenant.profile}
          spaceCount={visibleSpaces.length}
          effectiveTier={planTier}
          householdTier={householdTier}
          previewTier={previewTier}
          onAssignPlan={tenant.setPlan}
          canAssignPlan={isPlatformAdmin(auth.user?.email)}
          onPreviewPlan={setPreviewTier}
          onClose={() => setShowPlans(false)}
        />
      ) : null}

      {showHousehold && tenant.activeHousehold && tenant.profile ? (
        <HouseholdModal
          household={tenant.activeHousehold}
          profile={tenant.profile}
          onInvite={tenant.invite}
          onRemove={tenant.removeMember}
          onAssignPlan={tenant.setPlan}
          canAssignPlan={isPlatformAdmin(auth.user?.email)}
          spaceCount={visibleSpaces.length}
          onClose={() => setShowHousehold(false)}
        />
      ) : null}

      <nav className="app-dock" aria-label="Navegación principal">
        <button
          type="button"
          className={`dock-gastos${mainView === 'espacios' ? ' active' : ''}`}
          onClick={() => {
            if (mainView === 'espacios') {
              setSidebarOpen((v) => !v)
            } else {
              setMainView('espacios')
            }
            if (window.matchMedia('(min-width: 861px)').matches && mainView !== 'espacios') {
              setSidebarOpen(true)
            }
          }}
        >
          <span aria-hidden="true">☰</span>
          Gastos
        </button>
        <button
          type="button"
          className={`dock-ahorros${mainView === 'ahorros' ? ' active' : ''}`}
          onClick={() => {
            setMainView('ahorros')
            setSidebarOpen(false)
          }}
        >
          <span aria-hidden="true">◎</span>
          Ahorros
        </button>
        <button
          type="button"
          className={`dock-cotizaciones${mainView === 'cotizaciones' ? ' active' : ''}`}
          onClick={() => {
            setMainView('cotizaciones')
            setSidebarOpen(false)
          }}
        >
          <span aria-hidden="true">◇</span>
          Cotizaciones
        </button>
        <button
          type="button"
          className="dock-gasto"
          onClick={() => {
            setMainView('espacios')
            setSidebarOpen(false)
            if (!activeSpace) {
              setShowSpaceForm(true)
              return
            }
            setExpenseNudge((n) => n + 1)
          }}
        >
          <span aria-hidden="true">+</span>
          Gasto
        </button>
        {canOpenHousehold ? (
          <button
            type="button"
            className={`dock-familia${mainView === 'hogar' ? ' active' : ''}`}
            onClick={() => {
              setMainView('hogar')
              setSidebarOpen(false)
            }}
          >
            <span aria-hidden="true">⌂</span>
            Hogar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMainView('espacios')
              setSidebarOpen(false)
              setPeopleNudge((n) => n + 1)
            }}
          >
            <span aria-hidden="true">👤</span>
            Personas
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false)
            setShowPrivacy(true)
          }}
        >
          <span aria-hidden="true">⚙</span>
          Ajustes
        </button>
      </nav>
    </div>
  )
}
