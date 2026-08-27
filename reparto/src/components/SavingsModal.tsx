import { useMemo, useState, type FormEvent } from 'react'
import type { Member, SavingsGoal, SavingsMovement, Space } from '../types'
import {
  overallSavingsProgress,
  savingsByMonth,
  savingsProgress,
  totalSaved,
} from '../lib/savings'
import { formatDate, formatMoney, formatMonth, parseAmount, todayISO } from '../lib/format'
import { spaceCurrency } from '../lib/currency'
import { MEMBER_COLORS } from '../types'
import { Modal } from './Modal'

interface Props {
  space: Space
  members: Member[]
  defaultMemberId?: string | null
  onAddGoal: (input: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color' | 'deadline' | 'note'>) => void
  onRemoveGoal: (goalId: string) => void
  onAddMovement: (
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (movementId: string) => void
  onClose: () => void
}

export function SavingsModal({
  space,
  members,
  defaultMemberId,
  onAddGoal,
  onRemoveGoal,
  onAddMovement,
  onRemoveMovement,
  onClose,
}: Props) {
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
  const [depositMemberId, setDepositMemberId] = useState(
    defaultMemberId ?? members[0]?.id ?? '',
  )
  const [filterGoalId, setFilterGoalId] = useState<string>('all')

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
    <Modal
      wide
      title="Ahorros"
      subtitle={`${space.name} · ${formatMoney(totalSaved(movements), false, currency)} apartados`}
      onClose={onClose}
    >
      <div className="feature-modal">
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
            {overall.target > 0 ? (
              <div className="row-meta">
                de {formatMoney(overall.target, false, currency)} objetivo
              </div>
            ) : null}
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
                      {goal.deadline ? (
                        <div className="row-meta">Objetivo: {formatDate(goal.deadline)}</div>
                      ) : null}
                      {goal.note ? <div className="row-meta">{goal.note}</div> : null}
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
              <input
                value={goalName}
                onChange={(event) => setGoalName(event.target.value)}
                placeholder="Vacaciones, fondo de emergencia…"
                required
              />
            </label>
            <label className="field">
              Objetivo ({currency})
              <input
                inputMode="decimal"
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              Fecha objetivo (opcional)
              <input
                type="date"
                value={goalDeadline}
                onChange={(event) => setGoalDeadline(event.target.value)}
              />
            </label>
            <label className="field">
              Nota (opcional)
              <input
                value={goalNote}
                onChange={(event) => setGoalNote(event.target.value)}
                placeholder="Para qué es este fondo"
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
                <select
                  value={depositGoalId}
                  onChange={(event) => setDepositGoalId(event.target.value)}
                >
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
                  onChange={(event) => setDepositAmount(event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-row">
              {members.length > 0 ? (
                <label className="field">
                  Quién aporta
                  <select
                    value={depositMemberId}
                    onChange={(event) => setDepositMemberId(event.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="field">
                Nota (opcional)
                <input
                  value={depositNote}
                  onChange={(event) => setDepositNote(event.target.value)}
                  placeholder="Transferencia, efectivo…"
                />
              </label>
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Guardar depósito
            </button>
          </form>
        ) : null}

        {movements.length > 0 ? (
          <>
            <div className="section-head">
              <h2>Historial de depósitos</h2>
              <select
                className="inline-select"
                value={filterGoalId}
                onChange={(event) => setFilterGoalId(event.target.value)}
              >
                <option value="all">Todas las metas</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="list">
              {visibleMovements.map((movement) => {
                const goal = goals.find((item) => item.id === movement.goalId)
                return (
                  <div className="statement-row" key={movement.id}>
                    <div className="statement-date">{formatDate(movement.date)}</div>
                    <div>
                      <div className="row-title">{goal?.name ?? 'Meta'}</div>
                      <div className="row-meta">
                        {memberName(movement.memberId)}
                        {movement.note ? ` · ${movement.note}` : ''}
                      </div>
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
    </Modal>
  )
}
