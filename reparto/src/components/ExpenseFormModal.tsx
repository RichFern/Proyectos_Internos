import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  Member,
  SplitMode,
} from '../types'
import { CATEGORY_LABELS } from '../types'
import { todayISO } from '../lib/format'
import { Modal } from './Modal'

export type ExpenseSaveOptions = {
  saveAsTemplate: boolean
  /** Si viene, crear plan de cuotas en vez de un solo gasto */
  installment?: {
    totalAmount: number
    installmentCount: number
    startDate: string
  }
}

interface Props {
  members: Member[]
  initial?: Expense | ExpenseDraft | null
  mode?: 'create' | 'edit' | 'repeat' | 'template'
  defaultDate?: string
  currentUserUid?: string | null
  allowInstallments?: boolean
  onClose: () => void
  onSave: (input: ExpenseDraft, options: ExpenseSaveOptions) => void
}

function isExpense(v: Expense | ExpenseDraft | null | undefined): v is Expense {
  return Boolean(v && 'id' in v && typeof (v as Expense).id === 'string')
}

export function ExpenseFormModal({
  members,
  initial,
  mode = 'create',
  defaultDate,
  currentUserUid,
  allowInstallments = true,
  onClose,
  onSave,
}: Props) {
  const editing = mode === 'edit' && isExpense(initial)
  const initialPersonal =
    Boolean(initial?.participantIds?.length === 1) &&
    initial?.participantIds?.[0] === initial?.paidById

  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(
    initial?.amount && initial.amount > 0 ? String(initial.amount) : '',
  )
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? 'comida')
  const [paidById, setPaidById] = useState(initial?.paidById ?? members[0]?.id ?? '')
  const [date, setDate] = useState(
    mode === 'repeat' || mode === 'template'
      ? (defaultDate ?? todayISO())
      : (initial?.date ?? defaultDate ?? todayISO()),
  )
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>(initial?.splitMode ?? 'income')
  const [shareMode, setShareMode] = useState<'all' | 'personal' | 'custom'>(
    initialPersonal
      ? 'personal'
      : !initial?.participantIds?.length
        ? 'all'
        : 'custom',
  )
  const [participantIds, setParticipantIds] = useState<string[]>(
    initial?.participantIds?.length ? initial.participantIds : members.map((m) => m.id),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saveAsTemplate, setSaveAsTemplate] = useState(
    mode === 'template' || Boolean(initial && 'templateId' in initial && initial.templateId),
  )
  const [asInstallment, setAsInstallment] = useState(false)
  const [installmentCount, setInstallmentCount] = useState('3')
  const [installmentTotal, setInstallmentTotal] = useState('')

  const titles: Record<NonNullable<Props['mode']>, { title: string; subtitle: string }> = {
    create: {
      title: 'Registrar gasto',
      subtitle: 'Quién pagó, si es personal o compartido, cuotas y vencimiento',
    },
    edit: {
      title: 'Editar gasto',
      subtitle: 'Actualizá monto, descripción o quién pagó',
    },
    repeat: {
      title: 'Repetir gasto',
      subtitle: 'Misma descripción; podés cambiar el monto de este mes',
    },
    template: {
      title: 'Usar plantilla',
      subtitle: 'Cargá el monto de este mes y guardá',
    },
  }

  const resolvedParticipants = useMemo(() => {
    if (shareMode === 'all') return [] as string[]
    if (shareMode === 'personal') return paidById ? [paidById] : []
    return participantIds
  }, [shareMode, paidById, participantIds])

  const canSubmit = useMemo(() => {
    if (!description.trim() || !paidById) return false
    if (asInstallment && !editing) {
      const total = Number(installmentTotal || amount)
      const count = Number(installmentCount)
      return total > 0 && count >= 2
    }
    return Number(amount) > 0 && (shareMode !== 'custom' || participantIds.length > 0)
  }, [
    description,
    paidById,
    asInstallment,
    editing,
    installmentTotal,
    amount,
    installmentCount,
    shareMode,
    participantIds,
  ])

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    if (asInstallment && !editing) {
      const total = Number(installmentTotal || amount)
      const count = Math.floor(Number(installmentCount))
      onSave(
        {
          description: description.trim(),
          amount: total / count,
          category,
          paidById,
          date,
          dueDate: dueDate || date,
          splitMode: shareMode === 'personal' ? 'equal' : splitMode,
          participantIds: resolvedParticipants,
          visibility: shareMode === 'personal' ? 'personal' : 'shared',
          ownerUid: shareMode === 'personal' ? currentUserUid : null,
          notes: notes.trim() || undefined,
          templateId: isExpense(initial) ? initial.templateId : undefined,
        },
        {
          saveAsTemplate: false,
          installment: {
            totalAmount: total,
            installmentCount: count,
            startDate: dueDate || date,
          },
        },
      )
      onClose()
      return
    }

    onSave(
      {
        description: description.trim(),
        amount: Number(amount),
        category,
        paidById,
        date,
        dueDate: dueDate || undefined,
        splitMode: shareMode === 'personal' ? 'equal' : splitMode,
        participantIds: resolvedParticipants,
        visibility: shareMode === 'personal' ? 'personal' : 'shared',
        ownerUid: shareMode === 'personal' ? currentUserUid : null,
        notes: notes.trim() || undefined,
        templateId: isExpense(initial) ? initial.templateId : undefined,
        installmentPlanId: isExpense(initial) ? initial.installmentPlanId : undefined,
        installmentNumber: isExpense(initial) ? initial.installmentNumber : undefined,
        installmentTotal: isExpense(initial) ? initial.installmentTotal : undefined,
      },
      { saveAsTemplate },
    )
    onClose()
  }

  return (
    <Modal
      title={titles[mode].title}
      subtitle={titles[mode].subtitle}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          Descripción
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Supermercado, nafta, heladera"
            required
          />
        </label>

        <div className="form-row">
          <label className="field">
            {asInstallment ? 'Monto de cada cuota (opcional)' : 'Monto'}
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required={!asInstallment}
            />
          </label>
          <label className="field">
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        <label className="field">
          Vencimiento (opcional)
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <p className="hint">Sirve para servicios o cuotas: verás alertas en el resumen.</p>

        <div className="form-row">
          <label className="field">
            Categoría
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Quién pagó
            <select
              value={paidById}
              onChange={(e) => {
                const id = e.target.value
                setPaidById(id)
                if (shareMode === 'personal') setParticipantIds([id])
              }}
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="field" style={{ marginBottom: '0.5rem' }}>
            ¿Quiénes lo comparten?
          </label>
          <div className="check-list">
            <label className="check-pill">
              <input
                type="radio"
                name="shareMode"
                checked={shareMode === 'all'}
                onChange={() => setShareMode('all')}
              />
              Todos
            </label>
            <label className="check-pill">
              <input
                type="radio"
                name="shareMode"
                checked={shareMode === 'personal'}
                onChange={() => {
                  setShareMode('personal')
                  setParticipantIds(paidById ? [paidById] : [])
                }}
              />
              Solo quien pagó (no se reparte)
            </label>
            <label className="check-pill">
              <input
                type="radio"
                name="shareMode"
                checked={shareMode === 'custom'}
                onChange={() => setShareMode('custom')}
              />
              Algunas personas
            </label>
          </div>
          {shareMode === 'custom' ? (
            <div className="check-list" style={{ marginTop: '0.55rem' }}>
              {members.map((m) => (
                <label key={m.id} className="check-pill">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(m.id)}
                    onChange={() => toggleParticipant(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {shareMode !== 'personal' ? (
          <label className="field">
            Cómo se reparte
            <select
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as SplitMode)}
            >
              <option value="income">En proporción al ingreso</option>
              <option value="equal">Partes iguales</option>
            </select>
          </label>
        ) : null}

        {!editing && allowInstallments ? (
          <div className="month-income-box">
            <label className="check-pill">
              <input
                type="checkbox"
                checked={asInstallment}
                onChange={(e) => setAsInstallment(e.target.checked)}
              />
              Compra en cuotas
            </label>
            {asInstallment ? (
              <div className="form-row" style={{ marginTop: '0.65rem' }}>
                <label className="field">
                  Monto total
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={installmentTotal}
                    onChange={(e) => setInstallmentTotal(e.target.value)}
                    placeholder={amount || '600000'}
                    required
                  />
                </label>
                <label className="field">
                  Cantidad de cuotas
                  <input
                    type="number"
                    min={2}
                    max={48}
                    step={1}
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    required
                  />
                </label>
              </div>
            ) : null}
            {asInstallment ? (
              <p className="hint">
                Se crean todas las cuotas con vencimiento mes a mes a partir de la
                fecha de vencimiento (o la fecha del gasto).
              </p>
            ) : null}
          </div>
        ) : null}

        <label className="field">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalle opcional: ticket, motivo, etc."
          />
        </label>

        {!asInstallment ? (
          <label className="check-pill">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
            />
            {editing
              ? 'Actualizar / guardar plantilla con estos datos'
              : 'Guardar como plantilla para repetir otros meses'}
          </label>
        ) : null}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {asInstallment && !editing ? 'Crear cuotas' : 'Guardar gasto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
