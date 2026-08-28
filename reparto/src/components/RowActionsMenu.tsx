import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

interface Action {
  id: string
  label: string
  onClick: () => void
  danger?: boolean
}

interface Props {
  actions: Action[]
  detail?: ReactNode
}

export function RowActionsMenu({ actions, detail }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`row-menu${open ? ' open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="row-menu-trigger"
        aria-label="Acciones"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        ⋮
      </button>
      {open ? (
        <div className="row-menu-panel" id={menuId} role="menu">
          {detail ? (
            <>
              <div className="row-menu-detail">{detail}</div>
              <div className="row-menu-divider" role="separator" />
            </>
          ) : null}
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={`row-menu-item${action.danger ? ' danger' : ''}`}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
