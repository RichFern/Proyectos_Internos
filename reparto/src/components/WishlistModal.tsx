import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Space, WishlistItem } from '../types'
import { COMMON_CURRENCIES, spaceCurrency } from '../lib/currency'
import { parseAmount } from '../lib/format'
import {
  bestQuote,
  formatQuotePrice,
  wishlistPriorityLabel,
  wishlistStatusLabel,
  wishlistSummary,
} from '../lib/wishlist'
import { Modal } from './Modal'

interface Props {
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
  onClose: () => void
}

export function WishlistModal({
  space,
  allowMulticurrency,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
  onClose,
}: Props) {
  const items = space.wishlistItems ?? []
  const baseCurrency = spaceCurrency(space)
  const summary = wishlistSummary(items)

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<WishlistItem['priority']>('medium')
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
    onAddItem({
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
    })
    setTitle('')
    setNotes('')
    setPriority('medium')
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

  const sortedQuotes = selected
    ? [...selected.quotes].map((quote, index) => ({ quote, index })).sort((a, b) => a.quote.price - b.quote.price)
    : []

  return (
    <Modal
      wide
      title="Compras planificadas"
      subtitle={`${space.name} · ${summary.total} productos · ${summary.ready} listos para comprar`}
      onClose={onClose}
    >
      <div className="feature-modal">
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
            <h3>Sin compras planificadas</h3>
            <p>Guarda productos, compara precios y elige la mejor opción antes de gastar.</p>
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
                        Mejor: {winner.store} · {formatQuotePrice(winner, space)}
                      </span>
                    ) : (
                      <span className="row-meta">Sin cotizaciones</span>
                    )}
                  </button>
                )
              })}
            </div>

            {selected ? (
              <div className="wishlist-detail">
                <div className="wishlist-card-head">
                  <div>
                    <h3>{selected.title}</h3>
                    <div className="row-meta">{wishlistStatusLabel(selected.status)}</div>
                  </div>
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

                {selected.notes ? <p className="row-meta">{selected.notes}</p> : null}

                <div className="row-actions" style={{ margin: '0.75rem 0' }}>
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

                <label className="field">
                  Prioridad
                  <select
                    value={selected.priority ?? 'medium'}
                    onChange={(event) =>
                      onUpdateItem(selected.id, {
                        priority: event.target.value as WishlistItem['priority'],
                      })
                    }
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </label>

                {sortedQuotes.length > 0 ? (
                  <>
                    <div className="section-head" style={{ marginTop: '1rem' }}>
                      <h2>Cotizaciones</h2>
                    </div>
                    <div className="quote-list">
                      {sortedQuotes.map(({ quote, index }) => {
                        const isBest =
                          index === selected.bestQuoteIndex ||
                          (selected.bestQuoteIndex == null &&
                            quote === bestQuote(selected))
                        return (
                          <div
                            className={`quote-row${isBest ? ' best' : ''}`}
                            key={`${selected.id}-${index}`}
                          >
                            <div>
                              <strong>{quote.store}</strong>
                              {quote.url ? (
                                <div className="row-meta">
                                  <a href={quote.url} target="_blank" rel="noreferrer">
                                    Ver enlace
                                  </a>
                                </div>
                              ) : null}
                            </div>
                            <strong>{formatQuotePrice(quote, space)}</strong>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onUpdateItem(selected.id, { bestQuoteIndex: index })}
                              >
                                Elegir
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onRemoveQuote(selected.id, index)}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <p className="row-meta">Agrega al menos una cotización para comparar.</p>
                )}

                <form className="form-grid extras-form" onSubmit={addQuote}>
                  <h3>Nueva cotización</h3>
                  <div className="form-row">
                    <label className="field">
                      Tienda o sitio
                      <input
                        value={store}
                        onChange={(event) => setStore(event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      Precio
                      <input
                        inputMode="decimal"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        required
                      />
                    </label>
                  </div>
                  {allowMulticurrency ? (
                    <label className="field">
                      Moneda
                      <select
                        value={quoteCurrency}
                        onChange={(event) => setQuoteCurrency(event.target.value)}
                      >
                        {COMMON_CURRENCIES.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="field">
                    Enlace (opcional)
                    <input
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://…"
                    />
                  </label>
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Guardar cotización
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        )}

        <form className="form-grid extras-form" onSubmit={createItem}>
          <h3>Nueva compra planificada</h3>
          <label className="field">
            Qué quieres comprar
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Heladera, notebook, sillón…"
              required
            />
          </label>
          <div className="form-row">
            <label className="field">
              Notas (opcional)
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Medidas, modelo, prioridad…"
              />
            </label>
            <label className="field">
              Prioridad
              <select
                value={priority ?? 'medium'}
                onChange={(event) =>
                  setPriority(event.target.value as WishlistItem['priority'])
                }
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Agregar producto
          </button>
        </form>
      </div>
    </Modal>
  )
}
