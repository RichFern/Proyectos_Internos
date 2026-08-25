import type { MonthFilter } from '../lib/months'
import { formatMonth, shiftMonth } from '../lib/format'

interface Props {
  month: MonthFilter
  months: string[]
  onChange: (month: MonthFilter) => void
}

export function MonthNav({ month, months, onChange }: Props) {
  const canPrev = month !== 'all'
  const canNext = month !== 'all'

  return (
    <div className="month-nav" role="group" aria-label="Elegir mes">
      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        disabled={!canPrev}
        aria-label="Mes anterior"
        onClick={() => {
          if (month === 'all') return
          onChange(shiftMonth(month, -1))
        }}
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
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn-ghost btn-sm month-arrow"
        disabled={!canNext}
        aria-label="Mes siguiente"
        onClick={() => {
          if (month === 'all') return
          onChange(shiftMonth(month, 1))
        }}
      >
        ›
      </button>
    </div>
  )
}
