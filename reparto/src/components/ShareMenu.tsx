import { useEffect, useRef, useState } from 'react'
import type { Member, Space } from '../types'
import type { MonthFilter } from '../lib/months'
import {
  exportMonthCsv,
  exportMonthPdf,
  monthShareText,
  openWhatsApp,
  personBalanceText,
  personDetailText,
  settlementsShareText,
} from '../lib/export'

interface Props {
  space: Space
  month: MonthFilter
  members: Member[]
  memberName: (id: string) => string
  disabled?: boolean
  allowExport?: boolean
}

export function ShareMenu({
  space,
  month,
  members,
  memberName,
  disabled = false,
  allowExport = true,
}: Props) {
  const [open, setOpen] = useState(false)
  const [personId, setPersonId] = useState(members[0]?.id ?? '')
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedPersonId = members.some((member) => member.id === personId)
    ? personId
    : (members[0]?.id ?? '')

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const send = (text: string | null) => {
    if (!text) return
    openWhatsApp(text)
    setOpen(false)
  }

  const copyMonth = async () => {
    const text = monthShareText(space, month, memberName)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      send(text)
    }
  }

  return (
    <div className="share-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        WhatsApp
      </button>
      {open ? (
        <div className="share-dropdown">
          <p className="share-title">Enviar por WhatsApp</p>
          <button
            type="button"
            className="share-item"
            onClick={() => send(monthShareText(space, month, memberName))}
          >
            <strong>Detalle completo</strong>
            <span>Gastos, total y cómo saldar</span>
          </button>
          <button
            type="button"
            className="share-item"
            onClick={() => send(settlementsShareText(space, month))}
          >
            <strong>Cómo saldar</strong>
            <span>Solo quién le transfiere a quién</span>
          </button>
          {members.length > 0 ? (
            <>
              <label className="field share-person">
                Persona
                <select
                  value={selectedPersonId}
                  onChange={(event) => setPersonId(event.target.value)}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="share-item"
                onClick={() => send(personBalanceText(space, month, selectedPersonId))}
              >
                <strong>Saldo de esa persona</strong>
                <span>Pagó, le corresponde y neto</span>
              </button>
              <button
                type="button"
                className="share-item"
                onClick={() => send(personDetailText(space, month, selectedPersonId))}
              >
                <strong>Detalle de esa persona</strong>
                <span>Saldo más lo que pagó</span>
              </button>
            </>
          ) : null}
          <button type="button" className="share-item" onClick={() => void copyMonth()}>
            <strong>{copied ? 'Copiado' : 'Copiar el mes'}</strong>
            <span>Para pegarlo donde quieras</span>
          </button>
          {allowExport ? (
            <div className="share-extra">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  exportMonthPdf(space, month, memberName)
                  setOpen(false)
                }}
              >
                PDF
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  exportMonthCsv(space, month, memberName)
                  setOpen(false)
                }}
              >
                CSV
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
