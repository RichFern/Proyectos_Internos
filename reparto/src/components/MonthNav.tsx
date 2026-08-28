import { useEffect, useRef, useState } from 'react'
import type { MonthFilter } from '../lib/months'
import { monthsByYear } from '../lib/months'
import { currentMonth, formatMonthName, formatMonthShort, shiftMonth } from '../lib/format'

interface Props {
  month: MonthFilter
  months: string[]
  counts?: Record<string, number>
  onChange: (month: MonthFilter) => void
  canAccessMonth?: (monthKey: string) => boolean
  onHistoryBlocked?: () => void
}

export function MonthNav({
  month,
  months,
  counts = {},
  onChange,
  canAccessMonth,
  onHistoryBlocked,
}: Props) {
  const now = currentMonth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const tryChange = (value: MonthFilter) => {
    const key = value === 'all' ? 'all' : value
    if (canAccessMonth && !canAccessMonth(key)) {
      onHistoryBlocked?.()
      return
    }
    onChange(value)
    setOpen(false)
  }

  const go = (delta: number) => {
    setOpen(false)
    let next: MonthFilter
    if (month === 'all') {
      next = delta < 0 ? shiftMonth(now, -1) : now
    } else {
      next = shiftMonth(month, delta)
    }
    tryChange(next)
  }

  const options = uniqueMonths(
    month === 'all' || months.includes(month) ? months : [month, ...months],
  )
  const grouped = monthsByYear(options.filter((key) => key !== now))
  const label =
    month === 'all'
      ? 'Todos'
      : month === now
        ? 'Este mes'
        : formatMonthShort(month)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const pick = (value: MonthFilter) => {
    tryChange(value)
  }

  return (
    <div className="month-nav" ref={ref} role="group" aria-label="Elegir mes">
      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        aria-label="Mes anterior"
        onClick={() => go(-1)}
      >
        ‹
      </button>

      <button
        type="button"
        className="month-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <span className="month-chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {month !== now ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm month-now"
          onClick={() => pick(now)}
        >
          Hoy
        </button>
      ) : null}

      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        aria-label="Mes siguiente"
        onClick={() => go(1)}
      >
        ›
      </button>

      {open ? (
        <div className="month-dropdown" role="listbox" aria-label="Meses">
          {options.includes(now) ? (
            <button
              type="button"
              role="option"
              aria-selected={month === now}
              className={`month-option${month === now ? ' active' : ''}`}
              onClick={() => pick(now)}
            >
              <span>
                <strong>Este mes</strong>
                <em>{formatMonthShort(now)}</em>
              </span>
              <CountBadge count={counts[now] ?? 0} />
            </button>
          ) : null}

          {grouped.map((group) => (
            <div key={group.year} className="month-year">
              <p className="month-year-label">{group.year}</p>
              {group.months.map((key) => {
                const locked = canAccessMonth ? !canAccessMonth(key) : false
                return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={month === key}
                  className={`month-option${month === key ? ' active' : ''}${locked ? ' month-locked' : ''}`}
                  onClick={() => pick(key)}
                >
                  <span>
                    {formatMonthName(key)}
                    {locked ? ' 🔒' : ''}
                  </span>
                  <CountBadge count={counts[key] ?? 0} />
                </button>
              )})}
            </div>
          ))}

          {canAccessMonth?.('all') !== false ? (
          <button
            type="button"
            role="option"
            aria-selected={month === 'all'}
            className={`month-option month-option-all${month === 'all' ? ' active' : ''}`}
            onClick={() => pick('all')}
          >
            <span>Todos los meses</span>
          </button>
          ) : (
          <button
            type="button"
            className="month-option month-option-all month-locked"
            onClick={() => onHistoryBlocked?.()}
          >
            <span>Todos los meses 🔒</span>
          </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function CountBadge({ count }: { count: number }) {
  if (!count) return <span className="month-count muted">—</span>
  return (
    <span className="month-count">
      {count} {count === 1 ? 'gasto' : 'gastos'}
    </span>
  )
}

function uniqueMonths(keys: string[]): string[] {
  return [...new Set(keys)].sort((a, b) => b.localeCompare(a))
}
