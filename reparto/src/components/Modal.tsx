import { useEffect, useId, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

let lockCount = 0
let savedBody = ''
let savedHtmlOverflow = ''
let savedScrollY = 0

function lockPageScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY
    savedBody = document.body.style.cssText
    savedHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }
  lockCount += 1
}

function unlockPageScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return
  document.body.style.cssText = savedBody
  document.documentElement.style.overflow = savedHtmlOverflow
  window.scrollTo(0, savedScrollY)
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    lockPageScroll()

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (!coarse) {
      ref.current
        ?.querySelector<HTMLElement>('input, select, textarea')
        ?.focus()
    }

    return () => {
      window.removeEventListener('keydown', onKey)
      unlockPageScroll()
    }
  }, [])

  const maybeCloseFromBackdrop = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    const moved =
      Math.abs(event.clientX - start.x) > 8 ||
      Math.abs(event.clientY - start.y) > 8
    if (!moved) onCloseRef.current()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        pointerStart.current =
          event.target === event.currentTarget
            ? { x: event.clientX, y: event.clientY }
            : null
      }}
      onPointerUp={maybeCloseFromBackdrop}
      onPointerCancel={() => {
        pointerStart.current = null
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Cerrar"
          onClick={() => onCloseRef.current()}
        >
          ×
        </button>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          {subtitle ? <p className="modal-sub">{subtitle}</p> : null}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
