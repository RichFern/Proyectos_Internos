import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { PlanTier, Space, WishlistItem } from '../types'
import { COMMON_CURRENCIES, spaceCurrency } from '../lib/currency'
import { limitsFor } from '../lib/plans'
import { parseAmount } from '../lib/format'
import {
  bestQuote,
  formatQuotePrice,
  wishlistPriorityLabel,
  wishlistStatusLabel,
  wishlistSummary,
} from '../lib/wishlist'
import { PremiumGate } from './PremiumGate'
import { spaceIcon } from '../lib/spacePresets'

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  onSelectSpace: (id: string) => void
  planTier: PlanTier
  onOpenPlans?: () => void
  onAddItem: (spaceId: string, input: Pick<WishlistItem, 'title' | 'notes' | 'priority'>) => void
  onUpdateItem: (spaceId: string, itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveItem: (spaceId: string, itemId: string) => void
  onAddQuote: (
    spaceId: string,
    itemId: string,
    quote: { store: string; url?: string; price: number; currency?: string },
  ) => void
  onRemoveQuote: (spaceId: string, itemId: string, quoteIndex: number) => void
}

export function WishlistSection({
  spaces,
  activeSpaceId,
  onSelectSpace,
  planTier,
  onOpenPlans,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
}: Props) {
  const plan = limitsFor(planTier)
  const space = spaces.find((item) => item.id === activeSpaceId) ?? spaces[0] ?? null

  if (!space) {
    return (
      <section className="panel app-section">
        <h1>Cotizaciones</h1>
        <p className="brand-sub">Crea un espacio para planificar compras y comparar precios.</p>
      </section>
    )
  }

  return (
    <section className="panel app-section">
      <header className="app-section-head">
        <div>
          <h1>Cotizaciones</h1>
          <p className="brand-sub">
            Compara precios antes de comprar. Sección premium, separada de los gastos.
          </p>
        </div>
        <label className="field section-space-picker">
          Espacio
          <select value={space.id} onChange={(e) => onSelectSpace(e.target.value)}>
            {spaces.map((item) => (
              <option key={item.id} value={item.id}>
                {spaceIcon(item)} {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <PremiumGate feature="wishlist" planTier={planTier} onOpenPlans={onOpenPlans} />

      {plan.features.wishlist ? (
        <WishlistContent
          space={space}
          allowMulticurrency={plan.features.multipleCurrencies}
          onAddItem={(input) => onAddItem(space.id, input)}
          onUpdateItem={(itemId, patch) => onUpdateItem(space.id, itemId, patch)}
          onRemoveItem={(itemId) => onRemoveItem(space.id, itemId)}
          onAddQuote={(itemId, quote) => onAddQuote(space.id, itemId, quote)}
          onRemoveQuote={(itemId, index) => onRemoveQuote(space.id, itemId, index)}
        />
      ) : null}
    </section>
  )
}

function WishlistContent({
  space,
  allowMulticurrency,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
}: {
  space: Space
  allowMulticurrency: boolean
  onAddItem: (input: Pick<WishlistItem, 'title' | 'notes' | 'priority'>) => void
  onUpdateItem: (itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddQuote: (
    itemId: string,
    quote: { store: string; url?: string; price: number; currency?: string },
  ) => void
  onRemoveQuote: (itemId: string, quoteIndex: number) => void
}) {
  const items = space.wishlistItems ?? []
  const baseCurrency = spaceCurrency(space)
  const summary = wishlistSummary(items)
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority] = useState<WishlistItem['priority']>('medium')
  const [store, setStore] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState(baseCurrency)

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id)
    if (selectedId && !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? '')
    }
  }, [items, selectedId])

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const createItem = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onAddItem({ title: title.trim(), notes: notes.trim() || undefined, priority })
    setTitle('')
    setNotes('')
  }

  const addQuote = (event: FormEvent) => {
    event.preventDefault()
    if (!selected) return
    const amount = parseAmount(price)
    if (!store.trim() || Number.isNaN(amount) || amount <= 0) return
    onAddQuote(selected.id, {
      store: store.trim(),
      url: url.trim() || undefined,
      price: amount,
      currency: allowMulticurrency ? quoteCurrency : baseCurrency,
    })
    setStore('')
    setUrl('')
    setPrice('')
  }

  return (
    <div className="feature-modal">
      <p className="section-summary">
        {space.name} · {summary.total} productos · {summary.ready} listos
      </p>

      <div className="impact-grid savings-summary">
        <div className="stat impact-card">
          <div className="stat-label">En cotización</div>
          <div className="stat-value">{summary.research}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Listos</div>
          <div className="stat-value">{summary.ready}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Comprados</div>
          <div className="stat-value">{summary.bought}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h3>Sin productos planificados</h3>
          <p>Registra lo que quieres comprar y agrega cotizaciones para comparar.</p>
        </div>
      ) : (
        <div className="wishlist-modal-layout">
          <div className="wishlist-sidebar">
            {items.map((item) => {
              const winner = bestQuote(item)
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`wishlist-pick${item.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{item.title}</strong>
                  <span className="row-meta">
                    {wishlistStatusLabel(item.status)} · {wishlistPriorityLabel(item.priority)}
                  </span>
                  {winner ? (
                    <span className="row-meta">
                      {winner.store} · {formatQuotePrice(winner, space)}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          {selected ? (
            <div className="wishlist-detail">
              <div className="wishlist-card-head">
                <h3>{selected.title}</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (confirm(`¿Quitar “${selected.title}”?`)) onRemoveItem(selected.id)
                  }}
                >
                  Quitar
                </button>
              </div>
              <div className="row-actions">
                {(['research', 'ready', 'bought'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`chip${selected.status === status ? ' active' : ''}`}
                    onClick={() => onUpdateItem(selected.id, { status })}
                  >
                    {wishlistStatusLabel(status)}
                  </button>
                ))}
              </div>
              {selected.quotes.map((quote, index) => (
                <div className="quote-row" key={`${selected.id}-${index}`}>
                  <span>{quote.store}</span>
                  <strong>{formatQuotePrice(quote, space)}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRemoveQuote(selected.id, index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <form className="form-grid extras-form" onSubmit={addQuote}>
                <h3>Nueva cotización</h3>
                <div className="form-row">
                  <label className="field">
                    Tienda
                    <input value={store} onChange={(e) => setStore(e.target.value)} required />
                  </label>
                  <label className="field">
                    Precio
                    <input
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </label>
                </div>
                {allowMulticurrency ? (
                  <label className="field">
                    Moneda
                    <select value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)}>
                      {COMMON_CURRENCIES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="submit" className="btn btn-secondary btn-sm">
                  Guardar cotización
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      <form className="form-grid extras-form" onSubmit={createItem}>
        <h3>Nuevo producto</h3>
        <label className="field">
          Qué quieres comprar
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary btn-sm">
          Agregar
        </button>
      </form>
    </div>
  )
}
