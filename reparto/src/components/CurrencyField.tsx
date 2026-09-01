import { COMMON_CURRENCIES, currencyLabel } from '../lib/currency'

interface Props {
  value: string
  onChange: (code: string) => void
  label?: string
  hint?: string
}

export function CurrencyField({
  value,
  onChange,
  label = 'Moneda',
  hint,
}: Props) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {COMMON_CURRENCIES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label} ({item.code})
          </option>
        ))}
      </select>
      {hint ? <span className="hint block">{hint}</span> : null}
      <span className="hint block">Seleccionada: {currencyLabel(value)}</span>
    </label>
  )
}
