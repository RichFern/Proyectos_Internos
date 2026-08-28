import { useMemo, useState, type FormEvent } from 'react'
import type { Member, PlanTier, SavingsGoal, SavingsMovement, Space } from '../types'
import {
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
    <section className="panel app-section savings-section">
      <header className="app-section-head">
        <div>
          <h1>Metas de Ahorro</h1>
          <p className="brand-sub">
            Metas y proyectos del hogar — independientes de tus espacios de gastos.
            Separa lo compartido de lo personal.
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
  const myMemberId =
    members.find((member) => member.userUid === defaultMemberId)?.id ??
    members[0]?.id ??
    null

  const [tab, setTab] = useState<SavingsTab>('shared')
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
    setName('')
    setTarget('')
    setDeadline('')
  }

  const submitQuickDeposit = () => {
    if (!quickDepositGoalId) return
    const amount = parseAmount(quickAmount)
    if (amount <= 0) return
    onAddMovement({
      goalId: quickDepositGoalId,
      amount,
      date: todayISO(),
      memberId: myMemberId ?? undefined,
    })
    setQuickAmount('')
    setQuickDepositGoalId(null)
  }

  return (
    <>
      <div className="savings-tabs">
        <button
          type="button"
          className={`chip${tab === 'shared' ? ' active' : ''}`}
          onClick={() => setTab('shared')}
        >
          Ahorros familiares
        </button>
        <button
          type="button"
          className={`chip${tab === 'personal' ? ' active' : ''}`}
          onClick={() => setTab('personal')}
        >
          Mis ahorros personales
        </button>
      </div>

      {visibleGoals.length === 0 ? (
        <div className="empty">
          <h3>Sin metas todavía</h3>
          <p>Crea una meta {tab === 'shared' ? 'compartida' : 'personal'} para empezar.</p>
        </div>
      ) : (
        <div className="savings-card-grid">
          {visibleGoals.map((goal) => {
            const { saved, percent } = savingsProgress(goal, movements)
            const monthly = monthlySavingsNeeded(goal, movements, todayISO())
            return (
              <article className="savings-card" key={goal.id}>
                <button
                  type="button"
                  className="savings-card-main"
                  onClick={() => setDetailGoalId(goal.id)}
                >
                  <ProgressRing percent={percent} size={88} />
                  <div>
                    <h3>{goal.name}</h3>
                    <p className="row-meta">
                      {money(saved)} / {money(goal.targetAmount)}
                    </p>
                    {monthly ? (
                      <p className="hint savings-projection">
                        Para la meta: {money(monthly)}/mes
                      </p>
                    ) : null}
                  </div>
                </button>
                <button
                  type="button"
                  className="savings-quick-add"
                  aria-label={`Abonar a ${goal.name}`}
                  onClick={() => {
                    setQuickDepositGoalId(goal.id)
                    setQuickAmount('')
                  }}
                >
                  +
                </button>
              </article>
            )
          })}
        </div>
      )}

      <form className="savings-create-form panel-pad" onSubmit={submitGoal}>
        <h2>Nueva meta</h2>
        <div className="form-grid">
          <label className="field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            Monto objetivo
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
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
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Crear meta
        </button>
      </form>

      {quickDepositGoalId ? (
        <Modal
          title="Abono rápido"
          onClose={() => setQuickDepositGoalId(null)}
        >
          <label className="field">
            Monto
            <input
              inputMode="decimal"
              autoFocus
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setQuickDepositGoalId(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={submitQuickDeposit}>
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
        <ProgressRing percent={percent} size={120} />
        <div>
          <p>
            <strong>{money(saved)}</strong> de {money(goal.targetAmount)}
          </p>
          {goal.deadline ? <p className="row-meta">Meta: {formatDate(goal.deadline)}</p> : null}
          {monthly ? (
            <p className="hint">Necesitan ahorrar {money(monthly)} mensuales para llegar a tiempo.</p>
          ) : null}
        </div>
      </div>
      {series.length > 1 ? (
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
      ) : null}
      <h3>Historial de abonos</h3>
      {movements.length === 0 ? (
        <p className="hint">Aún no hay abonos registrados.</p>
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
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
