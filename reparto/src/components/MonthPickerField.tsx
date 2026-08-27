import { useMemo } from 'react'
import { currentMonth, formatMonth, shiftMonth } from '../lib/format'

interface Props {
  value: string
  onChange: (month: string) => void
  label?: string
}

export function MonthPickerField({
  value,
  onChange,
  label = 'Mes contable',
}: Props) {
  const options = useMemo(() => {
    const now = currentMonth()
    const keys: string[] = []
    for (let delta = -18; delta <= 6; delta += 1) {
      keys.push(shiftMonth(now, delta))
    }
    return [...new Set([value, ...keys])].sort((a, b) => b.localeCompare(a))
  }, [value])

  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((month) => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </select>
    </label>
  )
}
