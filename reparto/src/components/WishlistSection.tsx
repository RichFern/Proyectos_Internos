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
import { spaceIcon } from '../lib/spacePresets'
import { Modal } from './Modal'

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
  onRegisterExpense,
  defaultPaidById,
}: Props) {
  const plan = limitsFor(planTier)
  const space = spaces.find((item) => item.id === activeSpaceId) ?? spaces[0] ?? null

  if (!space) {
    return (
      <section className="panel app-section">
        <h1>Planificador de Compras</h1>
        <p className="brand-sub">Crea un espacio para planificar compras y comparar precios.</p>
      </section>
    )
  }

  return (
    <section className="panel app-section wishlist-section">
      <header className="app-section-head">
        <div>
          <h1>Planificador de Compras</h1>
          <p className="brand-sub">
            Tablero de decisiones: ideas, evaluación y compra. Compara y pasa a gasto.
          </p>
        </div>
        <div className="row-actions">
          {onOpenPlans ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPlans}>
              Tu plan
            </button>
          ) : null}
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
        </div>
      </header>

      <PremiumUpsell feature="wishlist" planTier={planTier} onOpenPlans={onOpenPlans} />

      {plan.features.wishlist ? (
        <WishlistKanban
          space={space}
          members={space.members}
          allowMulticurrency={plan.features.multipleCurrencies}
          onAddItem={(input) => onAddItem(space.id, input)}
          onUpdateItem={(itemId, patch) => onUpdateItem(space.id, itemId, patch)}
          onRemoveItem={(itemId) => onRemoveItem(space.id, itemId)}
          onAddQuote={(itemId, quote) => onAddQuote(space.id, itemId, quote)}
          onRemoveQuote={(itemId, index) => onRemoveQuote(space.id, itemId, index)}
          onRegisterExpense={
            onRegisterExpense
              ? (draft) => onRegisterExpense(space.id, draft)
              : undefined
          }
          defaultPaidById={defaultPaidById}
        />
      ) : null}
    </section>
  )
}

function WishlistKanban({
  space,
  members,
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
  onRegisterExpense?: (draft: ExpenseDraft) => void
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
    onUpdateItem(item.id, { status: 'bought' })
    onRegisterExpense({
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
      <form className="wishlist-link-form" onSubmit={createFromLink}>
        <label className="field wishlist-link-field">
          Pega el link o escribe qué quieres comprar
          <input
            value={linkUrl || newTitle}
            onChange={(e) => {
              setLinkUrl(e.target.value)
              if (!newTitle) setNewTitle(e.target.value)
              else setNewTitle(e.target.value)
            }}
            placeholder="https://… o “Lavadora 8kg”"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-sm">
          Agregar idea
        </button>
      </form>

      <div className="wishlist-kanban">
        {COLUMNS.map((column) => (
          <div className="kanban-col" key={column}>
            <h3>{KANBAN_LABELS[column]}</h3>
            <span className="kanban-count">{columns[column].length}</span>
            <div className="kanban-cards">
              {columns[column].map((item) => {
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
                      <span className="row-meta">
                        {winner.store} · {formatQuotePrice(winner, space)}
                      </span>
                    ) : (
                      <span className="row-meta">Sin cotizaciones</span>
                    )}
                  </button>
                )
              })}
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
                      {onSale ? <span className="chip chip-sale">🔥 Oferta</span> : null}
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
                              {approved ? '✓ ' : ''}
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
                        ×
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
            ✨ Comprado — pasar a gasto
          </button>
        </div>
      ) : null}
    </Modal>
  )
}
