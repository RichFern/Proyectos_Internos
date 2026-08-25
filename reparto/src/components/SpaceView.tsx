import { useMemo, useState } from 'react'
import type { Expense, Member, Space } from '../types'
import { CATEGORY_LABELS, KIND_LABELS } from '../types'
import {
  categoryTotals,
  computeBalances,
  suggestSettlements,
  totalSpent,
} from '../lib/balances'
import { formatDate, formatMoney, formatPercent } from '../lib/format'
import { MemberFormModal } from './MemberFormModal'
import { ExpenseFormModal } from './ExpenseFormModal'

type Tab = 'resumen' | 'gastos' | 'personas' | 'saldos'

interface Props {
  space: Space
  onDeleteSpace: () => void
  onAddMember: (input: Pick<Member, 'name' | 'income'>) => void
  onUpdateMember: (id: string, input: Pick<Member, 'name' | 'income'>) => void
  onRemoveMember: (id: string) => void
  onAddExpense: (input: Omit<Expense, 'id' | 'createdAt'>) => void
  onUpdateExpense: (id: string, input: Omit<Expense, 'id' | 'createdAt'>) => void
  onRemoveExpense: (id: string) => void
}

export function SpaceView({
  space,
  onDeleteSpace,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
}: Props) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [memberModal, setMemberModal] = useState<Member | null | 'new'>(null)
  const [expenseModal, setExpenseModal] = useState<Expense | null | 'new'>(null)

  const balances = useMemo(() => computeBalances(space), [space])
  const settlements = useMemo(() => suggestSettlements(balances), [balances])
  const cats = useMemo(() => categoryTotals(space), [space])
  const spent = totalSpent(space)
  const maxCat = cats[0]?.amount || 1

  const memberName = (id: string) =>
    space.members.find((m) => m.id === id)?.name ?? '—'

  return (
    <div className="panel main-panel">
      <header className="hero-space">
        <div className="section-head" style={{ marginBottom: '0.35rem' }}>
          <div>
            <h1>{space.name}</h1>
            <p>{space.description || 'Cuenta compartida'}</p>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (confirm(`¿Eliminar el espacio “${space.name}”?`)) onDeleteSpace()
            }}
          >
            Eliminar
          </button>
        </div>
        <div className="hero-meta">
          <span className="chip">{KIND_LABELS[space.kind]}</span>
          <span className="chip">{space.members.length} personas</span>
          <span className="chip">{space.expenses.length} gastos</span>
          <span className="chip">{formatMoney(spent)} gastados</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Secciones">
        {(
          [
            ['resumen', 'Resumen'],
            ['gastos', 'Gastos'],
            ['personas', 'Personas'],
            ['saldos', 'Saldos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="tab-body">
        {tab === 'resumen' ? (
          <>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Total gastado</div>
                <div className="stat-value">{formatMoney(spent)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Personas</div>
                <div className="stat-value">{space.members.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Movimientos</div>
                <div className="stat-value">{space.expenses.length}</div>
              </div>
            </div>

            <div className="section-head">
              <h2>¿Dónde se fue la plata?</h2>
            </div>
            {cats.length === 0 ? (
              <div className="empty">
                <h3>Todavía no hay gastos</h3>
                <p>Registra el primer gasto para ver el desglose.</p>
              </div>
            ) : (
              <div className="category-bars">
                {cats.map((c) => (
                  <div className="cat-row" key={c.category}>
                    <span>{CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] ?? c.category}</span>
                    <div className="cat-bar">
                      <span style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                    </div>
                    <strong>{formatMoney(c.amount)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="section-head" style={{ marginTop: '1.5rem' }}>
              <h2>Últimos gastos</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setExpenseModal('new')}
                disabled={space.members.length === 0}
              >
                + Gasto
              </button>
            </div>
            <ExpenseList
              space={space}
              memberName={memberName}
              onEdit={setExpenseModal}
              onRemove={onRemoveExpense}
              limit={5}
            />
          </>
        ) : null}

        {tab === 'gastos' ? (
          <>
            <div className="section-head">
              <h2>Todos los gastos</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setExpenseModal('new')}
                disabled={space.members.length === 0}
              >
                + Registrar gasto
              </button>
            </div>
            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Primero agregá personas</h3>
                <p>Sin integrantes no se puede registrar quién pagó.</p>
              </div>
            ) : (
              <ExpenseList
                space={space}
                memberName={memberName}
                onEdit={setExpenseModal}
                onRemove={onRemoveExpense}
              />
            )}
          </>
        ) : null}

        {tab === 'personas' ? (
          <>
            <div className="section-head">
              <h2>Quiénes aportan</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setMemberModal('new')}
              >
                + Persona
              </button>
            </div>
            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Sin personas todavía</h3>
                <p>Agregá a cada integrante con su ingreso para repartir en proporción.</p>
              </div>
            ) : (
              <div className="list">
                {balances.map((b) => (
                  <div className="row" key={b.memberId}>
                    <div className="avatar" style={{ background: b.color }}>
                      {b.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="row-title">{b.name}</div>
                      <div className="row-meta">
                        Ingreso {formatMoney(b.income)} · aporta {formatPercent(b.incomeShare)}
                      </div>
                      <div className="income-share">
                        <div className="mini-bar">
                          <span style={{ width: `${b.incomeShare * 100}%` }} />
                        </div>
                      </div>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const m = space.members.find((x) => x.id === b.memberId)
                            if (m) setMemberModal(m)
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (confirm(`¿Quitar a ${b.name}? También se borran sus pagos.`)) {
                              onRemoveMember(b.memberId)
                            }
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="row-amount">{formatMoney(b.income)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        {tab === 'saldos' ? (
          <>
            <div className="section-head">
              <h2>Cuánto pagó y cuánto le toca</h2>
            </div>
            {space.members.length === 0 || space.expenses.length === 0 ? (
              <div className="empty">
                <h3>Aún no hay saldos</h3>
                <p>Cuando haya personas y gastos, acá verás quién debe a quién.</p>
              </div>
            ) : (
              <>
                <div className="balance-grid">
                  {balances.map((b) => (
                    <div className="balance-card" key={b.memberId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="avatar" style={{ background: b.color }}>
                          {b.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="row-title">{b.name}</div>
                          <div className="row-meta">Cuota {formatPercent(b.incomeShare)}</div>
                        </div>
                      </div>
                      <div className="bar">
                        <span style={{ width: `${Math.min(100, b.incomeShare * 100)}%` }} />
                      </div>
                      <div className="row-meta">Pagó {formatMoney(b.paid, true)}</div>
                      <div className="row-meta">Le corresponde {formatMoney(b.owes, true)}</div>
                      <div
                        className={`row-amount ${b.net >= 0 ? 'amount-pos' : 'amount-neg'}`}
                        style={{ marginTop: '0.55rem', textAlign: 'left' }}
                      >
                        {b.net >= 0
                          ? `Le deben ${formatMoney(b.net, true)}`
                          : `Debe ${formatMoney(-b.net, true)}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-head">
                  <h2>Cómo saldar</h2>
                </div>
                {settlements.length === 0 ? (
                  <div className="empty">
                    <h3>Están a mano</h3>
                    <p>No hay deudas pendientes entre ustedes.</p>
                  </div>
                ) : (
                  <div className="list">
                    {settlements.map((s) => (
                      <div className="settlement" key={`${s.fromId}-${s.toId}`}>
                        <div>
                          <strong>{s.fromName}</strong> le transfiere a{' '}
                          <strong>{s.toName}</strong>
                        </div>
                        <div className="row-amount">{formatMoney(s.amount, true)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </div>

      {memberModal !== null ? (
        <MemberFormModal
          initial={memberModal === 'new' ? null : memberModal}
          onClose={() => setMemberModal(null)}
          onSave={(input) => {
            if (memberModal === 'new') onAddMember(input)
            else onUpdateMember(memberModal.id, input)
          }}
        />
      ) : null}

      {expenseModal !== null && space.members.length > 0 ? (
        <ExpenseFormModal
          members={space.members}
          initial={expenseModal === 'new' ? null : expenseModal}
          onClose={() => setExpenseModal(null)}
          onSave={(input) => {
            if (expenseModal === 'new') onAddExpense(input)
            else onUpdateExpense(expenseModal.id, input)
          }}
        />
      ) : null}
    </div>
  )
}

function ExpenseList({
  space,
  memberName,
  onEdit,
  onRemove,
  limit,
}: {
  space: Space
  memberName: (id: string) => string
  onEdit: (e: Expense) => void
  onRemove: (id: string) => void
  limit?: number
}) {
  const items = [...space.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit ?? space.expenses.length)

  if (!items.length) {
    return (
      <div className="empty">
        <h3>Sin gastos cargados</h3>
        <p>Cada gasto guarda quién pagó, la descripción y cómo se reparte.</p>
      </div>
    )
  }

  return (
    <div className="list">
      {items.map((e) => {
        const payer = space.members.find((m) => m.id === e.paidById)
        return (
          <div className="row" key={e.id}>
            <div
              className="avatar"
              style={{ background: payer?.color ?? '#6b7a73' }}
              title={memberName(e.paidById)}
            >
              {(payer?.name ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="row-title">{e.description}</div>
              <div className="row-meta">
                {CATEGORY_LABELS[e.category]} · {formatDate(e.date)} · pagó{' '}
                {memberName(e.paidById)} ·{' '}
                {e.splitMode === 'income' ? 'proporcional' : 'igual'}
                {e.participantIds.length
                  ? ` · ${e.participantIds.length} personas`
                  : ' · todos'}
              </div>
              {e.notes ? <div className="row-meta">{e.notes}</div> : null}
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onEdit(e)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm('¿Borrar este gasto?')) onRemove(e.id)
                  }}
                >
                  Borrar
                </button>
              </div>
            </div>
            <div className="row-amount">{formatMoney(e.amount)}</div>
          </div>
        )
      })}
    </div>
  )
}
