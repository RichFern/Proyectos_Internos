import type { MonthFilter } from '../lib/months'
import { currentMonth, formatMonth, shiftMonth } from '../lib/format'

interface Props {
  month: MonthFilter
  months: string[]
  onChange: (month: MonthFilter) => void
}

export function MonthNav({ month, months, onChange }: Props) {
  const go = (delta: number) => {
    if (month === 'all') {
      onChange(delta < 0 ? shiftMonth(currentMonth(), -1) : currentMonth())
      return
    }
    onChange(shiftMonth(month, delta))
  }

  const options = months.includes(month === 'all' ? '' : month)
    ? months
    : month === 'all'
      ? months
      : [month, ...months].sort((a, b) => b.localeCompare(a))

  return (
    <div className="month-nav" role="group" aria-label="Elegir mes">
      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        aria-label="Mes anterior"
        onClick={() => go(-1)}
      >
        ‹
      </button>

      <label className="month-select-wrap">
        <span className="sr-only">Mes</span>
        <select
          className="month-select"
          value={month}
          onChange={(e) => onChange(e.target.value as MonthFilter)}
        >
          <option value="all">Todos los meses</option>
          {options.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        aria-label="Mes siguiente"
        onClick={() => go(1)}
      >
        ›
      </button>
    </div>
  )
}
