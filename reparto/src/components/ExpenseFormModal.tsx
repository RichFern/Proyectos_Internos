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

interface Props {
  members: Member[]
  /** Gasto existente (editar) o borrador (nuevo / repetir / plantilla) */
  initial?: Expense | ExpenseDraft | null
  mode?: 'create' | 'edit' | 'repeat' | 'template'
  defaultDate?: string
  onClose: () => void
  onSave: (input: ExpenseDraft, options: { saveAsTemplate: boolean }) => void
}

function isExpense(v: Expense | ExpenseDraft | null | undefined): v is Expense {
  return Boolean(v && 'id' in v && typeof (v as Expense).id === 'string')
}

export function ExpenseFormModal({
  members,
  initial,
  mode = 'create',
  defaultDate,
  onClose,
  onSave,
}: Props) {
  const editing = mode === 'edit' && isExpense(initial)
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
  const [splitMode, setSplitMode] = useState<SplitMode>(initial?.splitMode ?? 'income')
  const [allParticipants, setAllParticipants] = useState(
    !initial?.participantIds?.length,
  )
  const [participantIds, setParticipantIds] = useState<string[]>(
    initial?.participantIds?.length ? initial.participantIds : members.map((m) => m.id),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saveAsTemplate, setSaveAsTemplate] = useState(
    mode === 'template' || Boolean(initial && 'templateId' in initial && initial.templateId),
  )

  const titles: Record<NonNullable<Props['mode']>, { title: string; subtitle: string }> = {
    create: {
      title: 'Registrar gasto',
      subtitle: 'Quién pagó, a quién le corresponde y a dónde fue la plata',
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

  const canSubmit = useMemo(
    () =>
      description.trim() &&
      Number(amount) > 0 &&
      paidById &&
      (allParticipants || participantIds.length > 0),
    [description, amount, paidById, allParticipants, participantIds],
  )

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSave(
      {
        description: description.trim(),
        amount: Number(amount),
        category,
        paidById,
        date,
        splitMode,
        participantIds: allParticipants ? [] : participantIds,
        notes: notes.trim() || undefined,
        templateId: isExpense(initial) ? initial.templateId : undefined,
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
            placeholder="Ej. Supermercado, nafta, alquiler"
            required
          />
        </label>

        <div className="form-row">
          <label className="field">
            Monto
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

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
            <select value={paidById} onChange={(e) => setPaidById(e.target.value)} required>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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

        <div>
          <label className="field" style={{ marginBottom: '0.5rem' }}>
            Quiénes participan
          </label>
          <label className="check-pill" style={{ marginBottom: '0.55rem' }}>
            <input
              type="checkbox"
              checked={allParticipants}
              onChange={(e) => setAllParticipants(e.target.checked)}
            />
            Todos
          </label>
          {!allParticipants ? (
            <div className="check-list">
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

        <label className="field">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalle opcional: ticket, motivo, etc."
          />
        </label>

        {!editing ? (
          <label className="check-pill">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
            />
            Guardar como plantilla para repetir otros meses
          </label>
        ) : (
          <label className="check-pill">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
            />
            Actualizar / guardar plantilla con estos datos
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            Guardar gasto
          </button>
        </div>
      </form>
    </Modal>
  )
}
