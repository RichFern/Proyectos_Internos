import { useMemo, useState, type FormEvent } from 'react'
import type { Member, PlanTier, SavingsGoal, SavingsMovement, Space } from '../types'
import {
  monthlySavingsNeeded,
  savingsGrowthSeries,
  savingsProgress,
  totalSaved,
} from '../lib/savings'
import { formatDate, formatMoney, parseAmount, todayISO } from '../lib/format'
import { spaceCurrency } from '../lib/currency'
import { MEMBER_COLORS } from '../types'
import { PremiumUpsell } from './PremiumUpsell'
import { ProgressRing } from './ProgressRing'
import { Modal } from './Modal'
import { spaceIcon } from '../lib/spacePresets'
import { limitsFor } from '../lib/plans'

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  onSelectSpace: (id: string) => void
  planTier: PlanTier
  defaultMemberId?: string | null
  onOpenPlans?: () => void
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
  spaces,
  activeSpaceId,
  onSelectSpace,
  planTier,
  defaultMemberId,
  onOpenPlans,
  onAddGoal,
  onRemoveGoal,
  onAddMovement,
  onRemoveMovement,
}: Props) {
  const plan = limitsFor(planTier)
  const space = spaces.find((item) => item.id === activeSpaceId) ?? spaces[0] ?? null

  if (!space) {
    return (
      <section className="panel app-section">
        <h1>Metas y Proyectos</h1>
        <p className="brand-sub">Crea un espacio para empezar a registrar metas de ahorro.</p>
      </section>
    )
  }

  return (
    <section className="panel app-section savings-section">
      <header className="app-section-head">
        <div>
          <h1>Metas y Proyectos</h1>
          <p className="brand-sub">
            Visualiza el avance, separa lo compartido de lo personal y abona rápido.
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

      <PremiumUpsell feature="savings" planTier={planTier} onOpenPlans={onOpenPlans} />

      {plan.features.savings ? (
        <SavingsContent
          space={space}
          members={space.members}
          defaultMemberId={defaultMemberId}
          onAddGoal={(input) => onAddGoal(space.id, input)}
          onRemoveGoal={(goalId) => onRemoveGoal(space.id, goalId)}
          onAddMovement={(input) => onAddMovement(space.id, input)}
          onRemoveMovement={(movementId) => onRemoveMovement(space.id, movementId)}
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
  onAddGoal: (input: Pick<
    SavingsGoal,
    'name' | 'targetAmount' | 'color' | 'deadline' | 'note' | 'visibility' | 'ownerMemberId'
  >) => void
  onRemoveGoal: (goalId: string) => void
  onAddMovement: (
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (movementId: string) => void
}) {
  const currency = spaceCurrency(space)
  const goals = space.savingsGoals ?? []
  const movements = space.savingsMovements ?? []
  const myMemberId =
    members.find((m) => m.userUid === defaultMemberId)?.id ??
    members.find((m) => m.id === defaultMemberId)?.id ??
    members[0]?.id

  const [tab, setTab] = useState<SavingsTab>('shared')
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [quickDepositGoalId, setQuickDepositGoalId] = useState<string | null>(null)
  const [quickAmount, setQuickAmount] = useState('')

  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalVisibility, setGoalVisibility] = useState<'shared' | 'personal'>('shared')

  const filteredGoals = useMemo(
    () =>
      goals.filter((goal) =>
        tab === 'shared'
          ? goal.visibility !== 'personal'
          : goal.visibility === 'personal' && goal.ownerMemberId === myMemberId,
      ),
    [goals, tab, myMemberId],
  )

  const memberName = (id?: string) =>
    members.find((member) => member.id === id)?.name ?? '—'

  const detailGoal = detailGoalId
    ? goals.find((goal) => goal.id === detailGoalId) ?? null
    : null

  const addGoal = (event: FormEvent) => {
    event.preventDefault()
    const target = parseAmount(goalTarget)
    if (!goalName.trim() || Number.isNaN(target) || target <= 0) return
    onAddGoal({
      name: goalName.trim(),
      targetAmount: target,
      color: MEMBER_COLORS[goals.length % MEMBER_COLORS.length],
      deadline: goalDeadline || undefined,
      visibility: goalVisibility,
      ownerMemberId: goalVisibility === 'personal' ? myMemberId : undefined,
    })
    setGoalName('')
    setGoalTarget('')
    setGoalDeadline('')
  }

  const submitQuickDeposit = (goalId: string) => {
    const amount = parseAmount(quickAmount)
    if (Number.isNaN(amount) || amount <= 0) return
    onAddMovement({
      goalId,
      amount,
      date: todayISO(),
      memberId: myMemberId,
    })
    setQuickAmount('')
    setQuickDepositGoalId(null)
  }

  return (
    <div className="savings-hub">
      <div className="savings-tabs">
        <button
          type="button"
          className={`chip${tab === 'shared' ? ' active' : ''}`}
          onClick={() => setTab('shared')}
        >
          Ahorros compartidos
        </button>
        <button
          type="button"
          className={`chip${tab === 'personal' ? ' active' : ''}`}
          onClick={() => setTab('personal')}
        >
          Mis ahorros personales
        </button>
      </div>

      <p className="section-summary">
        {space.name} · {formatMoney(totalSaved(movements), false, currency)} apartados
      </p>

      {filteredGoals.length === 0 ? (
        <div className="empty">
          <h3>Sin metas en esta vista</h3>
          <p>Crea una meta {tab === 'shared' ? 'compartida' : 'personal'} para empezar.</p>
        </div>
      ) : (
        <div className="savings-card-grid">
          {filteredGoals.map((goal) => {
            const progress = savingsProgress(goal, movements)
            const monthly = monthlySavingsNeeded(goal, movements, todayISO())
            return (
              <article className="savings-goal-card" key={goal.id}>
                <button
                  type="button"
                  className="savings-goal-card-body"
                  onClick={() => setDetailGoalId(goal.id)}
                >
                  <ProgressRing percent={progress.percent} />
                  <div className="savings-goal-card-copy">
                    <strong>{goal.name}</strong>
                    <span className="row-meta">
                      {formatMoney(progress.saved, false, currency)} de{' '}
                      {formatMoney(goal.targetAmount, false, currency)}
                    </span>
                    {monthly != null && progress.remaining > 0 ? (
                      <span className="savings-projection">
                        Ahorrar {formatMoney(monthly, false, currency)}/mes para la meta
                      </span>
                    ) : null}
                    {goal.deadline ? (
                      <span className="row-meta">Meta {formatDate(goal.deadline)}</span>
                    ) : null}
                  </div>
                </button>
                <div className="savings-goal-card-actions">
                  {quickDepositGoalId === goal.id ? (
                    <div className="quick-deposit-inline">
                      <input
                        inputMode="decimal"
                        placeholder="Monto"
                        value={quickAmount}
                        onChange={(e) => setQuickAmount(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => submitQuickDeposit(goal.id)}
                      >
                        Abonar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setQuickDepositGoalId(null)}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm quick-deposit-btn"
                      onClick={() => {
                        setQuickDepositGoalId(goal.id)
                        setQuickAmount('')
                      }}
                    >
                      + Abonar rápido
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <form className="form-grid extras-form savings-create-form" onSubmit={addGoal}>
        <h3>Nueva meta</h3>
        <div className="form-row">
          <label className="field">
            Nombre
            <input value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
          </label>
          <label className="field">
            Objetivo ({currency})
            <input
              inputMode="decimal"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Fecha límite (opcional)
            <input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
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
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Crear meta
        </button>
      </form>

      {detailGoal ? (
        <SavingsDetailModal
          goal={detailGoal}
          movements={movements.filter((m) => m.goalId === detailGoal.id)}
          currency={currency}
          memberName={memberName}
          onClose={() => setDetailGoalId(null)}
          onRemove={() => {
            if (confirm(`¿Quitar la meta “${detailGoal.name}”?`)) {
              onRemoveGoal(detailGoal.id)
              setDetailGoalId(null)
            }
          }}
          onRemoveMovement={onRemoveMovement}
        />
      ) : null}
    </div>
  )
}

function SavingsDetailModal({
  goal,
  movements,
  currency,
  memberName,
  onClose,
  onRemove,
  onRemoveMovement,
}: {
  goal: SavingsGoal
  movements: SavingsMovement[]
  currency: string
  memberName: (id?: string) => string
  onClose: () => void
  onRemove: () => void
  onRemoveMovement: (id: string) => void
}) {
  const progress = savingsProgress(goal, movements)
  const series = savingsGrowthSeries(movements, goal.id)
  const max = Math.max(...series.map((point) => point.total), goal.targetAmount, 1)

  return (
    <Modal title={goal.name} subtitle="Historial y proyección" onClose={onClose}>
      <div className="savings-detail-head">
        <ProgressRing percent={progress.percent} size={110} />
        <div>
          <p>
            {formatMoney(progress.saved, false, currency)} de{' '}
            {formatMoney(goal.targetAmount, false, currency)}
          </p>
          <p className="hint">Faltan {formatMoney(progress.remaining, false, currency)}</p>
        </div>
      </div>

      {series.length > 1 ? (
        <div className="savings-sparkline-wrap">
          <svg className="savings-sparkline" viewBox="0 0 280 80" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--teal)"
              strokeWidth="2"
              points={series
                .map((point, index) => {
                  const x = (index / Math.max(1, series.length - 1)) * 280
                  const y = 80 - (point.total / max) * 70
                  return `${x},${y}`
                })
                .join(' ')}
            />
          </svg>
        </div>
      ) : null}

      <div className="section-head">
        <h3>Depósitos</h3>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
          Quitar meta
        </button>
      </div>
      {movements.length === 0 ? (
        <p className="hint">Aún no hay depósitos en esta meta.</p>
      ) : (
        <div className="list">
          {[...movements]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((movement) => (
              <div className="statement-row" key={movement.id}>
                <div className="statement-date">{formatDate(movement.date)}</div>
                <div>
                  <div className="row-title">{memberName(movement.memberId)}</div>
                  {movement.note ? <div className="row-meta">{movement.note}</div> : null}
                </div>
                <div className="row-amount">
                  {formatMoney(movement.amount, false, currency)}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onRemoveMovement(movement.id)}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}
    </Modal>
  )
}
