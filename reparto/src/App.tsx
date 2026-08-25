import { useState } from 'react'
import { useAppStore } from './hooks/useAppStore'
import { SpaceFormModal } from './components/SpaceFormModal'
import { SpaceView } from './components/SpaceView'
import { KIND_LABELS } from './types'
import { formatMoney } from './lib/format'
import { totalSpent } from './lib/balances'

export default function App() {
  const store = useAppStore()
  const [showSpaceForm, setShowSpaceForm] = useState(false)

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
          <div className="brand-mark" aria-hidden>
            R
          </div>
          <div>
            <div className="brand">Reparto</div>
            <div className="brand-sub">Gastos del hogar y paseos, en proporción</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('¿Restablecer datos de ejemplo? Se perderán los cambios locales.')) {
                store.resetDemo()
              }
            }}
          >
            Datos demo
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowSpaceForm(true)}
          >
            + Nuevo espacio
          </button>
        </div>
      </header>

      {store.spaces.length === 0 ? (
        <section className="panel welcome">
          <h1>Reparto</h1>
          <p>
            Armá espacios para el hogar o un viaje, cargá cuánto gana cada uno y
            registrá quién pagó qué. La app calcula cuánto le toca a cada persona
            y quién le debe a quién.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowSpaceForm(true)}
          >
            Crear primer espacio
          </button>
        </section>
      ) : (
        <div className="layout">
          <aside className="panel panel-pad side-panel">
            <div className="side-title">Espacios</div>
            <div className="space-list">
              {store.spaces.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`space-item${store.activeSpaceId === s.id ? ' active' : ''}`}
                  onClick={() => store.setActiveSpaceId(s.id)}
                >
                  <span className="space-item-name">{s.name}</span>
                  <span className="space-item-meta">
                    {KIND_LABELS[s.kind]} · {formatMoney(totalSpent(s))} · {s.members.length}{' '}
                    pers.
                  </span>
                </button>
              ))}
            </div>
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
    </div>
  )
}
