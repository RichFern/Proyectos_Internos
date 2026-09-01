import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

function useMobileSheet() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 860px)').matches
      : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 860px)')
    const sync = () => setMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return mobile
}

export function RowActionsMenu({ actions, detail }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const mobileSheet = useMobileSheet()
  const [panelStyle, setPanelStyle] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || mobileSheet) {
      setPanelStyle(null)
      return
    }
    const trigger = rootRef.current?.querySelector('.row-menu-trigger')
    if (!trigger) return

    const place = () => {
      const rect = trigger.getBoundingClientRect()
      const width = Math.min(240, window.innerWidth - 16)
      let left = rect.right - width
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      const panelHeight = panelRef.current?.offsetHeight ?? 220
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < panelHeight + 12 && rect.top > panelHeight + 12
      const top = openUp ? rect.top - panelHeight - 6 : rect.bottom + 6
      setPanelStyle({ top, left, width })
    }

    const frame = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, mobileSheet, detail, actions.length])

  useEffect(() => {
    if (!open || !mobileSheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mobileSheet])

  const menuBody = (
    <>
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
            close()
            action.onClick()
          }}
        >
          {action.label}
        </button>
      ))}
    </>
  )

  const floatingMenu =
    open && !mobileSheet
      ? createPortal(
          <div
            className="row-menu-panel row-menu-panel-floating"
            id={menuId}
            role="menu"
            ref={panelRef}
            style={
              panelStyle
                ? {
                    position: 'fixed',
                    top: panelStyle.top,
                    left: panelStyle.left,
                    width: panelStyle.width,
                    right: 'auto',
                    zIndex: 320,
                  }
                : { position: 'fixed', visibility: 'hidden', zIndex: 320 }
            }
          >
            {menuBody}
          </div>,
          document.body,
        )
      : null

  const sheetMenu =
    open && mobileSheet
      ? createPortal(
          <div
            className="row-menu-sheet-backdrop"
            role="presentation"
            onClick={close}
          >
            <div
              className="row-menu-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby={menuId}
              ref={panelRef}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="row-menu-sheet-handle" aria-hidden />
              <div className="row-menu-panel row-menu-panel-sheet" id={menuId} role="menu">
                {menuBody}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

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
      {floatingMenu}
      {sheetMenu}
    </div>
  )
}
