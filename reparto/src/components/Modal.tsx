import { useEffect, useId, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
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

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (!coarse) {
      ref.current
        ?.querySelector<HTMLElement>('input, select, textarea')
        ?.focus()
    }

    const scrollY = window.scrollY
    const body = document.body
    const html = document.documentElement
    const previousBody = body.style.cssText
    const previousHtmlOverflow = html.style.overflow
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    html.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      body.style.cssText = previousBody
      html.style.overflow = previousHtmlOverflow
      window.scrollTo(0, scrollY)
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
        <h2 id={titleId}>{title}</h2>
        {subtitle ? <p className="modal-sub">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}
