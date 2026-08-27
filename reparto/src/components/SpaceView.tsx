import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseTemplate,
  InstallmentPlan,
  Member,
  SettlementRecord,
  Space,
  PlanTier,
} from '../types'
import { KIND_LABELS } from '../types'
import { addCustomCategory, categoryLabel } from '../lib/categories'
import { ExpenseFilterBar } from './ExpenseFilterBar'
import { YearModal } from './YearModal'
import { CategoryHistoryModal } from './CategoryHistoryModal'
import { IconPicker } from './IconPicker'
import { Modal } from './Modal'
import {
  categoryTotals,
  computeBalances,
  personCategoryTotals,
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
import { addPaymentMethod } from '../lib/paymentMethods'
import { splitBadge } from '../lib/split'
import { ShareMenu } from './ShareMenu'
import {
  openWhatsApp,
  personBalanceText,
  personDetailText,
  settlementNudgeText,
} from '../lib/export'
import { deleteReceipt, loadReceiptUrl, saveReceipt } from '../lib/receipts'
import {
  dueAlerts,
  isPersonalExpense,
  planProgress,
} from '../lib/installments'
import { incomeForMonth } from '../lib/members'
import {
  currentMonth,
  formatDate,
  formatMoney,
  formatMonth,
  formatPercent,
  monthStartISO,
  parseAmount,
  todayISO,
} from '../lib/format'
import {
  availableMonths,
  defaultMonthFilter,
  filterExpenses,
  monthExpenseCounts,
  spaceForMonth,
  type ExpenseFilters,
  type ExpenseSort,
  type MonthFilter,
} from '../lib/months'
import { MemberFormModal } from './MemberFormModal'
import { ExpenseFormModal, type ExpenseSaveOptions } from './ExpenseFormModal'
import { MonthNav } from './MonthNav'
import { AlertsBell } from './AlertsBell'
import { BudgetModal } from './BudgetModal'
import { ExpenseCartola } from './ExpenseCartola'
import { canAccessExpense } from '../lib/identity'
import { COMMON_CURRENCIES, currencyLabel, expenseCurrency, spaceCurrency } from '../lib/currency'
import { limitsFor } from '../lib/plans'
import { presetForSpace, spaceIcon } from '../lib/spacePresets'
import { yearSpend } from '../lib/year'

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
  onAddMember: (
    input: Pick<Member, 'name' | 'income' | 'contributionPercent' | 'incomeVariable'>,
  ) => void
  onUpdateMember: (
    id: string,
    input: {
      name: string
      income: number
      contributionPercent?: number
      incomeVariable?: boolean
      monthIncome?: { month: string; amount: number } | null
    },
  ) => void
  onRemoveMember: (id: string) => void
  onAddExpense: (input: ExpenseDraft) => string
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
    customShares?: Record<string, number>
    visibility?: InstallmentPlan['visibility']
    ownerUid?: string | null
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
  currentUserUid: string | null
  planTier: PlanTier
  onUpdateSpace: (patch: Partial<Space>) => void
  expenseNudge?: number
  peopleNudge?: number
  viewerName?: string | null
  otherSpaces?: { id: string; name: string }[]
  onMoveExpense?: (expenseId: string, toSpaceId: string) => void
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
  currentUserUid,
  planTier,
  onUpdateSpace,
  expenseNudge = 0,
  peopleNudge = 0,
  viewerName = null,
  otherSpaces = [],
  onMoveExpense,
}: Props) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [memberModal, setMemberModal] = useState<Member | null | 'new'>(null)
  const [expenseModal, setExpenseModal] = useState<ExpenseModalState>(null)
  const [pendingExpenseAfterMember, setPendingExpenseAfterMember] =
    useState(false)
  const memberSavedRef = useRef(false)
  const [month, setMonth] = useState<MonthFilter>(() => defaultMonthFilter(space))
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [sort, setSort] = useState<ExpenseSort>('date-desc')
  const [showBudget, setShowBudget] = useState(false)
  const [showYear, setShowYear] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAbono, setShowAbono] = useState(false)
  const [showCurrency, setShowCurrency] = useState(false)
  const [historyCategory, setHistoryCategory] = useState<string | null>(null)
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(20)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    () => space.members[0]?.id ?? null,
  )

  useEffect(() => {
    setMonth(defaultMonthFilter(space))
    setQuery('')
    setFilters({})
    setSort('date-desc')
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

  useEffect(() => {
    setVisibleExpenseCount(20)
  }, [space.id, month, query, filters, sort])

  useEffect(() => {
    if (!pendingExpenseAfterMember) return
    if (space.members.length === 0) return
    setPendingExpenseAfterMember(false)
    setExpenseModal({ mode: 'create' })
  }, [pendingExpenseAfterMember, space.members.length])

  const accessibleSpace = useMemo(
    () => ({
      ...space,
      expenses: space.expenses.filter((expense) =>
        canAccessExpense(expense, currentUserUid),
      ),
    }),
    [space, currentUserUid],
  )
  const months = useMemo(
    () => availableMonths(accessibleSpace.expenses, month),
    [accessibleSpace.expenses, month],
  )
  const monthCounts = useMemo(
    () => monthExpenseCounts(accessibleSpace.expenses),
    [accessibleSpace.expenses],
  )
  const memberName = (id: string) =>
    space.members.find((m) => m.id === id)?.name ?? '—'
  const balanceMonth = month !== 'all' ? month : null

  const filteredExpenses = useMemo(
    () =>
      filterExpenses(
        accessibleSpace.expenses,
        month,
        query,
        memberName,
        filters,
        sort,
      ),
    [accessibleSpace.expenses, month, query, filters, sort, space.members],
  )

  const monthExpenses = useMemo(
    () =>
      filterExpenses(accessibleSpace.expenses, month, '', memberName),
    [accessibleSpace.expenses, month, space.members],
  )

  const scopedSpace = useMemo(
    () => spaceForMonth(accessibleSpace, month),
    [accessibleSpace, month],
  )

  const yearRows = useMemo(
    () => yearSpend(accessibleSpace.expenses, (month === 'all' ? currentMonth() : month).slice(0, 4)),
    [accessibleSpace.expenses, month],
  )

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
  const categoryBudgetAlerts = budgetStatus
    .filter((item) => item.over && item.limit)
    .map((item) => ({
      label: item.label,
      spent: item.spent,
      limit: item.limit!,
    }))
  const totalLimit = space.budgetSettings?.totalLimit
  const alertSettings = space.alertSettings ?? {
    dueEnabled: true,
    dueDays: 1,
    budgetEnabled: true,
  }
  const computedBudgetAlerts =
    space.budgetSettings?.type === 'total' &&
    totalLimit &&
    spent > totalLimit
      ? [
          ...categoryBudgetAlerts,
          { label: 'Total mensual', spent, limit: totalLimit },
        ]
      : categoryBudgetAlerts
  const overBudget = alertSettings.budgetEnabled ? computedBudgetAlerts : []
  const plan = limitsFor(planTier)
  const preset = presetForSpace(space)
  const currency = spaceCurrency(space)
  const money = (amount: number, exact = false) => formatMoney(amount, exact, currency)
  const maxCat = cats[0]?.amount || 1
  const monthLabel = month === 'all' ? 'todos los meses' : formatMonth(month)
  const defaultDate = month === 'all' ? todayISO() : monthStartISO(month)

  const alerts = useMemo(() => {
    if (!alertSettings.dueEnabled) return []
    return dueAlerts(
      accessibleSpace.expenses,
      todayISO(),
      alertSettings.dueDays,
    ).filter(
      (a) => a.status === 'overdue' || a.status === 'due_soon',
    )
  }, [
    accessibleSpace.expenses,
    alertSettings.dueEnabled,
    alertSettings.dueDays,
  ])

  const person = useMemo(() => {
    if (!selectedPersonId) return null
    return personStats(scopedSpace, selectedPersonId, balanceMonth)
  }, [scopedSpace, selectedPersonId, balanceMonth])

  const myMember = useMemo(() => {
    if (currentUserUid) {
      const byUid = space.members.find((member) => member.userUid === currentUserUid)
      if (byUid) return byUid
    }
    const hint = viewerName?.trim().toLowerCase()
    if (!hint) return null
    return (
      space.members.find((member) => member.name.trim().toLowerCase() === hint) ??
      space.members.find((member) => hint.includes(member.name.trim().toLowerCase()))
    )
  }, [space.members, currentUserUid, viewerName])

  const myStats = useMemo(() => {
    if (!myMember) return null
    return personStats(scopedSpace, myMember.id, balanceMonth)
  }, [myMember, scopedSpace, balanceMonth])

  const personCats = useMemo(() => {
    if (!selectedPersonId) return []
    return personCategoryTotals(scopedSpace, selectedPersonId, balanceMonth)
  }, [scopedSpace, selectedPersonId, balanceMonth])

  const pendingVariableIncomes = useMemo(() => {
    if (!balanceMonth) return []
    return space.members.filter(
      (member) =>
        member.incomeVariable && member.incomeByMonth?.[balanceMonth] == null,
    )
  }, [space.members, balanceMonth])

  const plans = space.installmentPlans ?? []
  const contributionTotal = space.members.reduce(
    (sum, member) => sum + (member.contributionPercent ?? 0),
    0,
  )
  const usesManualContributions =
    Math.abs(contributionTotal - 100) < 0.01

  const openCreate = () => {
    if (space.members.length === 0) {
      setPendingExpenseAfterMember(true)
      setMemberModal('new')
      return
    }
    if (accessibleSpace.expenses.length >= plan.maxExpensesPerSpace) {
      alert(
        `Llegaste al límite de ${plan.maxExpensesPerSpace} gastos del plan ${plan.label}.`,
      )
      return
    }
    setExpenseModal({ mode: 'create' })
  }

  const lastExpenseNudge = useRef(expenseNudge)
  const lastPeopleNudge = useRef(peopleNudge)

  useEffect(() => {
    if (expenseNudge === lastExpenseNudge.current) return
    lastExpenseNudge.current = expenseNudge
    if (!expenseNudge) return
    openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseNudge])

  useEffect(() => {
    if (peopleNudge === lastPeopleNudge.current) return
    lastPeopleNudge.current = peopleNudge
    if (!peopleNudge) return
    setTab('personas')
    setMemberModal('new')
  }, [peopleNudge])

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
        customShares: input.customShares,
        visibility: input.visibility,
        ownerUid: input.ownerUid,
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
        customShares: input.customShares,
        visibility: input.visibility,
        ownerUid: input.ownerUid,
        notes: input.notes,
      })
    }
    const payload = { ...input, templateId }
    let expenseId =
      expenseModal?.mode === 'edit' ? expenseModal.expense.id : ''
    if (expenseModal?.mode === 'edit') {
      onUpdateExpense(expenseModal.expense.id, payload)
      if (options.moveToSpaceId && onMoveExpense) {
        onMoveExpense(expenseModal.expense.id, options.moveToSpaceId)
      }
    } else {
      expenseId = onAddExpense(payload)
    }
    if (expenseId && options.receipt instanceof Blob) {
      void saveReceipt(expenseId, options.receipt)
    } else if (expenseId && options.receipt === 'remove') {
      void deleteReceipt(expenseId)
    }
  }

  return (
    <div className="panel main-panel">
      <header className="hero-space">
        <div className="section-head" style={{ marginBottom: '0.35rem' }}>
          <div>
            <h1>
              <button
                type="button"
                className="space-icon-btn"
                aria-label="Cambiar icono del espacio"
                onClick={() => setShowIconPicker(true)}
              >
                {spaceIcon(space)}
              </button>{' '}
              {space.name}
            </h1>
            <p>{space.description || 'Cuenta compartida'}</p>
          </div>
          <div className="hero-actions">
            <AlertsBell
              dueAlerts={alerts}
              budgetAlerts={overBudget}
              settings={alertSettings}
              onUpdateSettings={(settings) =>
                onUpdateSpace({ alertSettings: settings })
              }
              onOpenExpense={(expenseId) => {
                const expense = accessibleSpace.expenses.find(
                  (item) => item.id === expenseId,
                )
                if (expense) setExpenseModal({ mode: 'edit', expense })
              }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm hide-sm"
              onClick={() => {
                if (confirm(`¿Eliminar el espacio “${space.name}”?`)) onDeleteSpace()
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
        <div className="hero-meta">
          <span className="chip">{KIND_LABELS[space.kind]}</span>
          {space.visibility === 'personal' ? (
            <span className="chip chip-private">🔒 Personal</span>
          ) : null}
          <span className="chip">{space.members.length} personas</span>
          <span className="chip">{scopedSpace.expenses.length} gastos</span>
          <span className="chip hide-sm">
            {money(spent)} · {monthLabel}
          </span>
        </div>
      </header>

      <div className="toolbar">
        <MonthNav
          month={month}
          months={months}
          counts={monthCounts}
          onChange={setMonth}
        />
        <div className="toolbar-actions">
          {month !== 'all' && plan.features.budgets ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowBudget(true)}
            >
              Presupuesto
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowYear(true)}
          >
            El año
          </button>
          <ShareMenu
            space={accessibleSpace}
            month={month}
            members={space.members}
            memberName={memberName}
            disabled={scopedSpace.expenses.length === 0}
            allowExport={plan.features.export}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowCurrency(true)}
            title="Moneda del espacio"
          >
            {currency}
          </button>
          <button
            type="button"
            className={`btn btn-ghost btn-sm search-toggle${showSearch || query ? ' active' : ''}`}
            onClick={() => setShowSearch((open) => !open)}
            aria-label="Buscar"
          >
            Buscar
          </button>
        </div>
        {showSearch || query ? (
          <label className="search-field">
            <span className="sr-only">Buscar gasto</span>
            <input
              type="search"
              placeholder="Buscar gasto, nota o quién pagó…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        ) : null}
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
            <div className="impact-grid">
              <div className="stat impact-card">
                <div className="stat-label">Gasto total del mes</div>
                <div className="stat-value">{money(spent)}</div>
                <div className="row-meta">{monthLabel}</div>
              </div>
              <div className="stat impact-card">
                <div className="stat-label">Tu gasto acumulado</div>
                <div className="stat-value">
                  {myStats ? money(myStats.share) : '—'}
                </div>
                <div className="row-meta">
                  {myMember
                    ? `${myMember.name} · te corresponde este mes`
                    : 'Vincula tu usuario a una persona del espacio'}
                </div>
              </div>
              <div className="stat impact-card">
                <div className="stat-label">Saldo final</div>
                {settlements.length === 0 ? (
                  <>
                    <div className="stat-value amount-pos">A mano</div>
                    <div className="row-meta">Nadie debe dinero este período</div>
                  </>
                ) : (
                  <>
                    <div className="stat-value" style={{ fontSize: '1.05rem' }}>
                      {settlements[0].fromName} → {settlements[0].toName}
                    </div>
                    <div className="row-meta">
                      {money(settlements[0].amount, true)}
                      {settlements.length > 1
                        ? ` · +${settlements.length - 1} más`
                        : ''}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              className="year-strip"
              onClick={() => setShowYear(true)}
            >
              <span className="year-strip-copy">
                <strong>Así va el año</strong>
                <span>Compara meses y mira el gráfico</span>
              </span>
              <span className="year-strip-bars" aria-hidden>
                {yearRows.map((row) => {
                  const max = Math.max(1, ...yearRows.map((item) => item.amount))
                  return (
                    <span
                      key={row.month}
                      className={`year-mini${row.month === (month === 'all' ? currentMonth() : month) ? ' active' : ''}`}
                      style={{ height: `${Math.max(12, (row.amount / max) * 100)}%` }}
                    />
                  )
                })}
              </span>
            </button>

            <div className="section-head" style={{ marginTop: '1.25rem' }}>
              <h2>Cómo saldar este mes</h2>
            </div>
            {space.members.length === 0 || scopedSpace.expenses.length === 0 ? (
              <div className="empty">
                <h3>Sin saldos todavía</h3>
                <p>Cuando haya gastos en {monthLabel}, aquí verás cómo equilibrar.</p>
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
                      <div className="row-amount">{money(s.amount, true)}</div>
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
                          {money(r.amount, true)} · {formatDate(r.date)}
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
                      <strong>{money(t.amount)}</strong>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="section-head">
              <h2>Gasto por categoría</h2>
            </div>
            {cats.length === 0 ? (
              <div className="empty">
                <h3>Sin gastos en {monthLabel}</h3>
                <p>Cambia de mes o registra un gasto nuevo.</p>
              </div>
            ) : (
              <div className="category-bars">
                {cats.map((c) => {
                  const budget = budgetStatus.find((b) => b.category === c.category)
                  return (
                    <div
                      className={`cat-row${budget?.over ? ' cat-over' : ''}`}
                      key={c.category}
                      role="button"
                      tabIndex={0}
                      onClick={() => setHistoryCategory(c.category)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') setHistoryCategory(c.category)
                      }}
                    >
                      <span>
                        {categoryLabel(c.category, space.customCategories)}
                        {budget?.limit ? (
                          <span className="cat-limit">
                            {' '}
                            / {money(budget.limit)}
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
                      <strong>{money(c.amount)}</strong>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="section-head" style={{ marginTop: '1.5rem' }}>
              <h2>Cartola del período</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setTab('gastos')}
              >
                Ver cartola completa
              </button>
            </div>
            <ExpenseCartola
              expenses={monthExpenses.slice(0, 8)}
              members={space.members}
              customCategories={space.customCategories}
              space={space}
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
                className="btn btn-primary btn-sm page-add-expense hide-sm"
                onClick={openCreate}
              >
                + {preset.expenseButton}
              </button>
            </div>

            {space.templates.length > 0 ? (
              <div className="repeat-strip">
                <span className="repeat-label">Repetir</span>
                <div className="repeat-scroller">
                  {space.templates.map((t) => (
                    <div className="repeat-chip" key={t.id}>
                      <button
                        type="button"
                        className="repeat-chip-use"
                        disabled={space.members.length === 0}
                        onClick={() =>
                          setExpenseModal({ mode: 'template', template: t })
                        }
                      >
                        <span>{t.description}</span>
                        <strong>{money(t.amount)}</strong>
                      </button>
                      <button
                        type="button"
                        className="repeat-chip-x"
                        aria-label={`Quitar ${t.description}`}
                        onClick={() => {
                          if (confirm(`¿Quitar la plantilla “${t.description}”?`)) {
                            onRemoveTemplate(t.id)
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="hint" style={{ marginBottom: '0.75rem' }}>
                Usa plantillas para repetir gastos frecuentes.
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
                            {categoryLabel(plan.category, space.customCategories)} · total{' '}
                            {money(plan.totalAmount)} ·{' '}
                            {plan.installmentCount} cuotas · pagó{' '}
                            {memberName(plan.paidById)}
                          </div>
                          <div className="row-meta">
                            Avance {progress.paidCount}/{plan.installmentCount} ·
                            pagado {money(progress.paidAmount)}
                            {progress.nextDue
                              ? ` · próxima ${formatDate(progress.nextDue)}`
                              : ' · completado'}
                          </div>
                        </div>
                        <div className="row-amount">
                          {money(
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
                <h3>Primero agrega personas</h3>
                <p>Sin integrantes no se puede registrar quién pagó.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openCreate}
                >
                  Agregar persona y cargar gasto
                </button>
              </div>
            ) : (
              <>
                <div className="section-head">
                  <h2>Cartola · {monthLabel}</h2>
                </div>
                <ExpenseFilterBar
                  categories={[...new Set(monthExpenses.map((expense) => expense.category))]}
                  members={space.members.filter((member) =>
                    monthExpenses.some((expense) => expense.paidById === member.id),
                  )}
                  customCategories={space.customCategories}
                  filters={filters}
                  sort={sort}
                  onFilters={setFilters}
                  onSort={setSort}
                />
                {filteredExpenses.length !== monthExpenses.length ? (
                  <p className="hint" style={{ marginBottom: '0.75rem' }}>
                    {filteredExpenses.length} de {monthExpenses.length} gastos
                  </p>
                ) : null}
                <ExpenseCartola
                  expenses={filteredExpenses.slice(0, visibleExpenseCount)}
                  members={space.members}
                  customCategories={space.customCategories}
                  space={space}
                  memberName={memberName}
                  onEdit={(e) => setExpenseModal({ mode: 'edit', expense: e })}
                  onRepeat={(e) => setExpenseModal({ mode: 'repeat', expense: e })}
                  onRemove={onRemoveExpense}
                  emptyTitle={
                    query || filters.category || filters.paidById || filters.tag
                      ? 'Nada con esos filtros'
                      : `Sin gastos en ${monthLabel}`
                  }
                />
                {filteredExpenses.length > visibleExpenseCount ? (
                  <div className="load-more">
                    <span className="hint">
                      Mostrando {visibleExpenseCount} de {filteredExpenses.length}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setVisibleExpenseCount((count) => count + 20)
                      }
                    >
                      Mostrar 20 más
                    </button>
                  </div>
                ) : null}
              </>
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
            {space.members.some(
              (member) => member.contributionPercent != null,
            ) ? (
              <div
                className={`contribution-status${usesManualContributions ? ' valid' : ' invalid'}`}
              >
                <strong>
                  Porcentajes acordados: {contributionTotal.toFixed(1)}%
                </strong>
                <span>
                  {usesManualContributions
                    ? 'Se usarán como reparto habitual en lugar del sueldo.'
                    : 'Deben sumar 100%. Mientras tanto se seguirá usando el ingreso.'}
                </span>
              </div>
            ) : null}
            {pendingVariableIncomes.length > 0 && balanceMonth ? (
              <div className="variable-income-banner">
                <strong>Confirmar sueldos variables de {formatMonth(balanceMonth)}</strong>
                {pendingVariableIncomes.map((member) => (
                  <VariableIncomeRow
                    key={member.id}
                    member={member}
                    month={balanceMonth}
                    onConfirm={(amount) =>
                      onUpdateMember(member.id, {
                        name: member.name,
                        income: member.income,
                        contributionPercent: member.contributionPercent,
                        incomeVariable: true,
                        monthIncome: { month: balanceMonth, amount },
                      })
                    }
                  />
                ))}
              </div>
            ) : null}
            {month === 'all' ? (
              <p className="hint" style={{ marginBottom: '1rem' }}>
                Elige un mes concreto para ver o cargar un ingreso distinto solo
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
                  Agrega a cada integrante con su ingreso para repartir en
                  proporción.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setMemberModal('new')}
                >
                  Agregar persona
                </button>
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
                            ? `Ingreso de este mes ${money(monthIncome)} (ajuste)`
                            : `Ingreso ${money(monthIncome)}`}
                          {shareMember
                            ? ` · aporta ${formatPercent(shareMember.incomeShare)}`
                            : null}
                          {m.contributionPercent != null
                            ? ` · acordado ${m.contributionPercent}%`
                            : null}
                        </div>
                        {hasOverride ? (
                          <div className="row-meta">
                            Base {money(m.income)} · override en{' '}
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
                      <div className="row-amount">{money(monthIncome)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : null}

        {tab === 'personas' ? (
          <>
            <div className="section-head">
              <h2>Detalle del mes · {monthLabel}</h2>
            </div>
            {space.members.length === 0 ? (
              <div className="empty">
                <h3>Sin personas</h3>
                <p>Agrega integrantes para ver el detalle de cada uno.</p>
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
                    <h3>Elige una persona</h3>
                  </div>
                ) : (
                  <>
                    <div className="stats">
                      <div className="stat">
                        <div className="stat-label">Pagó</div>
                        <div className="stat-value">
                          {money(person.paid)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Le corresponde</div>
                        <div className="stat-value">
                          {money(person.share)}
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
                            ? `+${money(person.net)}`
                            : money(person.net)}
                        </div>
                      </div>
                    </div>

                    <div className="stats" style={{ marginTop: '0.75rem' }}>
                      <div className="stat">
                        <div className="stat-label">Personales pagados</div>
                        <div className="stat-value">
                          {money(person.personalPaid)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Personales (cuota)</div>
                        <div className="stat-value">
                          {money(person.personalShare)}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Ingreso · aporte</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                          {money(person.income)} ·{' '}
                          {formatPercent(person.incomeShare)}
                        </div>
                      </div>
                    </div>

                    {personCats.length > 0 ? (
                      <>
                        <div className="section-head" style={{ marginTop: '1.25rem' }}>
                          <h2>Gasto por categoría</h2>
                        </div>
                        <div className="category-bars">
                          {personCats.map((row) => (
                            <div
                              className="cat-row"
                              key={row.category}
                              role="button"
                              tabIndex={0}
                              onClick={() => setHistoryCategory(row.category)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') setHistoryCategory(row.category)
                              }}
                            >
                              <span>{categoryLabel(row.category, space.customCategories)}</span>
                              <div className="cat-bar">
                                <span
                                  style={{
                                    width: `${Math.min(100, (row.amount / (personCats[0].amount || 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <strong>{money(row.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}

                    <div className="section-head" style={{ marginTop: '1.25rem' }}>
                      <h2>Lo que pagó</h2>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const text = personBalanceText(
                              accessibleSpace,
                              month,
                              person.memberId,
                            )
                            if (text) openWhatsApp(text)
                          }}
                        >
                          Enviar saldo
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const text = personDetailText(
                              accessibleSpace,
                              month,
                              person.memberId,
                            )
                            if (text) openWhatsApp(text)
                          }}
                        >
                          Enviar detalle
                        </button>
                      </div>
                    </div>
                    <ExpenseList
                      expenses={person.paidExpenses}
                      members={space.members}
                      customCategories={space.customCategories}
                      space={space}
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
                      customCategories={space.customCategories}
                      space={space}
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
                  Cuando haya gastos en este período, aquí verás quién debe a
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
                        Pagó {money(b.paid, true)}
                      </div>
                      <div className="row-meta">
                        Le corresponde {money(b.owes, true)}
                      </div>
                      <div
                        className={`row-amount ${
                          b.net >= 0 ? 'amount-pos' : 'amount-neg'
                        }`}
                        style={{ marginTop: '0.55rem', textAlign: 'left' }}
                      >
                        {b.net >= 0
                          ? `Le deben ${money(b.net, true)}`
                          : `Debe ${money(-b.net, true)}`}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const text = personBalanceText(
                            accessibleSpace,
                            month,
                            b.memberId,
                          )
                          if (text) openWhatsApp(text)
                        }}
                      >
                        WhatsApp
                      </button>
                    </div>
                  ))}
                </div>

                <div className="section-head">
                  <h2>Cómo saldar</h2>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAbono(true)}
                  >
                    Registrar abono
                  </button>
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
                            {money(s.amount, true)}
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              openWhatsApp(
                                settlementNudgeText(accessibleSpace, month, s),
                              )
                            }
                          >
                            Avisar
                          </button>
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
                              {money(r.amount, true)} · {formatDate(r.date)}
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
          intentHint={
            pendingExpenseAfterMember
              ? 'Primero indica quién comparte. Después se abre el gasto.'
              : undefined
          }
          onClose={() => {
            setMemberModal(null)
            if (!memberSavedRef.current) setPendingExpenseAfterMember(false)
            memberSavedRef.current = false
          }}
          onSave={(input) => {
            memberSavedRef.current = true
            if (memberModal === 'new') onAddMember(input)
            else onUpdateMember(memberModal.id, input)
          }}
        />
      ) : null}

      {expenseModal !== null && space.members.length > 0 ? (
        <ExpenseFormModal
          members={space.members}
          customCategories={space.customCategories}
          paymentMethods={space.paymentMethods}
          previousExpenses={accessibleSpace.expenses}
          spaces={[{ id: space.id, name: space.name }, ...otherSpaces]}
          currentSpaceId={space.id}
          onAddCategory={(label) => {
            const added = addCustomCategory(space.customCategories, label)
            if (!added) return 'otros'
            onUpdateSpace({ customCategories: added.next })
            return added.id
          }}
          onAddPaymentMethod={(label) => {
            const added = addPaymentMethod(space.paymentMethods, label)
            if (!added) return label
            onUpdateSpace({ paymentMethods: added.next })
            return added.label
          }}
          currentUserUid={currentUserUid}
          allowInstallments={plan.features.installments}
          allowMulticurrency={plan.features.multipleCurrencies}
          spaceCurrency={currency}
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
                    customShares: expenseModal.template.customShares,
                    visibility: expenseModal.template.visibility,
                    ownerUid: expenseModal.template.ownerUid,
                    notes: expenseModal.template.notes,
                    templateId: expenseModal.template.id,
                  }
          }
          onClose={() => setExpenseModal(null)}
          onSave={handleSaveExpense}
        />
      ) : null}

      {showBudget && month !== 'all' ? (
        <BudgetModal
          space={space}
          month={month}
          status={budgetStatus}
          spent={spent}
          onSetCategory={onSetCategoryBudget}
          onUpdateSettings={(budgetSettings) =>
            onUpdateSpace({ budgetSettings })
          }
          onClose={() => setShowBudget(false)}
        />
      ) : null}

      {showYear ? (
        <YearModal
          space={accessibleSpace}
          month={month}
          onPickMonth={(value) => {
            setMonth(value)
            setShowYear(false)
            setTab('gastos')
          }}
          onClose={() => setShowYear(false)}
        />
      ) : null}

      {showIconPicker ? (
        <Modal
          title="Icono del espacio"
          subtitle="Así se va a ver en la lista"
          onClose={() => setShowIconPicker(false)}
        >
          <IconPicker
            value={spaceIcon(space)}
            onChange={(icon) => {
              onUpdateSpace({ icon })
              setShowIconPicker(false)
            }}
          />
        </Modal>
      ) : null}

      {historyCategory ? (
        <CategoryHistoryModal
          space={accessibleSpace}
          category={historyCategory}
          onClose={() => setHistoryCategory(null)}
        />
      ) : null}

      {showAbono ? (
        <AbonoModal
          members={space.members}
          suggested={settlements[0] ?? null}
          onClose={() => setShowAbono(false)}
          onSave={(input) => {
            onRecordSettlement({
              ...input,
              date: todayISO(),
              periodMonth: balanceMonth ?? undefined,
              note: 'Abono de pago',
            })
            setShowAbono(false)
          }}
        />
      ) : null}

      {showCurrency ? (
        <Modal
          title="Moneda del espacio"
          subtitle={currencyLabel(currency)}
          onClose={() => setShowCurrency(false)}
        >
          <label className="field">
            Moneda principal
            <select
              value={currency}
              onChange={(event) => {
                onUpdateSpace({ currency: event.target.value })
                setShowCurrency(false)
              }}
            >
              {COMMON_CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Esta es la moneda principal del espacio. Tu moneda habitual se configura
            en Ajustes. En plan Plus puedes registrar gastos puntuales en otra moneda.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowCurrency(false)}>
              Listo
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function ExpenseList({
  expenses,
  members,
  customCategories,
  space,
  memberName,
  onEdit,
  onRepeat,
  onRemove,
  emptyTitle,
}: {
  expenses: Expense[]
  members: Member[]
  customCategories?: Space['customCategories']
  space: Space
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
    <div className="list statement">
      {expenses.map((e) => {
        const personal = isPersonalExpense(e)
        const isInstallment = Boolean(e.installmentPlanId)
        const badge = splitBadge(e)
        const day = e.date.slice(8, 10)
        const payer = members.find((member) => member.id === e.paidById)
        return (
          <div className={`statement-row${e.provisional ? ' provisional' : ''}`} key={e.id}>
            <div
              className="statement-date"
              title={formatDate(e.date)}
              style={{ borderLeftColor: payer?.color }}
            >
              <strong>{day}</strong>
              <span>{formatDate(e.date).split(' ')[1] ?? ''}</span>
            </div>
            <div>
              <div className="row-title">
                {e.description}{' '}
                <span className={`split-badge split-${badge.kind}`} title={badge.label}>
                  {badge.short}
                </span>
                {e.provisional ? <span className="chip">Provisorio</span> : null}
                {personal ? <span className="chip">personal</span> : null}
                {isInstallment && e.installmentNumber && e.installmentTotal ? (
                  <span className="chip">
                    cuota {e.installmentNumber}/{e.installmentTotal}
                  </span>
                ) : null}
              </div>
              <div className="row-meta">
                {categoryLabel(e.category, customCategories)} · pagó {memberName(e.paidById)}
                {e.paymentMethod ? ` · ${e.paymentMethod}` : ''}
                {e.accountingMonth ? ` · mes ${formatMonth(e.accountingMonth)}` : ''}
                {e.hasReceipt ? ' · con ticket' : ''}
              </div>
              {e.notes ? <div className="row-meta">{e.notes}</div> : null}
              <div className="row-actions">
                {e.hasReceipt ? <ReceiptLink expenseId={e.id} /> : null}
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
            <div className={`row-amount${e.provisional ? ' amount-muted' : ''}`}>
              {formatMoney(e.amount, false, expenseCurrency(e, space))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReceiptLink({ expenseId }: { expenseId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let current: string | null = null
    void loadReceiptUrl(expenseId).then((loaded) => {
      if (!loaded) return
      current = loaded
      setUrl(loaded)
    })
    return () => {
      if (current) URL.revokeObjectURL(current)
    }
  }, [expenseId])
  if (!url) return <span className="chip">Ticket</span>
  return (
    <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer">
      Ver ticket
    </a>
  )
}

function VariableIncomeRow({
  member,
  month,
  onConfirm,
}: {
  member: Member
  month: string
  onConfirm: (amount: number) => void
}) {
  const [value, setValue] = useState(String(member.income || ''))
  return (
    <form
      className="inline-control"
      onSubmit={(event) => {
        event.preventDefault()
        const amount = parseAmount(value)
        if (Number.isNaN(amount) || amount < 0) return
        onConfirm(amount)
      }}
    >
      <span>{member.name}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={`Sueldo de ${member.name} en ${formatMonth(month)}`}
      />
      <button type="submit" className="btn btn-primary btn-sm">
        Confirmar
      </button>
    </form>
  )
}

function AbonoModal({
  members,
  suggested,
  onClose,
  onSave,
}: {
  members: Member[]
  suggested: { fromId: string; toId: string; amount: number } | null
  onClose: () => void
  onSave: (input: { fromId: string; toId: string; amount: number }) => void
}) {
  const [fromId, setFromId] = useState(suggested?.fromId ?? members[0]?.id ?? '')
  const [toId, setToId] = useState(suggested?.toId ?? members[1]?.id ?? members[0]?.id ?? '')
  const [amount, setAmount] = useState(
    suggested?.amount ? String(Math.round(suggested.amount)) : '',
  )
  return (
    <Modal
      title="Abono de pago"
      subtitle="Cuando alguien transfiere su parte, el saldo del mes se descuenta"
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          const value = parseAmount(amount)
          if (!fromId || !toId || fromId === toId || Number.isNaN(value) || value <= 0) return
          onSave({ fromId, toId, amount: value })
        }}
      >
        <div className="form-row">
          <label className="field">
            Quién transfiere
            <select value={fromId} onChange={(event) => setFromId(event.target.value)}>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            A quién
            <select value={toId} onChange={(event) => setToId(event.target.value)}>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Monto
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Registrar abono
          </button>
        </div>
      </form>
    </Modal>
  )
}
