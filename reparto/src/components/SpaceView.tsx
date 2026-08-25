import { useEffect, useMemo, useState } from 'react'
import type { Expense, ExpenseDraft, ExpenseTemplate, Member, Space } from '../types'
import { CATEGORY_LABELS, KIND_LABELS } from '../types'
import {
  categoryTotals,
  computeBalances,
  suggestSettlements,
  totalSpent,
} from '../lib/balances'
import {
  formatDate,
  formatMoney,
  formatMonth,
  formatPercent,
  monthStartISO,
  todayISO,
} from '../lib/format'
import {
  availableMonths,
  defaultMonthFilter,
  filterExpenses,
  spaceForMonth,
  type MonthFilter,
} from '../lib/months'
import { MemberFormModal } from './MemberFormModal'
import { ExpenseFormModal } from './ExpenseFormModal'
import { MonthNav } from './MonthNav'

type Tab = 'resumen' | 'gastos' | 'personas' | 'saldos'

type ExpenseModalState =
  | null
  | { mode: 'create' }
  | { mode: 'edit'; expense: Expense }
  | { mode: 'repeat'; expense: Expense }
  | { mode: 'template'; template: ExpenseTemplate }

interface Props {
  space: Space
  onDeleteSpace: () => void
  onAddMember: (input: Pick<Member, 'name' | 'income'>) => void
  onUpdateMember: (id: string, input: Pick<Member, 'name' | 'income'>) => void
  onRemoveMember: (id: string) => void
  onAddExpense: (input: ExpenseDraft) => void
  onUpdateExpense: (id: string, input: ExpenseDraft) => void
  onRemoveExpense: (id: string) => void
  onAddTemplate: (
    input: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ) => string
  onRemoveTemplate: (id: string) => void
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
  onAddTemplate,
  onRemoveTemplate,
}: Props) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [memberModal, setMemberModal] = useState<Member | null | 'new'>(null)
  const [expenseModal, setExpenseModal] = useState<ExpenseModalState>(null)
  const [month, setMonth] = useState<MonthFilter>(() => defaultMonthFilter(space))
  const [query, setQuery] = useState('')

  useEffect(() => {
    setMonth(defaultMonthFilter(space))
    setQuery('')
  }, [space.id])

  const months = useMemo(() => availableMonths(space.expenses), [space.expenses])
  const memberName = (id: string) =>
    space.members.find((m) => m.id === id)?.name ?? '—'

  const filteredExpenses = useMemo(
    () => filterExpenses(space.expenses, month, query, memberName),
    [space.expenses, month, query, space.members],
  )

  const scopedSpace = useMemo(() => {
    const base = spaceForMonth(space, month)
    if (!query.trim()) return base
    return { ...base, expenses: filteredExpenses }
  }, [space, month, query, filteredExpenses])

  const balances = useMemo(() => computeBalances(scopedSpace), [scopedSpace])
  const settlements = useMemo(() => suggestSettlements(balances), [balances])
  const cats = useMemo(() => categoryTotals(scopedSpace), [scopedSpace])
  const spent = totalSpent(scopedSpace)
  const maxCat = cats[0]?.amount || 1
  const monthLabel = month === 'all' ? 'todos los meses' : formatMonth(month)
  const defaultDate =
    month === 'all' ? todayISO() : monthStartISO(month)

  const openCreate = () => setExpenseModal({ mode: 'create' })

  const handleSaveExpense = (
    input: ExpenseDraft,
    options: { saveAsTemplate: boolean },
  ) => {
    let templateId = input.templateId
    if (options.saveAsTemplate) {
      templateId = onAddTemplate({
        description: input.description,
        amount: input.amount,
        category: input.category,
        paidById: input.paidById,
        splitMode: input.splitMode,
        participantIds: input.participantIds,
        notes: input.notes,
      })
    }
    const payload = { ...input, templateId }
    if (expenseModal?.mode === 'edit') {
      onUpdateExpense(expenseModal.expense.id, payload)
    } else {
      onAddExpense(payload)
    }
  }

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
          <span className="chip">{scopedSpace.expenses.length} gastos</span>
          <span className="chip">{formatMoney(spent)} · {monthLabel}</span>
        </div>
      </header>

      <div className="toolbar">
        <MonthNav month={month} months={months} onChange={setMonth} />
        <label className="search-field">
          <span className="sr-only">Buscar gasto</span>
          <input
            type="search"
            placeholder="Buscar gasto, nota o quién pagó…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

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
                <div className="stat-label">Total del período</div>
                <div className="stat-value">{formatMoney(spent)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Personas</div>
                <div className="stat-value">{space.members.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Movimientos</div>
                <div className="stat-value">{scopedSpace.expenses.length}</div>
              </div>
            </div>

            {space.templates.length > 0 ? (
              <>
                <div className="section-head">
                  <h2>Repetir este mes</h2>
                </div>
                <div className="template-chips">
                  {space.templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="template-chip"
                      onClick={() => setExpenseModal({ mode: 'template', template: t })}
                      disabled={space.members.length === 0}
                    >
                      <span>{t.description}</span>
                      <strong>{formatMoney(t.amount)}</strong>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="section-head">
              <h2>¿Dónde se fue la plata?</h2>
            </div>
            {cats.length === 0 ? (
              <div className="empty">
                <h3>Sin gastos en {monthLabel}</h3>
                <p>Cambiá de mes o registrá un gasto nuevo.</p>
              </div>
            ) : (
              <div className="category-bars">
                {cats.map((c) => (
                  <div className="cat-row" key={c.category}>
                    <span>
                      {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] ??
                        c.category}
                    </span>
                    <div className="cat-bar">
                      <span style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                    </div>
                    <strong>{formatMoney(c.amount)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="section-head" style={{ marginTop: '1.5rem' }}>
              <h2>Gastos del período</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openCreate}
                disabled={space.members.length === 0}
              >
                + Gasto
              </button>
            </div>
            <ExpenseList
              expenses={filteredExpenses.slice(0, 6)}
              members={space.members}
              memberName={memberName}
              onEdit={(e) => setExpenseModal({ mode: 'edit', expense: e })}
              onRepeat={(e) => setExpenseModal({ mode: 'repeat', expense: e })}
              onRemove={onRemoveExpense}
              emptyTitle={`Sin gastos en ${monthLabel}`}
            />
          </>
        ) : null}

        {tab === 'gastos' ? (
          <>
            <div className="section-head">
              <h2>Gastos · {monthLabel}</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openCreate}
                disabled={space.members.length === 0}
              >
                + Registrar gasto
              </button>
            </div>

            {space.templates.length > 0 ? (
              <div className="templates-panel">
                <div className="section-head">
                  <h3>Plantillas</h3>
                  <span className="hint">Cosas que se repiten (alquiler, luz…)</span>
                </div>
                <div className="list">
                  {space.templates.map((t) => (
                    <div className="row template-row" key={t.id}>
                      <div className="avatar" style={{ background: '#1f5c4a' }}>
                        ↻
                      </div>
                      <div>
                        <div className="row-title">{t.description}</div>
                        <div className="row-meta">
                          {CATEGORY_LABELS[t.category]} · sugerido {formatMoney(t.amount)} ·
                          pagó {memberName(t.paidById)}
                        </div>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              setExpenseModal({ mode: 'template', template: t })
                            }
                          >
                            Usar este mes
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm(`¿Quitar la plantilla “${t.description}”?`)) {
                                onRemoveTemplate(t.id)
                              }
                            }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                      <div className="row-amount">{formatMoney(t.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="hint" style={{ marginBottom: '1rem' }}>
                Tip: al guardar un gasto marcá “Guardar como plantilla” para repetirlo el
                mes que viene.
              </p>
            )}

            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Primero agregá personas</h3>
                <p>Sin integrantes no se puede registrar quién pagó.</p>
              </div>
            ) : (
              <ExpenseList
                expenses={filteredExpenses}
                members={space.members}
                memberName={memberName}
                onEdit={(e) => setExpenseModal({ mode: 'edit', expense: e })}
                onRepeat={(e) => setExpenseModal({ mode: 'repeat', expense: e })}
                onRemove={onRemoveExpense}
                emptyTitle={
                  query
                    ? `No hay resultados para “${query}”`
                    : `Sin gastos en ${monthLabel}`
                }
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
                        Ingreso {formatMoney(b.income)} · aporta{' '}
                        {formatPercent(b.incomeShare)}
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
                            if (
                              confirm(
                                `¿Quitar a ${b.name}? También se borran sus pagos.`,
                              )
                            ) {
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
              <h2>Saldos · {monthLabel}</h2>
            </div>
            {space.members.length === 0 || scopedSpace.expenses.length === 0 ? (
              <div className="empty">
                <h3>Aún no hay saldos</h3>
                <p>Cuando haya gastos en este período, acá verás quién debe a quién.</p>
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
                      <div className="row-meta">
                        Le corresponde {formatMoney(b.owes, true)}
                      </div>
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
                    <p>No hay deudas pendientes en este período.</p>
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
          mode={expenseModal.mode}
          defaultDate={defaultDate}
          initial={
            expenseModal.mode === 'create'
              ? {
                  description: '',
                  amount: 0,
                  category: 'comida',
                  paidById: space.members[0].id,
                  date: defaultDate,
                  splitMode: 'income',
                  participantIds: [],
                }
              : expenseModal.mode === 'edit' || expenseModal.mode === 'repeat'
                ? expenseModal.expense
                : {
                    description: expenseModal.template.description,
                    amount: expenseModal.template.amount,
                    category: expenseModal.template.category,
                    paidById: expenseModal.template.paidById,
                    date: defaultDate,
                    splitMode: expenseModal.template.splitMode,
                    participantIds: expenseModal.template.participantIds,
                    notes: expenseModal.template.notes,
                    templateId: expenseModal.template.id,
                  }
          }
          onClose={() => setExpenseModal(null)}
          onSave={handleSaveExpense}
        />
      ) : null}
    </div>
  )
}

function ExpenseList({
  expenses,
  members,
  memberName,
  onEdit,
  onRepeat,
  onRemove,
  emptyTitle,
}: {
  expenses: Expense[]
  members: Member[]
  memberName: (id: string) => string
  onEdit: (e: Expense) => void
  onRepeat: (e: Expense) => void
  onRemove: (id: string) => void
  emptyTitle: string
}) {
  if (!expenses.length) {
    return (
      <div className="empty">
        <h3>{emptyTitle}</h3>
        <p>Cada gasto guarda quién pagó, la descripción y cómo se reparte.</p>
      </div>
    )
  }

  return (
    <div className="list">
      {expenses.map((e) => {
        const payer = members.find((m) => m.id === e.paidById)
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
                  onClick={() => onRepeat(e)}
                >
                  Repetir
                </button>
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
