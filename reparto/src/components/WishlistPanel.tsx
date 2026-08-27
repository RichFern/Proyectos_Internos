import { useState, type FormEvent } from 'react'
import type { Space, WishlistItem } from '../types'
import { COMMON_CURRENCIES, spaceCurrency } from '../lib/currency'
import { parseAmount } from '../lib/format'
import { bestQuote, formatQuotePrice, wishlistStatusLabel } from '../lib/wishlist'

interface Props {
  space: Space
  allowMulticurrency: boolean
  onAddItem: (input: Pick<WishlistItem, 'title' | 'notes'>) => void
  onUpdateItem: (itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddQuote: (
    itemId: string,
    quote: { store: string; url?: string; price: number; currency?: string },
  ) => void
  onRemoveQuote: (itemId: string, quoteIndex: number) => void
}

export function WishlistPanel({
  space,
  allowMulticurrency,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
}: Props) {
  const items = space.wishlistItems ?? []
  const baseCurrency = spaceCurrency(space)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [quoteItemId, setQuoteItemId] = useState(items[0]?.id ?? '')
  const [store, setStore] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState(baseCurrency)

  const createItem = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onAddItem({ title: title.trim(), notes: notes.trim() || undefined })
    setTitle('')
    setNotes('')
  }

  const addQuote = (event: FormEvent) => {
    event.preventDefault()
    const amount = parseAmount(price)
    if (!quoteItemId || !store.trim() || Number.isNaN(amount) || amount <= 0) return
    onAddQuote(quoteItemId, {
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
    <div className="extras-panel">
      {items.length === 0 ? (
        <div className="empty">
          <h3>Sin compras planificadas</h3>
          <p>Guarda productos, compara precios y elige la mejor opción antes de gastar.</p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const winner = bestQuote(item)
            const bestIndex =
              item.bestQuoteIndex ??
              (winner ? item.quotes.indexOf(winner) : undefined)
            return (
              <article className="wishlist-card" key={item.id}>
                <div className="wishlist-card-head">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="row-meta">{wishlistStatusLabel(item.status)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm(`¿Quitar “${item.title}”?`)) onRemoveItem(item.id)
                    }}
                  >
                    Quitar
                  </button>
                </div>
                {item.notes ? <p className="row-meta">{item.notes}</p> : null}
                {winner ? (
                  <div className="wishlist-best">
                    Mejor opción: <strong>{winner.store}</strong> ·{' '}
                    {formatQuotePrice(winner, space)}
                    {winner.url ? (
                      <>
                        {' '}
                        ·{' '}
                        <a href={winner.url} target="_blank" rel="noreferrer">
                          Ver enlace
                        </a>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="row-meta">Agrega al menos una cotización.</p>
                )}
                {item.quotes.length > 1 ? (
                  <div className="quote-list">
                    {item.quotes.map((quote, index) => (
                      <div
                        className={`quote-row${index === bestIndex ? ' best' : ''}`}
                        key={`${item.id}-${index}`}
                      >
                        <span>{quote.store}</span>
                        <strong>{formatQuotePrice(quote, space)}</strong>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => onUpdateItem(item.id, { bestQuoteIndex: index })}
                          >
                            Elegir
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => onRemoveQuote(item.id, index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                  {(['research', 'ready', 'bought'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`chip${item.status === status ? ' active' : ''}`}
                      onClick={() => onUpdateItem(item.id, { status })}
                    >
                      {wishlistStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <form className="form-grid extras-form" onSubmit={createItem}>
        <h3>Nueva compra planificada</h3>
        <label className="field">
          Qué quieres comprar
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Heladera, notebook, sillón"
            required
          />
        </label>
        <label className="field">
          Notas (opcional)
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Medidas, modelo, prioridad…"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-sm">
          Agregar
        </button>
      </form>

      {items.length > 0 ? (
        <form className="form-grid extras-form" onSubmit={addQuote}>
          <h3>Agregar cotización</h3>
          <label className="field">
            Producto
            <select
              value={quoteItemId}
              onChange={(event) => setQuoteItemId(event.target.value)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label className="field">
              Tienda o sitio
              <input value={store} onChange={(event) => setStore(event.target.value)} required />
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
      ) : null}
    </div>
  )
}
