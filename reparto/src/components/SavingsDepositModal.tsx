import { useMemo, useState, type FormEvent } from 'react'
import type { Member, SavingsGoal } from '../types'
import { monthKey, parseAmount, todayISO } from '../lib/format'
import { MonthPickerField } from './MonthPickerField'
import { Modal } from './Modal'

interface Props {
  goal: SavingsGoal
  members: Member[]
  defaultMemberId?: string | null
  onClose: () => void
  onSubmit: (input: {
    amount: number
    date: string
    accountingMonth: string
    memberId?: string
  }) => void
}

export function SavingsDepositModal({
  goal,
  members,
  defaultMemberId,
  onClose,
  onSubmit,
}: Props) {
  const today = todayISO()
  const isShared = goal.visibility !== 'personal'
  const defaultMember =
    members.find((member) => member.id === defaultMemberId)?.id ??
    members.find((member) => member.userUid === defaultMemberId)?.id ??
    members[0]?.id ??
    ''

  const [amount, setAmount] = useState('')
  const [depositDate, setDepositDate] = useState(today)
  const [accountingMonth, setAccountingMonth] = useState(monthKey(today))
  const [memberId, setMemberId] = useState(defaultMember)

  const canSubmit = useMemo(() => parseAmount(amount) > 0, [amount])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = parseAmount(amount)
    if (parsed <= 0) return
    onSubmit({
      amount: parsed,
      date: depositDate,
      accountingMonth,
      memberId: isShared ? memberId || undefined : defaultMember || undefined,
    })
    onClose()
  }

  return (
    <Modal title="Abonar a la meta" subtitle={goal.name} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          Monto
          <input
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej. 50000"
            required
          />
        </label>
        <MonthPickerField
          label="Mes correspondiente"
          value={accountingMonth}
          onChange={setAccountingMonth}
        />
        <label className="field">
          Fecha del depósito
          <input
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
            required
          />
        </label>
        {isShared && members.length > 0 ? (
          <label className="field">
            Quién abona
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-accent" disabled={!canSubmit}>
            Registrar abono
          </button>
        </div>
      </form>
    </Modal>
  )
}
