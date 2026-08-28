import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Member, PlanTier, SavingsGoal, SavingsMovement, Space } from '../types'
import {
  diffMonthsInclusive,
  monthlySavingsNeeded,
  savingsGrowthSeries,
  savingsProgress,
} from '../lib/savings'
import { formatDate, formatMoney, parseAmount, todayISO } from '../lib/format'
import { spaceCurrency } from '../lib/currency'
import { MEMBER_COLORS } from '../types'
import { PremiumUpsell } from './PremiumUpsell'
import { ProgressRing } from './ProgressRing'
import { Modal } from './Modal'
import { limitsFor } from '../lib/plans'
import { AppIcon } from './AppIcon'

interface Props {
  hubSpace: Space | null
  members: Member[]
  planTier: PlanTier
  defaultMemberId?: string | null
  onOpenUpgrade?: () => void
  onAddGoal: (
    spaceId: string,
    input: Pick<
      SavingsGoal,
      'name' | 'targetAmount' | 'color' | 'deadline' | 'note' | 'visibility' | 'ownerMemberId'
    >,
  ) => void
  onRemoveGoal: (spaceId: string, goalId: string) => void
  onAddMovement: (
    spaceId: string,
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (spaceId: string, movementId: string) => void
}

type SavingsTab = 'shared' | 'personal'

export function SavingsSection({
  hubSpace,
  members,
  planTier,
  defaultMemberId,
  onOpenUpgrade,
  onAddGoal,
  onRemoveGoal,
  onAddMovement,
  onRemoveMovement,
}: Props) {
  const plan = limitsFor(planTier)

  return (
    <section className="module-page savings-module">
      <header className="module-header">
        <div>
          <h1 className="module-title">Metas de Ahorro</h1>
          <p className="module-subtitle">
            Metas y proyectos del hogar — independientes de tus espacios de gastos.
          </p>
        </div>
      </header>

      <PremiumUpsell feature="savings" planTier={planTier} onOpenUpgrade={onOpenUpgrade} />

      {plan.features.savings && hubSpace ? (
        <SavingsContent
          space={hubSpace}
          members={members}
          defaultMemberId={defaultMemberId}
          onAddGoal={(input) => onAddGoal(hubSpace.id, input)}
          onRemoveGoal={(goalId) => onRemoveGoal(hubSpace.id, goalId)}
          onAddMovement={(input) => onAddMovement(hubSpace.id, input)}
          onRemoveMovement={(movementId) => onRemoveMovement(hubSpace.id, movementId)}
        />
      ) : null}
    </section>
  )
}

function SavingsContent({
  space,
  members,
  defaultMemberId,
  onAddGoal,
  onRemoveGoal,
  onAddMovement,
  onRemoveMovement,
}: {
  space: Space
  members: Member[]
  defaultMemberId?: string | null
  onAddGoal: (
    input: Pick<
      SavingsGoal,
      'name' | 'targetAmount' | 'color' | 'deadline' | 'note' | 'visibility' | 'ownerMemberId'
    >,
  ) => void
  onRemoveGoal: (goalId: string) => void
  onAddMovement: (
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (movementId: string) => void
}) {
  const currency = spaceCurrency(space)
  const money = (amount: number) => formatMoney(amount, false, currency)
  const goals = space.savingsGoals ?? []
  const movements = space.savingsMovements ?? []
  const today = todayISO()
  const myMemberId =
    members.find((member) => member.userUid === defaultMemberId)?.id ??
    members[0]?.id ??
    null

  const [tab, setTab] = useState<SavingsTab>('shared')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [quickDepositGoalId, setQuickDepositGoalId] = useState<string | null>(null)
  const [quickAmount, setQuickAmount] = useState('')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [goalVisibility, setGoalVisibility] = useState<'shared' | 'personal'>('shared')

  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) =>
        tab === 'shared'
          ? goal.visibility !== 'personal'
          : goal.visibility === 'personal' && goal.ownerMemberId === myMemberId,
      ),
    [goals, tab, myMemberId],
  )

  const detailGoal = goals.find((goal) => goal.id === detailGoalId) ?? null

  const resetCreateForm = () => {
    setName('')
    setTarget('')
    setDeadline('')
    setGoalVisibility('shared')
  }

  const submitGoal = (event: FormEvent) => {
    event.preventDefault()
    const targetAmount = parseAmount(target)
    if (!name.trim() || targetAmount <= 0) return
    onAddGoal({
      name: name.trim(),
      targetAmount,
      color: MEMBER_COLORS[goals.length % MEMBER_COLORS.length],
      deadline: deadline || undefined,
      visibility: goalVisibility,
      ownerMemberId: goalVisibility === 'personal' ? myMemberId ?? undefined : undefined,
    })
    resetCreateForm()
    setShowCreateModal(false)
  }

  const submitQuickDeposit = () => {
    if (!quickDepositGoalId) return
    const amount = parseAmount(quickAmount)
    if (amount <= 0) return
    onAddMovement({
      goalId: quickDepositGoalId,
      amount,
      date: today,
      memberId: myMemberId ?? undefined,
    })
    setQuickAmount('')
    setQuickDepositGoalId(null)
  }

  return (
    <>
      <div className="module-toolbar">
        <div className="savings-tabs module-segmented">
          <button
            type="button"
            className={`module-segment${tab === 'shared' ? ' active' : ''}`}
            onClick={() => setTab('shared')}
          >
            Ahorros familiares
          </button>
          <button
            type="button"
            className={`module-segment${tab === 'personal' ? ' active' : ''}`}
            onClick={() => setTab('personal')}
          >
            Mis ahorros personales
          </button>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => setShowCreateModal(true)}
        >
          <AppIcon name="plus" size={18} className="ui-icon ui-icon-inline" />
          Nueva Meta
        </button>
      </div>

      {visibleGoals.length === 0 ? (
        <div className="module-empty-state">
          <div className="module-empty-icon" aria-hidden>
            <AppIcon name="target" size={32} className="ui-icon ui-icon-muted" />
          </div>
          <h3>Sin metas todavía</h3>
          <p>Crea una meta {tab === 'shared' ? 'compartida' : 'personal'} para empezar a ahorrar.</p>
          <button type="button" className="btn btn-accent btn-sm" onClick={() => setShowCreateModal(true)}>
            <AppIcon name="plus" size={16} className="ui-icon ui-icon-inline" />
            Crear primera meta
          </button>
        </div>
      ) : (
        <div className="savings-card-grid">
          {visibleGoals.map((goal) => {
            const { saved, percent } = savingsProgress(goal, movements)
            const monthly = monthlySavingsNeeded(goal, movements, today)
            const monthsLeft = goal.deadline
              ? diffMonthsInclusive(today.slice(0, 10), goal.deadline)
              : null

            return (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                saved={saved}
                percent={percent}
                monthly={monthly}
                monthsLeft={monthsLeft}
                money={money}
                onOpen={() => setDetailGoalId(goal.id)}
                onDeposit={() => {
                  setQuickDepositGoalId(goal.id)
                  setQuickAmount('')
                }}
                onRemove={() => {
                  if (confirm(`¿Eliminar la meta “${goal.name}”?`)) {
                    onRemoveGoal(goal.id)
                  }
                }}
              />
            )
          })}
        </div>
      )}

      {showCreateModal ? (
        <Modal
          title="Nueva meta"
          subtitle="Define tu objetivo de ahorro"
          onClose={() => {
            resetCreateForm()
            setShowCreateModal(false)
          }}
        >
          <form className="form-grid" onSubmit={submitGoal}>
            <label className="field">
              Nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Casamiento, viaje, auto…"
                required
                autoFocus
              />
            </label>
            <label className="field">
              Monto objetivo
              <input
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="500000"
                required
              />
            </label>
            <label className="field">
              Fecha límite (opcional)
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>
            <label className="field">
              Tipo
              <select
                value={goalVisibility}
                onChange={(e) => setGoalVisibility(e.target.value as 'shared' | 'personal')}
              >
                <option value="shared">Compartido</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetCreateForm()
                  setShowCreateModal(false)
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                Crear meta
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {quickDepositGoalId ? (
        <Modal title="Abonar a la meta" onClose={() => setQuickDepositGoalId(null)}>
          <label className="field">
            Monto
            <input
              inputMode="decimal"
              autoFocus
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="Ej. 50000"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setQuickDepositGoalId(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-accent" onClick={submitQuickDeposit}>
              Abonar
            </button>
          </div>
        </Modal>
      ) : null}

      {detailGoal ? (
        <GoalDetailModal
          goal={detailGoal}
          movements={movements.filter((movement) => movement.goalId === detailGoal.id)}
          members={members}
          money={money}
          onClose={() => setDetailGoalId(null)}
          onRemove={() => {
            if (confirm(`¿Eliminar la meta “${detailGoal.name}”?`)) {
              onRemoveGoal(detailGoal.id)
              setDetailGoalId(null)
            }
          }}
          onRemoveMovement={onRemoveMovement}
        />
      ) : null}
    </>
  )
}

function SavingsGoalCard({
  goal,
  saved,
  percent,
  monthly,
  monthsLeft,
  money,
  onOpen,
  onDeposit,
  onRemove,
}: {
  goal: SavingsGoal
  saved: number
  percent: number
  monthly: number | null
  monthsLeft: number | null
  money: (amount: number) => string
  onOpen: () => void
  onDeposit: () => void
  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  return (
    <article className="saas-card savings-goal-card">
      <div className="savings-goal-card-top">
        <button type="button" className="savings-goal-title" onClick={onOpen}>
          {goal.name}
        </button>
        <div className="savings-goal-menu" ref={menuRef}>
          <button
            type="button"
            className="icon-btn-ghost"
            aria-label={`Opciones de ${goal.name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <AppIcon name="more-vertical" size={18} className="ui-icon" />
          </button>
          {menuOpen ? (
            <div className="dropdown-menu">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpen()
                }}
              >
                Ver detalle
              </button>
              <button
                type="button"
                className="dropdown-danger"
                onClick={() => {
                  setMenuOpen(false)
                  onRemove()
                }}
              >
                Eliminar meta
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <button type="button" className="savings-goal-body" onClick={onOpen}>
        <ProgressRing percent={percent} size={120} stroke={10} variant="brand" />
        <div className="savings-goal-stats">
          <p className="savings-goal-amounts">
            <strong>{money(saved)}</strong>
            <span className="savings-goal-sep">/</span>
            {money(goal.targetAmount)}
          </p>
          {monthsLeft != null && monthsLeft > 0 ? (
            <p className="savings-goal-deadline">
              Faltan {monthsLeft} {monthsLeft === 1 ? 'mes' : 'meses'}
              {goal.deadline ? ` · meta ${formatDate(goal.deadline)}` : ''}
            </p>
          ) : goal.deadline ? (
            <p className="savings-goal-deadline">Meta: {formatDate(goal.deadline)}</p>
          ) : null}
          {monthly ? (
            <p className="savings-goal-projection">~{money(monthly)}/mes para llegar</p>
          ) : null}
        </div>
      </button>

      <button type="button" className="savings-deposit-btn" onClick={onDeposit}>
        <AppIcon name="plus" size={16} className="ui-icon ui-icon-inline" />
        Abonar
      </button>
    </article>
  )
}

function GoalDetailModal({
  goal,
  movements,
  members,
  money,
  onClose,
  onRemove,
  onRemoveMovement,
}: {
  goal: SavingsGoal
  movements: SavingsMovement[]
  members: Member[]
  money: (amount: number) => string
  onClose: () => void
  onRemove: () => void
  onRemoveMovement: (movementId: string) => void
}) {
  const { saved, percent } = savingsProgress(goal, movements)
  const series = savingsGrowthSeries(movements, goal.id)
  const monthly = monthlySavingsNeeded(goal, movements, todayISO())
  const memberName = (id?: string) => members.find((member) => member.id === id)?.name ?? '—'

  return (
    <Modal title={goal.name} subtitle={`${Math.round(percent * 100)}% completado`} onClose={onClose} wide>
      <div className="savings-detail-head">
        <ProgressRing percent={percent} size={120} variant="brand" />
        <div>
          <p className="savings-goal-amounts">
            <strong>{money(saved)}</strong> de {money(goal.targetAmount)}
          </p>
          {goal.deadline ? <p className="savings-goal-deadline">Meta: {formatDate(goal.deadline)}</p> : null}
          {monthly ? (
            <p className="savings-goal-projection">Necesitan ahorrar {money(monthly)} mensuales para llegar a tiempo.</p>
          ) : null}
        </div>
      </div>
      {series.length > 1 ? (
        <div className="savings-sparkline-wrap">
          <div className="savings-sparkline" aria-hidden>
            {series.map((point, index) => (
              <span
                key={point.date}
                style={{
                  height: `${Math.max(8, (point.total / Math.max(goal.targetAmount, 1)) * 100)}%`,
                  opacity: 0.35 + (index / series.length) * 0.65,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      <h3 className="module-section-label">Historial de abonos</h3>
      {movements.length === 0 ? (
        <p className="module-muted">Aún no hay abonos registrados.</p>
      ) : (
        <div className="list">
          {movements.map((movement) => (
            <div className="row" key={movement.id}>
              <div>
                <div className="row-title">{money(movement.amount)}</div>
                <div className="row-meta">
                  {formatDate(movement.date)}
                  {movement.memberId ? ` · ${memberName(movement.memberId)}` : ''}
                  {movement.note ? ` · ${movement.note}` : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRemoveMovement(movement.id)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
          Eliminar meta
        </button>
        <button type="button" className="btn btn-accent" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
