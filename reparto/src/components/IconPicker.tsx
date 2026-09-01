import { AppIcon } from './AppIcon'
import { SPACE_ICONS } from '../lib/spacePresets'

interface Props {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="icon-picker" role="listbox" aria-label="Icono del espacio">
      {SPACE_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          role="option"
          aria-selected={value === icon}
          aria-label={icon}
          className={`icon-pick${value === icon ? ' active' : ''}`}
          onClick={() => onChange(icon)}
        >
          <AppIcon name={icon} size={22} />
        </button>
      ))}
    </div>
  )
}
