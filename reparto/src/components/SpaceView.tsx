import { useEffect, useMemo, useState } from 'react'
import type {
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseTemplate,
  InstallmentPlan,
  Member,
  SettlementRecord,
  Space,
} from '../types'
import { CATEGORY_LABELS, KIND_LABELS } from '../types'
import {
  categoryTotals,
  computeBalances,
  personStats,
  totalSpent,
} from '../lib/balances'
import {
  applySettlementRecords,
  filterSettlementRecords,
  pendingSettlements,
  settlementRecordFromSuggestion,
} from '../lib/settlements'
import { categoryBudgetStatus } from '../lib/budgets'
import { exportMonthCsv, exportMonthPdf } from '../lib/export'
import {
  dueAlerts,
  isPersonalExpense,
  planProgress,
} from '../lib/installments'
import { incomeForMonth } from '../lib/members'
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
import { ExpenseFormModal, type ExpenseSaveOptions } from './ExpenseFormModal'
import { MonthNav } from './MonthNav'

type Tab = 'resumen' | 'gastos' | 'personas' | 'persona' | 'saldos'

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
  onUpdateMember: (
    id: string,
    input: {
      name: string
      income: number
      monthIncome?: { month: string; amount: number } | null
    },
  ) => void
  onRemoveMember: (id: string) => void
  onAddExpense: (input: ExpenseDraft) => void
  onUpdateExpense: (id: string, input: ExpenseDraft) => void
  onRemoveExpense: (id: string) => void
  onAddTemplate: (
    input: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ) => string
  onRemoveTemplate: (id: string) => void
  onAddInstallmentPlan: (input: {
    description: string
    category: InstallmentPlan['category']
    totalAmount: number
    installmentCount: number
    paidById: string
    splitMode: InstallmentPlan['splitMode']
    participantIds: string[]
    startDate: string
    notes?: string
  }) => string
  onRecordSettlement: (
    input: Omit<SettlementRecord, 'id' | 'createdAt'>,
  ) => void
  onRemoveSettlement: (recordId: string) => void
  onSetCategoryBudget: (
    month: string,
    category: ExpenseCategory,
    limit: number | null,
  ) => void
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
  onAddInstallmentPlan,
  onRecordSettlement,
  onRemoveSettlement,
  onSetCategoryBudget,
}: Props) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [memberModal, setMemberModal] = useState<Member | null | 'new'>(null)
  const [expenseModal, setExpenseModal] = useState<ExpenseModalState>(null)
  const [month, setMonth] = useState<MonthFilter>(() => defaultMonthFilter(space))
  const [query, setQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    () => space.members[0]?.id ?? null,
  )

  useEffect(() => {
    setMonth(defaultMonthFilter(space))
    setQuery('')
    setSelectedPersonId(space.members[0]?.id ?? null)
  }, [space.id])

  useEffect(() => {
    if (
      selectedPersonId &&
      !space.members.some((m) => m.id === selectedPersonId)
    ) {
      setSelectedPersonId(space.members[0]?.id ?? null)
    } else if (!selectedPersonId && space.members[0]) {
      setSelectedPersonId(space.members[0].id)
    }
  }, [space.members, selectedPersonId])

  const months = useMemo(() => availableMonths(space.expenses), [space.expenses])
  const memberName = (id: string) =>
    space.members.find((m) => m.id === id)?.name ?? '—'
  const balanceMonth = month !== 'all' ? month : null

  const filteredExpenses = useMemo(
    () => filterExpenses(space.expenses, month, query, memberName),
    [space.expenses, month, query, space.members],
  )

  const scopedSpace = useMemo(() => {
    const base = spaceForMonth(space, month)
    if (!query.trim()) return base
    return { ...base, expenses: filteredExpenses }
  }, [space, month, query, filteredExpenses])

  const settlementRecords = useMemo(
    () => filterSettlementRecords(space.settlementRecords ?? [], balanceMonth),
    [space.settlementRecords, balanceMonth],
  )

  const balances = useMemo(() => {
    const base = computeBalances(scopedSpace, balanceMonth)
    return applySettlementRecords(base, settlementRecords)
  }, [scopedSpace, balanceMonth, settlementRecords])

  const settlements = useMemo(() => pendingSettlements(balances), [balances])
  const cats = useMemo(() => categoryTotals(scopedSpace), [scopedSpace])
  const budgetStatus = useMemo(
    () => categoryBudgetStatus(scopedSpace, balanceMonth),
    [scopedSpace, balanceMonth],
  )
  const spent = totalSpent(scopedSpace)
  const maxCat = cats[0]?.amount || 1
  const monthLabel = month === 'all' ? 'todos los meses' : formatMonth(month)
  const defaultDate = month === 'all' ? todayISO() : monthStartISO(month)

  const alerts = useMemo(() => {
    return dueAlerts(space.expenses).filter(
      (a) => a.status === 'overdue' || a.status === 'due_soon',
    )
  }, [space.expenses])

  const person = useMemo(() => {
    if (!selectedPersonId) return null
    return personStats(scopedSpace, selectedPersonId, balanceMonth)
  }, [scopedSpace, selectedPersonId, balanceMonth])

  const plans = space.installmentPlans ?? []

  const openCreate = () => setExpenseModal({ mode: 'create' })

  const markSettled = (s: (typeof settlements)[0]) => {
    onRecordSettlement(
      settlementRecordFromSuggestion(s, balanceMonth, todayISO()),
    )
  }

  const handleSaveExpense = (input: ExpenseDraft, options: ExpenseSaveOptions) => {
    if (options.installment) {
      onAddInstallmentPlan({
        description: input.description,
        category: input.category,
        totalAmount: options.installment.totalAmount,
        installmentCount: options.installment.installmentCount,
        paidById: input.paidById,
        splitMode: input.splitMode,
        participantIds: input.participantIds,
        startDate: options.installment.startDate,
        notes: input.notes,
      })
      return
    }

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
          {space.visibility === 'personal' ? (
            <span className="chip chip-private">🔒 Personal</span>
          ) : null}
          <span className="chip">{space.members.length} personas</span>
          <span className="chip">{scopedSpace.expenses.length} gastos</span>
          <span className="chip">
            {formatMoney(spent)} · {monthLabel}
          </span>
        </div>
      </header>

      <div className="toolbar">
        <MonthNav month={month} months={months} onChange={setMonth} />
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportMonthCsv(space, month, memberName)}
            disabled={scopedSpace.expenses.length === 0}
          >
            CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportMonthPdf(space, month, memberName)}
            disabled={scopedSpace.expenses.length === 0}
          >
            PDF
          </button>
        </div>
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
            ['persona', 'Por persona'],
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

            {alerts.length > 0 ? (
              <>
                <div className="section-head">
                  <h2>Alertas</h2>
                </div>
                <div className="list">
                  {alerts.map((a) => (
                    <div className="row" key={a.expense.id}>
                      <div
                        className="avatar"
                        style={{
                          background:
                            a.status === 'overdue' ? '#9b2c2c' : '#c45c26',
                        }}
                      >
                        !
                      </div>
                      <div>
                        <div className="row-title">{a.expense.description}</div>
                        <div className="row-meta">
                          {a.status === 'overdue'
                            ? a.daysUntil === -1
                              ? 'Vencido ayer'
                              : `Vencido hace ${Math.abs(a.daysUntil)} días`
                            : a.daysUntil === 0
                              ? 'Vence hoy'
                              : a.daysUntil === 1
                                ? 'Vence mañana'
                                : `Vence en ${a.daysUntil} días`}
                          {a.expense.dueDate
                            ? ` · ${formatDate(a.expense.dueDate)}`
                            : null}
                          {' · '}
                          {formatMoney(a.expense.amount)}
                        </div>
                      </div>
                      <span className="chip">
                        {a.status === 'overdue' ? 'Vencido' : 'Pronto'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <div className="section-head" style={{ marginTop: '1.25rem' }}>
              <h2>Cómo saldar este mes</h2>
            </div>
            {space.members.length === 0 || scopedSpace.expenses.length === 0 ? (
              <div className="empty">
                <h3>Sin saldos todavía</h3>
                <p>Cuando haya gastos en {monthLabel}, acá verás cómo equilibrar.</p>
              </div>
            ) : settlements.length === 0 ? (
              <div className="empty">
                <h3>Están a mano</h3>
                <p>No hay transferencias pendientes en este período.</p>
              </div>
            ) : (
              <div className="list">
                {settlements.map((s) => (
                  <div className="settlement" key={`${s.fromId}-${s.toId}`}>
                    <div>
                      <strong>{s.fromName}</strong> le transfiere a{' '}
                      <strong>{s.toName}</strong>
                    </div>
                    <div className="settlement-actions">
                      <div className="row-amount">{formatMoney(s.amount, true)}</div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => markSettled(s)}
                      >
                        Marcar saldado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {settlementRecords.length > 0 ? (
              <>
                <div className="section-head" style={{ marginTop: '1.25rem' }}>
                  <h2>Ya saldado</h2>
                </div>
                <div className="list">
                  {settlementRecords.map((r) => (
                    <div className="row settled-row" key={r.id}>
                      <div className="avatar" style={{ background: '#2f6f5e' }}>
                        ✓
                      </div>
                      <div>
                        <div className="row-title">
                          {memberName(r.fromId)} → {memberName(r.toId)}
                        </div>
                        <div className="row-meta">
                          {formatMoney(r.amount, true)} · {formatDate(r.date)}
                          {r.periodMonth ? ` · ${formatMonth(r.periodMonth)}` : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm('¿Quitar este registro de saldo?')) {
                            onRemoveSettlement(r.id)
                          }
                        }}
                      >
                        Deshacer
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

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
                      onClick={() =>
                        setExpenseModal({ mode: 'template', template: t })
                      }
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
                {cats.map((c) => {
                  const budget = budgetStatus.find((b) => b.category === c.category)
                  return (
                    <div
                      className={`cat-row${budget?.over ? ' cat-over' : ''}`}
                      key={c.category}
                    >
                      <span>
                        {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] ??
                          c.category}
                        {budget?.limit ? (
                          <span className="cat-limit">
                            {' '}
                            / {formatMoney(budget.limit)}
                          </span>
                        ) : null}
                      </span>
                      <div className="cat-bar">
                        <span
                          style={{
                            width: `${Math.min(
                              100,
                              budget?.limit
                                ? (c.amount / budget.limit) * 100
                                : (c.amount / maxCat) * 100,
                            )}%`,
                          }}
                          className={budget?.over ? 'over' : undefined}
                        />
                      </div>
                      <strong>{formatMoney(c.amount)}</strong>
                    </div>
                  )
                })}
              </div>
            )}

            {month !== 'all' ? (
              <>
                <div className="section-head" style={{ marginTop: '1.25rem' }}>
                  <h2>Presupuesto · {formatMonth(month)}</h2>
                </div>
                <p className="hint" style={{ marginBottom: '0.75rem' }}>
                  Tope por categoría para este mes. Si te pasás, se marca en rojo.
                </p>
                <div className="budget-grid">
                  {budgetStatus.map((b) => (
                    <label className="budget-field" key={b.category}>
                      <span>{b.label}</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="Sin tope"
                        value={b.limit ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          onSetCategoryBudget(
                            month,
                            b.category,
                            raw === '' ? null : Number(raw),
                          )
                        }}
                      />
                      <span className={`budget-spent${b.over ? ' over' : ''}`}>
                        Gastado {formatMoney(b.spent)}
                        {b.limit ? ` · ${Math.round((b.percent ?? 0) * 100)}%` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="hint" style={{ marginTop: '1rem' }}>
                Elegí un mes concreto para fijar presupuestos por categoría.
              </p>
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
                          {CATEGORY_LABELS[t.category]} · sugerido{' '}
                          {formatMoney(t.amount)} · pagó {memberName(t.paidById)}
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
                              if (
                                confirm(`¿Quitar la plantilla “${t.description}”?`)
                              ) {
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
                Tip: al guardar un gasto marcá “Guardar como plantilla” para
                repetirlo el mes que viene.
              </p>
            )}

            {plans.length > 0 ? (
              <>
                <div className="section-head">
                  <h2>Compras en cuotas</h2>
                </div>
                <div className="list">
                  {plans.map((plan) => {
                    const progress = planProgress(plan, space.expenses)
                    return (
                      <div className="row" key={plan.id}>
                        <div
                          className="avatar"
                          style={{ background: '#3d5a80' }}
                        >
                          #
                        </div>
                        <div>
                          <div className="row-title">{plan.description}</div>
                          <div className="row-meta">
                            {CATEGORY_LABELS[plan.category]} · total{' '}
                            {formatMoney(plan.totalAmount)} ·{' '}
                            {plan.installmentCount} cuotas · pagó{' '}
                            {memberName(plan.paidById)}
                          </div>
                          <div className="row-meta">
                            Avance {progress.paidCount}/{plan.installmentCount} ·
                            pagado {formatMoney(progress.paidAmount)}
                            {progress.nextDue
                              ? ` · próxima ${formatDate(progress.nextDue)}`
                              : ' · completado'}
                          </div>
                        </div>
                        <div className="row-amount">
                          {formatMoney(
                            plan.totalAmount / Math.max(1, plan.installmentCount),
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : null}

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
            {month === 'all' ? (
              <p className="hint" style={{ marginBottom: '1rem' }}>
                Elegí un mes concreto para ver o cargar un ingreso distinto solo
                ese mes.
              </p>
            ) : (
              <p className="hint" style={{ marginBottom: '1rem' }}>
                Ingresos mostrados para {formatMonth(month)}.
              </p>
            )}
            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Sin personas todavía</h3>
                <p>
                  Agregá a cada integrante con su ingreso para repartir en
                  proporción.
                </p>
              </div>
            ) : (
              <div className="list">
                {space.members.map((m) => {
                  const monthIncome = incomeForMonth(m, balanceMonth)
                  const hasOverride = Boolean(
                    balanceMonth && m.incomeByMonth?.[balanceMonth] != null,
                  )
                  const shareMember = balances.find((b) => b.memberId === m.id)
                  return (
                    <div className="row" key={m.id}>
                      <div className="avatar" style={{ background: m.color }}>
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="row-title">{m.name}</div>
                        <div className="row-meta">
                          {hasOverride
                            ? `Ingreso de este mes ${formatMoney(monthIncome)} (ajuste)`
                            : `Ingreso ${formatMoney(monthIncome)}`}
                          {shareMember
                            ? ` · aporta ${formatPercent(shareMember.incomeShare)}`
                            : null}
                        </div>
                        {hasOverride ? (
                          <div className="row-meta">
                            Base {formatMoney(m.income)} · override en{' '}
                            {formatMonth(balanceMonth!)}
                          </div>
                        ) : null}
                        {shareMember ? (
                          <div className="income-share">
                            <div className="mini-bar">
                              <span
                                style={{
                                  width: `${shareMember.incomeShare * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setMemberModal(m)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (
                                confirm(
                                  `¿Quitar a ${m.name}? También se borran sus pagos.`,
                                )
                              ) {
                                onRemoveMember(m.id)
                              }
                            }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                      <div className="row-amount">{formatMoney(monthIncome)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : null}

        {tab === 'persona' ? (
          <>
            <div className="section-head">
              <h2>Por persona · {monthLabel}</h2>
            </div>
            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Sin personas</h3>
                <p>Agregá integrantes para ver el detalle de cada uno.</p>
              </div>
            ) : (
              <>
                <div className="template-chips" style={{ marginBottom: '1rem' }}>
                  {space.members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`chip${selectedPersonId === m.id ? ' active' : ''}`}
                      style={
                        selectedPersonId === m.id
                          ? {
                              background: m.color,
                              color: '#fff',
                              borderColor: m.color,
                            }
                          : undefined
                      }
                      onClick={() => setSelectedPersonId(m.id)}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                {!person ? (
                  <div className="empty">
                    <h3>Elegí una persona</h3>
                  </div>
                ) : (
                  <>
                    <div className="stats">
                      <div className="stat">
                        <div className="stat-label">Pagó</div>
                        <div className="stat-value">
                          {formatMoney(person.paid)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Le corresponde</div>
                        <div className="stat-value">
                          {formatMoney(person.share)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Neto</div>
                        <div
                          className={`stat-value ${
                            person.net >= 0 ? 'amount-pos' : 'amount-neg'
                          }`}
                        >
                          {person.net >= 0
                            ? `+${formatMoney(person.net)}`
                            : formatMoney(person.net)}
                        </div>
                      </div>
                    </div>

                    <div className="stats" style={{ marginTop: '0.75rem' }}>
                      <div className="stat">
                        <div className="stat-label">Personales pagados</div>
                        <div className="stat-value">
                          {formatMoney(person.personalPaid)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Personales (cuota)</div>
                        <div className="stat-value">
                          {formatMoney(person.personalShare)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Ingreso · aporte</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                          {formatMoney(person.income)} ·{' '}
                          {formatPercent(person.incomeShare)}
                        </div>
                      </div>
                    </div>

                    <div className="section-head" style={{ marginTop: '1.25rem' }}>
                      <h2>Lo que pagó</h2>
                    </div>
                    <ExpenseList
                      expenses={person.paidExpenses}
                      members={space.members}
                      memberName={memberName}
                      onEdit={(e) =>
                        setExpenseModal({ mode: 'edit', expense: e })
                      }
                      onRepeat={(e) =>
                        setExpenseModal({ mode: 'repeat', expense: e })
                      }
                      onRemove={onRemoveExpense}
                      emptyTitle={`${person.name} no pagó gastos en ${monthLabel}`}
                    />

                    <div className="section-head" style={{ marginTop: '1.25rem' }}>
                      <h2>En los que participa</h2>
                    </div>
                    <ExpenseList
                      expenses={person.participatedExpenses}
                      members={space.members}
                      memberName={memberName}
                      onEdit={(e) =>
                        setExpenseModal({ mode: 'edit', expense: e })
                      }
                      onRepeat={(e) =>
                        setExpenseModal({ mode: 'repeat', expense: e })
                      }
                      onRemove={onRemoveExpense}
                      emptyTitle={`Sin participación en ${monthLabel}`}
                    />
                  </>
                )}
              </>
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
                <p>
                  Cuando haya gastos en este período, acá verás quién debe a
                  quién.
                </p>
              </div>
            ) : (
              <>
                <div className="balance-grid">
                  {balances.map((b) => (
                    <div className="balance-card" key={b.memberId}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                        }}
                      >
                        <div className="avatar" style={{ background: b.color }}>
                          {b.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="row-title">{b.name}</div>
                          <div className="row-meta">
                            Cuota {formatPercent(b.incomeShare)}
                          </div>
                        </div>
                      </div>
                      <div className="bar">
                        <span
                          style={{
                            width: `${Math.min(100, b.incomeShare * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="row-meta">
                        Pagó {formatMoney(b.paid, true)}
                      </div>
                      <div className="row-meta">
                        Le corresponde {formatMoney(b.owes, true)}
                      </div>
                      <div
                        className={`row-amount ${
                          b.net >= 0 ? 'amount-pos' : 'amount-neg'
                        }`}
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
                        <div className="settlement-actions">
                          <div className="row-amount">
                            {formatMoney(s.amount, true)}
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => markSettled(s)}
                          >
                            Marcar saldado
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {settlementRecords.length > 0 ? (
                  <>
                    <div className="section-head">
                      <h2>Transferencias registradas</h2>
                    </div>
                    <div className="list">
                      {settlementRecords.map((r) => (
                        <div className="row settled-row" key={r.id}>
                          <div className="avatar" style={{ background: '#2f6f5e' }}>
                            ✓
                          </div>
                          <div>
                            <div className="row-title">
                              {memberName(r.fromId)} → {memberName(r.toId)}
                            </div>
                            <div className="row-meta">
                              {formatMoney(r.amount, true)} · {formatDate(r.date)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => onRemoveSettlement(r.id)}
                          >
                            Deshacer
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>

      {memberModal !== null ? (
        <MemberFormModal
          initial={memberModal === 'new' ? null : memberModal}
          month={balanceMonth}
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
        const personal = isPersonalExpense(e)
        const soloName = personal ? memberName(e.participantIds[0]) : null
        const isInstallment = Boolean(e.installmentPlanId)
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
              <div className="row-title">
                {e.description}{' '}
                {personal ? <span className="chip">solo {soloName}</span> : null}{' '}
                {isInstallment && e.installmentNumber && e.installmentTotal ? (
                  <span className="chip">
                    cuota {e.installmentNumber}/{e.installmentTotal}
                  </span>
                ) : null}
              </div>
              <div className="row-meta">
                {CATEGORY_LABELS[e.category]} · {formatDate(e.date)} · pagó{' '}
                {memberName(e.paidById)} ·{' '}
                {e.splitMode === 'income' ? 'proporcional' : 'igual'}
                {personal
                  ? ` · solo ${soloName}`
                  : e.participantIds.length
                    ? ` · ${e.participantIds.length} personas`
                    : ' · todos'}
                {e.dueDate ? ` · vence ${formatDate(e.dueDate)}` : null}
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
