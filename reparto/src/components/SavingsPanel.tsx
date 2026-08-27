import { useState, type FormEvent } from 'react'
import type { Member, SavingsGoal, SavingsMovement, Space } from '../types'
import { savingsProgress, totalSaved } from '../lib/savings'
import { formatDate, formatMoney, parseAmount, todayISO } from '../lib/format'
import { spaceCurrency } from '../lib/currency'
import { MEMBER_COLORS } from '../types'

interface Props {
  space: Space
  members: Member[]
  onAddGoal: (input: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color'>) => void
  onRemoveGoal: (goalId: string) => void
  onAddMovement: (
    input: Pick<SavingsMovement, 'goalId' | 'amount' | 'date' | 'note' | 'memberId'>,
  ) => void
  onRemoveMovement: (movementId: string) => void
}

export function SavingsPanel({
  space,
  members,
  onAddGoal,
  onRemoveGoal,
  onAddMovement,
  onRemoveMovement,
}: Props) {
  const currency = spaceCurrency(space)
  const goals = space.savingsGoals ?? []
  const movements = space.savingsMovements ?? []
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [depositGoalId, setDepositGoalId] = useState(goals[0]?.id ?? '')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')

  const addGoal = (event: FormEvent) => {
    event.preventDefault()
    const target = parseAmount(goalTarget)
    if (!goalName.trim() || Number.isNaN(target) || target <= 0) return
    onAddGoal({
      name: goalName.trim(),
      targetAmount: target,
      color: MEMBER_COLORS[goals.length % MEMBER_COLORS.length],
    })
    setGoalName('')
    setGoalTarget('')
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
      memberId: members[0]?.id,
    })
    setDepositAmount('')
    setDepositNote('')
  }

  return (
    <div className="extras-panel">
      <div className="impact-grid savings-summary">
        <div className="stat impact-card">
          <div className="stat-label">Metas activas</div>
          <div className="stat-value">{goals.length}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Total apartado</div>
          <div className="stat-value">{formatMoney(totalSaved(movements), false, currency)}</div>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty">
          <h3>Sin metas de ahorro</h3>
          <p>Crea una meta y registra cada depósito para ver el avance.</p>
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
                  <span style={{ width: `${Math.round(progress.percent * 100)}%`, background: goal.color }} />
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

      <form className="form-grid extras-form" onSubmit={addGoal}>
        <h3>Nueva meta</h3>
        <div className="form-row">
          <label className="field">
            Nombre
            <input
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Ej. Vacaciones, fondo de emergencia"
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
          <label className="field">
            Nota (opcional)
            <input
              value={depositNote}
              onChange={(event) => setDepositNote(event.target.value)}
              placeholder="Transferencia, efectivo…"
            />
          </label>
          <button type="submit" className="btn btn-secondary btn-sm">
            Guardar depósito
          </button>
        </form>
      ) : null}

      {movements.length > 0 ? (
        <>
          <div className="section-head" style={{ marginTop: '1.25rem' }}>
            <h2>Últimos depósitos</h2>
          </div>
          <div className="list">
            {movements.slice(0, 8).map((movement) => {
              const goal = goals.find((item) => item.id === movement.goalId)
              return (
                <div className="statement-row" key={movement.id}>
                  <div className="statement-date">{formatDate(movement.date)}</div>
                  <div>
                    <div className="row-title">{goal?.name ?? 'Meta'}</div>
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
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
