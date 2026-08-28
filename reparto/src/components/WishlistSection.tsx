import { useMemo, useState, type FormEvent } from 'react'
import type { ExpenseDraft, Member, PlanTier, Space, WishlistItem } from '../types'
import { COMMON_CURRENCIES, spaceCurrency } from '../lib/currency'
import { limitsFor } from '../lib/plans'
import { parseAmount, todayISO } from '../lib/format'
import { bestQuote, formatQuotePrice } from '../lib/wishlist'
import {
  KANBAN_LABELS,
  isQuoteOnSale,
  quoteApprovalCount,
  wishlistKanbanColumn,
  type WishlistKanbanColumn,
} from '../lib/wishlistKanban'
import { PremiumUpsell } from './PremiumUpsell'
import { Modal } from './Modal'
import { AppIcon, UiCheck } from './AppIcon'

interface Props {
  hubSpace: Space | null
  members: Member[]
  expenseSpaces: Space[]
  planTier: PlanTier
  onOpenUpgrade?: () => void
  onAddItem: (spaceId: string, input: Pick<WishlistItem, 'title' | 'notes' | 'priority'>) => void
  onUpdateItem: (spaceId: string, itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveItem: (spaceId: string, itemId: string) => void
  onAddQuote: (
    spaceId: string,
    itemId: string,
    quote: {
      store: string
      url?: string
      price: number
      currency?: string
      listPrice?: number
    },
  ) => void
  onRemoveQuote: (spaceId: string, itemId: string, quoteIndex: number) => void
  onRegisterExpense?: (spaceId: string, draft: ExpenseDraft) => void
  defaultPaidById?: string | null
}

const COLUMNS: WishlistKanbanColumn[] = ['ideas', 'evaluating', 'bought']

export function WishlistSection({
  hubSpace,
  members,
  expenseSpaces,
  planTier,
  onOpenUpgrade,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
  onRegisterExpense,
  defaultPaidById,
}: Props) {
  const plan = limitsFor(planTier)

  return (
    <section className="module-page wishlist-module">
      <header className="module-header">
        <div>
          <h1 className="module-title">Planificador de Compras</h1>
          <p className="module-subtitle">
            Mesa de decisiones para compras grandes — global al hogar, no ligado a un espacio de gastos.
          </p>
        </div>
      </header>

      <PremiumUpsell feature="wishlist" planTier={planTier} onOpenUpgrade={onOpenUpgrade} />

      {plan.features.wishlist && hubSpace ? (
        <WishlistKanban
          space={hubSpace}
          members={members}
          expenseSpaces={expenseSpaces}
          allowMulticurrency={plan.features.multipleCurrencies}
          onAddItem={(input) => onAddItem(hubSpace.id, input)}
          onUpdateItem={(itemId, patch) => onUpdateItem(hubSpace.id, itemId, patch)}
          onRemoveItem={(itemId) => onRemoveItem(hubSpace.id, itemId)}
          onAddQuote={(itemId, quote) => onAddQuote(hubSpace.id, itemId, quote)}
          onRemoveQuote={(itemId, index) => onRemoveQuote(hubSpace.id, itemId, index)}
          onRegisterExpense={onRegisterExpense}
          defaultPaidById={defaultPaidById}
        />
      ) : null}
    </section>
  )
}

function WishlistKanban({
  space,
  members,
  expenseSpaces,
  allowMulticurrency,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddQuote,
  onRemoveQuote,
  onRegisterExpense,
  defaultPaidById,
}: {
  space: Space
  members: Member[]
  expenseSpaces: Space[]
  allowMulticurrency: boolean
  onAddItem: (input: Pick<WishlistItem, 'title' | 'notes' | 'priority'>) => void
  onUpdateItem: (itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddQuote: (
    itemId: string,
    quote: {
      store: string
      url?: string
      price: number
      currency?: string
      listPrice?: number
    },
  ) => void
  onRemoveQuote: (itemId: string, quoteIndex: number) => void
  onRegisterExpense?: (spaceId: string, draft: ExpenseDraft) => void
  defaultPaidById?: string | null
}) {
  const items = space.wishlistItems ?? []
  const baseCurrency = spaceCurrency(space)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')

  const columns = useMemo(() => {
    const map: Record<WishlistKanbanColumn, WishlistItem[]> = {
      ideas: [],
      evaluating: [],
      bought: [],
    }
    for (const item of items) {
      map[wishlistKanbanColumn(item)].push(item)
    }
    return map
  }, [items])

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null

  const createFromLink = (event: FormEvent) => {
    event.preventDefault()
    if (!newTitle.trim()) return
    onAddItem({ title: newTitle.trim(), priority: 'medium' })
    setNewTitle('')
    setLinkUrl('')
  }

  const toggleApproval = (item: WishlistItem, quoteIndex: number, memberId: string) => {
    const quotes = item.quotes.map((quote, index) => {
      if (index !== quoteIndex) return quote
      const current = quote.approvedByMemberIds ?? []
      const has = current.includes(memberId)
      return {
        ...quote,
        approvedByMemberIds: has
          ? current.filter((id) => id !== memberId)
          : [...current, memberId],
      }
    })
    onUpdateItem(item.id, { quotes })
  }

  const moveColumn = (item: WishlistItem, column: WishlistKanbanColumn) => {
    if (column === 'bought') onUpdateItem(item.id, { status: 'bought' })
    else if (column === 'evaluating') onUpdateItem(item.id, { status: 'ready' })
    else onUpdateItem(item.id, { status: 'research', quotes: [] })
  }

  const registerExpense = (item: WishlistItem) => {
    const winner = bestQuote(item)
    if (!winner) {
      alert('Agrega al menos una cotización.')
      return
    }
    const payer =
      members.find((m) => m.userUid === defaultPaidById)?.id ??
      members.find((m) => m.id === defaultPaidById)?.id ??
      members[0]?.id
    if (!payer || !onRegisterExpense) return
    const targetSpace =
      expenseSpaces.find((item) => item.members.some((member) => member.id === payer)) ??
      expenseSpaces[0]
    if (!targetSpace) {
      alert('Crea un espacio de gastos para registrar la compra.')
      return
    }
    onUpdateItem(item.id, { status: 'bought' })
    onRegisterExpense(targetSpace.id, {
      description: item.title,
      amount: winner.price,
      category: 'compras',
      paidById: payer,
      date: todayISO(),
      splitMode: 'equal',
      participantIds: [],
      notes: [winner.store, winner.url].filter(Boolean).join(' · ') || undefined,
      currency: winner.currency ?? baseCurrency,
    })
  }

  return (
    <div className="wishlist-kanban-wrap">
      <form className="wishlist-search-pill" onSubmit={createFromLink}>
        <AppIcon name="link" size={18} className="ui-icon wishlist-search-icon" />
        <input
          className="wishlist-search-input"
          value={linkUrl || newTitle}
          onChange={(e) => {
            setLinkUrl(e.target.value)
            setNewTitle(e.target.value)
          }}
          placeholder="Pega un link o escribe qué quieres comprar…"
          aria-label="Nueva idea de compra"
        />
        <button type="submit" className="wishlist-search-submit">
          Agregar
        </button>
      </form>

      <div className="wishlist-kanban">
        {COLUMNS.map((column) => (
          <div className="kanban-col" key={column}>
            <div className="kanban-col-header">
              <h3>{KANBAN_LABELS[column]}</h3>
              <span className="kanban-badge">{columns[column].length}</span>
            </div>
            <div className="kanban-cards">
              {columns[column].length === 0 ? (
                <div className="kanban-empty">
                  <p>Sin elementos</p>
                  <span>Arrastra un ítem aquí</span>
                </div>
              ) : (
                columns[column].map((item) => {
                  const winner = bestQuote(item)
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`kanban-card${selectedId === item.id ? ' active' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <strong>{item.title}</strong>
                      {winner ? (
                        <span className="kanban-card-meta">
                          {winner.store} · {formatQuotePrice(winner, space)}
                        </span>
                      ) : (
                        <span className="kanban-card-meta">Sin cotizaciones</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <WishlistDetail
          item={selected}
          space={space}
          members={members}
          allowMulticurrency={allowMulticurrency}
          onClose={() => setSelectedId(null)}
          onRemove={() => {
            if (confirm(`¿Quitar “${selected.title}”?`)) {
              onRemoveItem(selected.id)
              setSelectedId(null)
            }
          }}
          onUpdateItem={(patch) => onUpdateItem(selected.id, patch)}
          onAddQuote={(quote) => onAddQuote(selected.id, quote)}
          onRemoveQuote={(index) => onRemoveQuote(selected.id, index)}
          onToggleApproval={(quoteIndex, memberId) =>
            toggleApproval(selected, quoteIndex, memberId)
          }
          onMoveColumn={(column) => moveColumn(selected, column)}
          onRegisterExpense={() => registerExpense(selected)}
          hasRegisterExpense={Boolean(onRegisterExpense)}
        />
      ) : null}
    </div>
  )
}

function WishlistDetail({
  item,
  space,
  members,
  allowMulticurrency,
  onClose,
  onRemove,
  onAddQuote,
  onRemoveQuote,
  onToggleApproval,
  onMoveColumn,
  onRegisterExpense,
  hasRegisterExpense,
}: {
  item: WishlistItem
  space: Space
  members: Member[]
  allowMulticurrency: boolean
  onClose: () => void
  onRemove: () => void
  onAddQuote: (quote: {
    store: string
    url?: string
    price: number
    currency?: string
    listPrice?: number
  }) => void
  onRemoveQuote: (index: number) => void
  onToggleApproval: (quoteIndex: number, memberId: string) => void
  onMoveColumn: (column: WishlistKanbanColumn) => void
  onRegisterExpense: () => void
  hasRegisterExpense: boolean
  onUpdateItem: (patch: Partial<WishlistItem>) => void
}) {
  const baseCurrency = spaceCurrency(space)
  const [store, setStore] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState(baseCurrency)

  const addQuote = (event: FormEvent) => {
    event.preventDefault()
    const amount = parseAmount(price)
    const list = listPrice ? parseAmount(listPrice) : NaN
    if (!store.trim() || Number.isNaN(amount) || amount <= 0) return
    onAddQuote({
      store: store.trim(),
      url: url.trim() || undefined,
      price: amount,
      listPrice: !Number.isNaN(list) && list > amount ? list : undefined,
      currency: allowMulticurrency ? quoteCurrency : baseCurrency,
    })
    setStore('')
    setUrl('')
    setPrice('')
    setListPrice('')
  }

  return (
    <Modal
      title={item.title}
      subtitle="Comparativa y aprobación"
      onClose={onClose}
      wide
    >
      <div className="row-actions wishlist-detail-actions">
        <button type="button" className="chip" onClick={() => onMoveColumn('ideas')}>
          Ideas
        </button>
        <button type="button" className="chip" onClick={() => onMoveColumn('evaluating')}>
          En evaluación
        </button>
        <button type="button" className="chip" onClick={() => onMoveColumn('bought')}>
          Comprado
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
          Quitar
        </button>
      </div>

      {item.quotes.length === 0 ? (
        <p className="hint">Agrega cotizaciones para comparar.</p>
      ) : (
        <div className="quote-compare-table-wrap">
          <table className="quote-compare-table">
            <thead>
              <tr>
                <th>Tienda</th>
                <th>Precio</th>
                <th>Referencia</th>
                <th>Aprobación</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {item.quotes.map((quote, index) => {
                const approval = quoteApprovalCount(quote, members.length)
                const onSale = isQuoteOnSale(quote)
                return (
                  <tr key={index} className={approval.allApproved ? 'quote-approved' : undefined}>
                    <td>
                      {quote.store}
                      {onSale ? (
                        <span className="chip chip-sale">
                          <AppIcon name="flame" size={13} className="ui-icon ui-icon-inline ui-icon-hot" />
                          Oferta
                        </span>
                      ) : null}
                      {quote.url ? (
                        <a href={quote.url} target="_blank" rel="noreferrer" className="row-meta">
                          Ver link
                        </a>
                      ) : null}
                    </td>
                    <td>
                      <strong>{formatQuotePrice(quote, space)}</strong>
                    </td>
                    <td>
                      {quote.listPrice
                        ? formatQuotePrice({ ...quote, price: quote.listPrice }, space)
                        : '—'}
                    </td>
                    <td>
                      <div className="approval-buttons">
                        {members.map((member) => {
                          const approved = quote.approvedByMemberIds?.includes(member.id)
                          return (
                            <button
                              type="button"
                              key={member.id}
                              className={`chip${approved ? ' active' : ''}`}
                              onClick={() => onToggleApproval(index, member.id)}
                            >
                              {approved ? (
                                <UiCheck size={13} className="ui-icon ui-icon-check ui-icon-inline" />
                              ) : null}
                              {member.name.split(' ')[0]}
                            </button>
                          )
                        })}
                      </div>
                      <span className="row-meta">
                        {approval.approved}/{approval.total} aprueban
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onRemoveQuote(index)}
                      >
                        <AppIcon name="x" size={16} className="ui-icon" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <form className="form-grid extras-form" onSubmit={addQuote}>
        <h3>Nueva cotización</h3>
        <div className="form-row">
          <label className="field">
            Tienda
            <input value={store} onChange={(e) => setStore(e.target.value)} required />
          </label>
          <label className="field">
            Precio
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </label>
          <label className="field">
            Precio normal (opcional)
            <input inputMode="decimal" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Link
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
        {allowMulticurrency ? (
          <label className="field">
            Moneda
            <select value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)}>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit" className="btn btn-secondary btn-sm">
          Guardar cotización
        </button>
      </form>

      {hasRegisterExpense && item.quotes.length > 0 ? (
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onRegisterExpense}>
            <AppIcon name="sparkles" size={16} className="ui-icon ui-icon-inline" />
            Comprado — pasar a gasto
          </button>
        </div>
      ) : null}
    </Modal>
  )
}
