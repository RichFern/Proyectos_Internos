import { useMemo } from 'react'
import { currentMonth, formatMonthName } from '../lib/format'

interface Props {
  value: string
  onChange: (month: string) => void
  label?: string
}

const MONTH_VALUES = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
)

function parseYearMonth(value: string): { year: number; month: string } {
  const [yearRaw, monthRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = monthRaw?.padStart(2, '0') ?? currentMonth().slice(5, 7)
  if (!Number.isFinite(year) || year < 1900) {
    const fallback = currentMonth()
    return { year: Number(fallback.slice(0, 4)), month: fallback.slice(5, 7) }
  }
  return { year, month }
}

export function MonthPickerField({
  value,
  onChange,
  label = 'Mes contable',
}: Props) {
  const { year, month } = parseYearMonth(value)
  const nowYear = Number(currentMonth().slice(0, 4))

  const monthOptions = useMemo(
    () =>
      MONTH_VALUES.map((monthValue) => ({
        value: monthValue,
        label: formatMonthName(`2000-${monthValue}`),
      })),
    [],
  )

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    for (let y = nowYear - 3; y <= nowYear + 1; y += 1) years.add(y)
    years.add(year)
    return [...years].sort((a, b) => b - a)
  }, [nowYear, year])

  const emit = (nextYear: number, nextMonth: string) => {
    onChange(`${nextYear}-${nextMonth}`)
  }

  return (
    <label className="field month-picker-field">
      {label}
      <div className="month-picker-row">
        <select
          className="month-picker-month"
          value={month}
          aria-label={`${label}: mes`}
          onChange={(event) => emit(year, event.target.value)}
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="month-picker-year"
          value={year}
          aria-label={`${label}: año`}
          onChange={(event) => emit(Number(event.target.value), month)}
        >
          {yearOptions.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </select>
      </div>
    </label>
  )
}
