import { useMemo, useState, type FormEvent } from 'react'
import type { Member, PlanTier, SavingsGoal, SavingsMovement, Space } from '../types'
import {
  overallSavingsProgress,
  savingsByMonth,
  savingsProgress,
  totalSaved,
} from '../lib/savings'
import { formatDate, formatMoney, formatMonth, parseAmount, todayISO } from '../lib/format'
import { spaceCurrency } from '../lib/currency'
import { MEMBER_COLORS } from '../types'
import { PremiumGate } from './PremiumGate'
import { spaceIcon } from '../lib/spacePresets'
import { limitsFor } from '../lib/plans'

interface Props {
  spaces: Space[]
  activeSpaceId: string | null
  onSelectSpace: (id: string) => void
  planTier: PlanTier
  defaultMemberId?: string | null
  onOpenPlans?: () => void
  onAddGoal: (spaceId: string, input: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color' | 'deadline' | 'note'>) => void
  onRemoveGoal: (spaceId: string, goalId: string) => void
  onAddMovement: (
    spaceId: string,
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (spaceId: string, movementId: string) => void
}

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
        <h1>Ahorros</h1>
        <p className="brand-sub">Crea un espacio para empezar a registrar metas de ahorro.</p>
      </section>
    )
  }

  return (
    <section className="panel app-section">
      <header className="app-section-head">
        <div>
          <h1>Ahorros</h1>
          <p className="brand-sub">
            Metas y depósitos aparte de los gastos del hogar. Sección premium.
          </p>
        </div>
        <label className="field section-space-picker">
          Espacio
          <select
            value={space.id}
            onChange={(event) => onSelectSpace(event.target.value)}
          >
            {spaces.map((item) => (
              <option key={item.id} value={item.id}>
                {spaceIcon(item)} {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <PremiumGate feature="savings" planTier={planTier} onOpenPlans={onOpenPlans} />

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
  onAddGoal: (input: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color' | 'deadline' | 'note'>) => void
  onRemoveGoal: (goalId: string) => void
  onAddMovement: (
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (movementId: string) => void
}) {
  const currency = spaceCurrency(space)
  const goals = space.savingsGoals ?? []
  const movements = space.savingsMovements ?? []
  const overall = overallSavingsProgress(goals, movements)
  const monthly = savingsByMonth(movements)

  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalNote, setGoalNote] = useState('')
  const [depositGoalId, setDepositGoalId] = useState(goals[0]?.id ?? '')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [depositMemberId] = useState(
    defaultMemberId ?? members[0]?.id ?? '',
  )
  const [filterGoalId] = useState<string>('all')

  const memberName = (id?: string) =>
    members.find((member) => member.id === id)?.name ?? '—'

  const visibleMovements = useMemo(() => {
    const sorted = [...movements].sort((a, b) => b.date.localeCompare(a.date))
    if (filterGoalId === 'all') return sorted
    return sorted.filter((movement) => movement.goalId === filterGoalId)
  }, [movements, filterGoalId])

  const addGoal = (event: FormEvent) => {
    event.preventDefault()
    const target = parseAmount(goalTarget)
    if (!goalName.trim() || Number.isNaN(target) || target <= 0) return
    onAddGoal({
      name: goalName.trim(),
      targetAmount: target,
      color: MEMBER_COLORS[goals.length % MEMBER_COLORS.length],
      deadline: goalDeadline || undefined,
      note: goalNote.trim() || undefined,
    })
    setGoalName('')
    setGoalTarget('')
    setGoalDeadline('')
    setGoalNote('')
  }

  const addDeposit = (event: FormEvent) => {
    event.preventDefault()
    const amount = parseAmount(depositAmount)
    if (!depositGoalId || Number.isNaN(amount) || amount <= 0) return
    onAddMovement({
      goalId: depositGoalId,
      amount,
      date: todayISO(),
      note: depositNote.trim() || undefined,
      memberId: depositMemberId || members[0]?.id,
    })
    setDepositAmount('')
    setDepositNote('')
  }

  return (
    <div className="feature-modal">
      <p className="section-summary">
        {space.name} · {formatMoney(totalSaved(movements), false, currency)} apartados
      </p>

      <div className="impact-grid savings-summary">
        <div className="stat impact-card">
          <div className="stat-label">Total apartado</div>
          <div className="stat-value">{formatMoney(overall.saved, false, currency)}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Metas activas</div>
          <div className="stat-value">{goals.length}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Avance global</div>
          <div className="stat-value">
            {overall.target > 0 ? `${Math.round(overall.percent * 100)}%` : '—'}
          </div>
        </div>
      </div>

      {overall.target > 0 ? (
        <div className="goal-bar goal-bar-lg">
          <span
            style={{
              width: `${Math.round(overall.percent * 100)}%`,
              background: 'var(--navy)',
            }}
          />
        </div>
      ) : null}

      {goals.length === 0 ? (
        <div className="empty">
          <h3>Sin metas de ahorro</h3>
          <p>Crea una meta con monto objetivo y registra cada depósito para ver el avance.</p>
        </div>
      ) : (
        <div className="savings-goals">
          {goals.map((goal) => {
            const progress = savingsProgress(goal, movements)
            return (
              <article className="savings-card" key={goal.id}>
                <div className="savings-card-head">
                  <div>
                    <strong>{goal.name}</strong>
                    <div className="row-meta">
                      {formatMoney(progress.saved, false, currency)} de{' '}
                      {formatMoney(goal.targetAmount, false, currency)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm(`¿Quitar la meta “${goal.name}”?`)) onRemoveGoal(goal.id)
                    }}
                  >
                    Quitar
                  </button>
                </div>
                <div className="goal-bar">
                  <span
                    style={{
                      width: `${Math.round(progress.percent * 100)}%`,
                      background: goal.color,
                    }}
                  />
                </div>
                <div className="row-meta">
                  {Math.round(progress.percent * 100)}% · faltan{' '}
                  {formatMoney(progress.remaining, false, currency)}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {monthly.length > 0 ? (
        <>
          <div className="section-head">
            <h2>Depósitos por mes</h2>
          </div>
          <div className="monthly-savings">
            {monthly.slice(0, 6).map((row) => (
              <div className="monthly-savings-row" key={row.month}>
                <span>{formatMonth(row.month)}</span>
                <strong>{formatMoney(row.amount, false, currency)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <form className="form-grid extras-form" onSubmit={addGoal}>
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
        <button type="submit" className="btn btn-primary btn-sm">
          Crear meta
        </button>
      </form>

      {goals.length > 0 ? (
        <form className="form-grid extras-form" onSubmit={addDeposit}>
          <h3>Registrar depósito</h3>
          <div className="form-row">
            <label className="field">
              Meta
              <select value={depositGoalId} onChange={(e) => setDepositGoalId(e.target.value)}>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Monto ({currency})
              <input
                inputMode="decimal"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Guardar depósito
          </button>
        </form>
      ) : null}

      {visibleMovements.length > 0 ? (
        <>
          <div className="section-head">
            <h2>Historial</h2>
          </div>
          <div className="list">
            {visibleMovements.map((movement) => {
              const goal = goals.find((item) => item.id === movement.goalId)
              return (
                <div className="statement-row" key={movement.id}>
                  <div className="statement-date">{formatDate(movement.date)}</div>
                  <div>
                    <div className="row-title">{goal?.name ?? 'Meta'}</div>
                    <div className="row-meta">{memberName(movement.memberId)}</div>
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
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
