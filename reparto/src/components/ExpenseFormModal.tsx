import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  Member,
  SplitMode,
  Space,
} from '../types'
import { categoriesForSpace } from '../lib/categories'
import { compressReceipt, loadReceiptUrl } from '../lib/receipts'
import {
  dateInShiftedMonth,
  monthKey,
  parseAmount,
  shiftMonth,
  todayISO,
} from '../lib/format'
import { suggestFromHistory } from '../lib/memory'
import {
  OTHER_PAYMENT_METHOD,
  allPaymentMethods,
} from '../lib/paymentMethods'
import { COMMON_CURRENCIES } from '../lib/currency'
import { Modal } from './Modal'
import { MonthPickerField } from './MonthPickerField'

export type ExpenseSaveOptions = {
  saveAsTemplate: boolean
  receipt?: Blob | 'remove'
  moveToSpaceId?: string
  /** Si viene, crear plan de cuotas en vez de un solo gasto */
  installment?: {
    totalAmount: number
    installmentCount: number
    startDate: string
  }
}

interface Props {
  members: Member[]
  customCategories?: Space['customCategories']
  paymentMethods?: Space['paymentMethods']
  previousExpenses?: Expense[]
  spaces?: { id: string; name: string }[]
  currentSpaceId?: string
  onAddCategory?: (label: string) => string
  onAddPaymentMethod?: (label: string) => string
  initial?: Expense | ExpenseDraft | null
  mode?: 'create' | 'edit' | 'repeat' | 'template'
  defaultDate?: string
  currentUserUid?: string | null
  allowInstallments?: boolean
  allowMulticurrency?: boolean
  allowReceiptScan?: boolean
  allowExpenseSplit?: boolean
  spaceCurrency?: string
  defaultSplitMode?: SplitMode
  defaultCategory?: ExpenseCategory
  requiresIncome?: boolean
  emphasizeEqualSplit?: boolean
  spaceKind?: Space['kind']
  onClose: () => void
  onSave: (input: ExpenseDraft, options: ExpenseSaveOptions) => void
}

function isExpense(v: Expense | ExpenseDraft | null | undefined): v is Expense {
  return Boolean(v && 'id' in v && typeof (v as Expense).id === 'string')
}

export function ExpenseFormModal({
  members,
  customCategories,
  paymentMethods,
  previousExpenses = [],
  spaces = [],
  currentSpaceId,
  onAddCategory,
  onAddPaymentMethod,
  initial,
  mode = 'create',
  defaultDate,
  currentUserUid,
  allowInstallments = true,
  allowMulticurrency = false,
  allowReceiptScan = false,
  allowExpenseSplit = true,
  spaceCurrency: baseCurrency = 'CLP',
  defaultSplitMode = 'income',
  defaultCategory = 'comida',
  requiresIncome = true,
  emphasizeEqualSplit = false,
  spaceKind,
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
  const [category, setCategory] = useState<ExpenseCategory>(
    initial?.category ?? defaultCategory,
  )
  const [paidById, setPaidById] = useState(initial?.paidById ?? members[0]?.id ?? '')
  const [date, setDate] = useState(
    mode === 'repeat' || mode === 'template'
      ? (defaultDate ?? todayISO())
      : (initial?.date ?? defaultDate ?? todayISO()),
  )
  const [accountingMonth, setAccountingMonth] = useState(
    initial && 'accountingMonth' in initial && initial.accountingMonth
      ? initial.accountingMonth
      : monthKey(
          mode === 'repeat' || mode === 'template'
            ? (defaultDate ?? todayISO())
            : (initial?.date ?? defaultDate ?? todayISO()),
        ),
  )
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>(
    initial?.splitMode ?? defaultSplitMode,
  )
  const [customShares, setCustomShares] = useState<Record<string, number>>(
    initial?.customShares ?? {},
  )
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

  const currentMemberId = useMemo(
    () =>
      members.find((member) => member.userUid === currentUserUid)?.id ??
      members.find((member) => member.id === currentUserUid)?.id ??
      members[0]?.id ??
      '',
    [members, currentUserUid],
  )

  useEffect(() => {
    if (allowExpenseSplit) return
    if (!currentMemberId) return
    setPaidById(currentMemberId)
    setShareMode('personal')
    setParticipantIds([currentMemberId])
    setSplitMode('equal')
  }, [allowExpenseSplit, currentMemberId])

  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saveAsTemplate, setSaveAsTemplate] = useState(
    mode === 'template' || Boolean(initial && 'templateId' in initial && initial.templateId),
  )
  const [asInstallment, setAsInstallment] = useState(false)
  const [installmentCount, setInstallmentCount] = useState('3')
  const [installmentTotal, setInstallmentTotal] = useState('')
  const [creditChargeTiming, setCreditChargeTiming] = useState<'current' | 'next'>('current')
  const [provisional, setProvisional] = useState(Boolean(initial && 'provisional' in initial && initial.provisional))
  const [paymentMethod, setPaymentMethod] = useState(
    initial && 'paymentMethod' in initial ? (initial.paymentMethod ?? '') : '',
  )
  const [expenseCurrencyCode, setExpenseCurrencyCode] = useState(
    initial && 'currency' in initial && initial.currency ? initial.currency : baseCurrency,
  )
  const [customPayment, setCustomPayment] = useState('')
  const [moveToSpaceId, setMoveToSpaceId] = useState(currentSpaceId ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [memoryHint, setMemoryHint] = useState<string | null>(null)
  const [categoryTouched, setCategoryTouched] = useState(Boolean(initial?.category))
  const categories = categoriesForSpace(
    spaceKind ? { kind: spaceKind, customCategories } : undefined,
  )
  const methods = allPaymentMethods({ paymentMethods })
  const isCredit = paymentMethod === 'Crédito'

  useEffect(() => {
    if (!isCredit) {
      setAsInstallment(false)
      setCreditChargeTiming('current')
    }
  }, [isCredit])

  useEffect(() => {
    if (!editing || !initial.hasReceipt) return
    let url: string | null = null
    let cancelled = false
    void loadReceiptUrl(initial.id).then((loaded) => {
      if (cancelled || !loaded) return
      url = loaded
      setReceiptPreview(loaded)
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [editing, initial])

  useEffect(() => {
    if (mode === 'edit') return
    const suggestion = suggestFromHistory(previousExpenses, description)
    if (!suggestion) {
      setMemoryHint(null)
      return
    }
    if (!categoryTouched) setCategory(suggestion.category)
    setMemoryHint(`Sugerencia: ${suggestion.matchedDescription} → ${suggestion.category}`)
  }, [description, previousExpenses, mode, categoryTouched, category])

  const titles: Record<NonNullable<Props['mode']>, { title: string; subtitle: string }> = {
    create: {
      title: 'Registrar gasto',
      subtitle: 'Qué se pagó, cuánto, quién y con quién se comparte',
    },
    edit: {
      title: 'Editar gasto',
      subtitle: 'Actualiza monto, descripción o quién pagó',
    },
    repeat: {
      title: 'Repetir gasto',
      subtitle: 'Misma descripción; puedes cambiar el monto de este mes',
    },
    template: {
      title: 'Usar plantilla',
      subtitle: 'Carga el monto de este mes y guarda',
    },
  }

  const resolvedParticipants = useMemo(() => {
    if (shareMode === 'all') return [] as string[]
    if (shareMode === 'personal') return paidById ? [paidById] : []
    return participantIds
  }, [shareMode, paidById, participantIds])

  const customParticipants = useMemo(() => {
    if (shareMode === 'all') return members
    if (shareMode === 'custom') {
      return members.filter((member) => participantIds.includes(member.id))
    }
    return []
  }, [shareMode, members, participantIds])

  const customTotal = customParticipants.reduce(
    (sum, member) => sum + (customShares[member.id] ?? 0),
    0,
  )

  const canSubmit = useMemo(() => {
    if (!description.trim() || !paidById) return false
    if (
      splitMode === 'custom' &&
      shareMode !== 'personal' &&
      Math.abs(customTotal - 100) > 0.01
    ) {
      return false
    }
    if (asInstallment && !editing) {
      const total = parseAmount(installmentTotal || amount)
      const count = Number(installmentCount)
      return total > 0 && count >= 2
    }
    return parseAmount(amount) > 0 && (shareMode !== 'custom' || participantIds.length > 0)
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
    splitMode,
    customTotal,
  ])

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const resolvedPaymentMethod = () => {
    if (paymentMethod === OTHER_PAYMENT_METHOD) {
      const added = onAddPaymentMethod?.(customPayment)
      return added || customPayment.trim() || undefined
    }
    return paymentMethod || undefined
  }

  const draftFields = (): Omit<
    ExpenseDraft,
    'amount' | 'date' | 'dueDate' | 'notes' | 'templateId' | 'hasReceipt'
  > &
    Pick<ExpenseDraft, 'date' | 'dueDate' | 'notes'> => ({
    description: description.trim(),
    category,
    paidById,
    date,
    dueDate: dueDate || undefined,
    splitMode: !allowExpenseSplit || shareMode === 'personal' ? 'equal' : splitMode,
    participantIds: !allowExpenseSplit
      ? currentMemberId
        ? [currentMemberId]
        : resolvedParticipants
      : resolvedParticipants,
    customShares: allowExpenseSplit && splitMode === 'custom' ? customShares : undefined,
    visibility: !allowExpenseSplit || shareMode === 'personal' ? 'personal' : 'shared',
    ownerUid: !allowExpenseSplit || shareMode === 'personal' ? currentUserUid : null,
    notes: notes.trim() || undefined,
    paymentMethod: resolvedPaymentMethod(),
    provisional,
    accountingMonth:
      isCredit && !asInstallment
        ? creditChargeTiming === 'next'
          ? shiftMonth(monthKey(date), 1)
          : monthKey(date)
        : accountingMonth && accountingMonth !== monthKey(date)
          ? accountingMonth
          : undefined,
    currency:
      allowMulticurrency && expenseCurrencyCode !== baseCurrency
        ? expenseCurrencyCode
        : undefined,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const startDate =
      isCredit && creditChargeTiming === 'next'
        ? dateInShiftedMonth(dueDate || date, 1)
        : dueDate || date

    if (asInstallment && !editing) {
      const total = parseAmount(installmentTotal || amount)
      const count = Math.floor(Number(installmentCount))
      onSave(
        {
          ...draftFields(),
          amount: total / count,
          dueDate: dueDate || startDate,
          templateId: isExpense(initial) ? initial.templateId : undefined,
        },
        {
          saveAsTemplate: false,
          receipt: receiptBlob ?? (removeReceipt ? 'remove' : undefined),
          installment: {
            totalAmount: total,
            installmentCount: count,
            startDate,
          },
        },
      )
      onClose()
      return
    }

    onSave(
      {
        ...draftFields(),
        amount: parseAmount(amount),
        templateId: isExpense(initial) ? initial.templateId : undefined,
        installmentPlanId: isExpense(initial) ? initial.installmentPlanId : undefined,
        installmentNumber: isExpense(initial) ? initial.installmentNumber : undefined,
        installmentTotal: isExpense(initial) ? initial.installmentTotal : undefined,
        hasReceipt:
          Boolean(receiptBlob) ||
          (isExpense(initial) && initial.hasReceipt && !removeReceipt),
      },
      {
        saveAsTemplate,
        receipt: receiptBlob ?? (removeReceipt ? 'remove' : undefined),
        moveToSpaceId:
          editing && moveToSpaceId && moveToSpaceId !== currentSpaceId
            ? moveToSpaceId
            : undefined,
      },
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
            placeholder="Ej. Luz, supermercado, combustible"
            autoComplete="off"
            enterKeyHint="next"
            required
          />
        </label>
        {memoryHint ? <p className="hint memory-hint">{memoryHint}</p> : null}

        <div className="form-row">
          <label className="field">
            {asInstallment ? 'Monto de cada cuota (opcional)' : 'Monto'}
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              enterKeyHint="next"
              required={!asInstallment}
            />
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

        {!allowExpenseSplit ? (
          <p className="hint">
            Plan Básico: este gasto se registra al 100% para ti, sin reparto.
          </p>
        ) : (
          <>
            <ShareFields
              members={members}
              shareMode={shareMode}
              setShareMode={setShareMode}
              paidById={paidById}
              setParticipantIds={setParticipantIds}
              participantIds={participantIds}
              toggleParticipant={toggleParticipant}
            />
            {shareMode !== 'personal' ? (
              <label className="field">
                Cómo se reparte
                <select
                  value={splitMode}
                  onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                >
                  <option value="equal">
                    {members.length === 2
                      ? 'En partes iguales (50/50)'
                      : 'En partes iguales'}
                  </option>
                  <option value="custom">Porcentajes manuales</option>
                  {requiresIncome ? (
                    <option value="income">Proporcional al ingreso</option>
                  ) : null}
                </select>
              </label>
            ) : null}
            {shareMode !== 'personal' && splitMode === 'custom' ? (
              <div className="custom-shares">
                <div className="section-head">
                  <h3>Porcentaje que aporta cada uno</h3>
                  <span
                    className={`chip${Math.abs(customTotal - 100) < 0.01 ? ' valid' : ''}`}
                  >
                    {customTotal}% de 100%
                  </span>
                </div>
                <div className="custom-share-grid">
                  {customParticipants.map((member) => (
                    <label className="field" key={member.id}>
                      {member.name}
                      <div className="percent-input">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={customShares[member.id] ?? ''}
                          onChange={(event) =>
                            setCustomShares((previous) => ({
                              ...previous,
                              [member.id]: Number(event.target.value),
                            }))
                          }
                          required
                        />
                        <span>%</span>
                      </div>
                    </label>
                  ))}
                </div>
                {Math.abs(customTotal - 100) > 0.01 ? (
                  <p className="form-error">
                    Los porcentajes deben sumar exactamente 100%.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="form-row">
          <label className="field">
            Categoría
            <select
              value={category}
              onChange={(e) => {
                setCategoryTouched(true)
                setCategory(e.target.value as ExpenseCategory)
              }}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Medio de pago
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">Sin especificar</option>
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {allowMulticurrency ? (
            <label className="field">
              Moneda del gasto
              <select
                value={expenseCurrencyCode}
                onChange={(event) => setExpenseCurrencyCode(event.target.value)}
              >
                {COMMON_CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {paymentMethod === OTHER_PAYMENT_METHOD ? (
          <label className="field">
            Nombre del medio
            <input
              value={customPayment}
              onChange={(e) => setCustomPayment(e.target.value)}
              placeholder="Ej. Mercado Pago"
            />
          </label>
        ) : null}

        {isCredit && !editing && allowInstallments ? (
          <div className="credit-options form-grid">
            <label className="check-pill">
              <input
                type="checkbox"
                checked={asInstallment}
                onChange={(event) => setAsInstallment(event.target.checked)}
              />
              Pagar en cuotas
            </label>
            {asInstallment ? (
              <div className="form-row">
                <label className="field">
                  Monto total
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={installmentTotal}
                    onChange={(event) => setInstallmentTotal(event.target.value)}
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
                    onChange={(event) => setInstallmentCount(event.target.value)}
                    required
                  />
                </label>
              </div>
            ) : null}
            <fieldset className="charge-timing">
              <legend>Cargo en el estado de cuenta</legend>
              <label className="check-pill">
                <input
                  type="radio"
                  name="creditChargeTiming"
                  checked={creditChargeTiming === 'current'}
                  onChange={() => setCreditChargeTiming('current')}
                />
                Este mes
              </label>
              <label className="check-pill">
                <input
                  type="radio"
                  name="creditChargeTiming"
                  checked={creditChargeTiming === 'next'}
                  onChange={() => setCreditChargeTiming('next')}
                />
                Mes siguiente
              </label>
            </fieldset>
          </div>
        ) : null}

        <label className="field">
          Foto del ticket
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={!allowReceiptScan}
            onChange={(event) => {
              if (!allowReceiptScan) return
              const file = event.target.files?.[0]
              if (!file) return
              void compressReceipt(file).then((blob) => {
                setReceiptBlob(blob)
                setRemoveReceipt(false)
                setReceiptPreview((prev) => {
                  if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
                  return URL.createObjectURL(blob)
                })
              })
            }}
          />
          {!allowReceiptScan ? (
            <span className="hint">Escaneo de comprobantes — disponible en Premium.</span>
          ) : null}
        </label>
        {receiptPreview && !removeReceipt ? (
          <div className="receipt-preview">
            <img src={receiptPreview} alt="Ticket" />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setReceiptBlob(null)
                setRemoveReceipt(true)
              }}
            >
              Quitar foto
            </button>
          </div>
        ) : null}

        <details
          className="more-options"
          open={
            asInstallment ||
            saveAsTemplate ||
            Boolean(dueDate) ||
            (!emphasizeEqualSplit && splitMode !== defaultSplitMode) ||
            Boolean(notes) ||
            provisional ||
            accountingMonth !== monthKey(date)
          }
        >
          <summary>Más opciones</summary>
          <div className="form-grid" style={{ marginTop: '0.2rem' }}>
            {onAddCategory ? (
              <label className="field">
                Nueva categoría
                <div className="inline-control">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ej. Farmacia"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const id = onAddCategory(newCategory)
                      if (id) {
                        setCategoryTouched(true)
                        setCategory(id)
                        setNewCategory('')
                      }
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </label>
            ) : null}

            <div className="form-row">
              <label className="field">
                Fecha de transacción
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const next = e.target.value
                    setDate(next)
                    if (accountingMonth === monthKey(date)) {
                      setAccountingMonth(monthKey(next))
                    }
                  }}
                  required
                />
              </label>
              <MonthPickerField
                value={accountingMonth}
                onChange={setAccountingMonth}
              />
            </div>
            <p className="hint">
            Si el pago cae a fin de mes y corresponde al siguiente, cambia solo el mes contable.
          </p>

            <label className="field">
              Vencimiento (opcional)
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <label className="check-pill">
              <input
                type="checkbox"
                checked={provisional}
                onChange={(e) => setProvisional(e.target.checked)}
              />
              Gasto provisorio (estimado, aún no llegó)
            </label>

            {editing && spaces.length > 1 ? (
              <label className="field">
                Mover a otro espacio
                <select
                  value={moveToSpaceId}
                  onChange={(e) => setMoveToSpaceId(e.target.value)}
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="field">
              Notas
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ticket, motivo…"
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
                  ? 'Guardar como plantilla'
                  : 'Repetir otros meses (plantilla)'}
              </label>
            ) : null}
          </div>
        </details>

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

function ShareFields({
  members,
  shareMode,
  setShareMode,
  paidById,
  setParticipantIds,
  participantIds,
  toggleParticipant,
}: {
  members: Member[]
  shareMode: 'all' | 'personal' | 'custom'
  setShareMode: (mode: 'all' | 'personal' | 'custom') => void
  paidById: string
  setParticipantIds: (ids: string[] | ((prev: string[]) => string[])) => void
  participantIds: string[]
  toggleParticipant: (id: string) => void
}) {
  return (
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
          Solo quien pagó
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
  )
}
