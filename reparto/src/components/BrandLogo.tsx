interface Props {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showWordmark?: boolean
  /** dark = for dark backgrounds */
  variant?: 'default' | 'onDark' | 'markOnly'
  className?: string
  /** Al hacer clic, vuelve al inicio (dashboard o pantalla principal). */
  onHomeClick?: () => void
}

const SIZES = {
  sm: 32,
  md: 44,
  lg: 56,
  hero: 88,
} as const

/** Marca Equilibrium: p coral + r teal entrelazadas */
export function BrandLogo({
  size = 'md',
  showWordmark = false,
  variant = 'default',
  className = '',
  onHomeClick,
}: Props) {
  const px = SIZES[size]
  const onDark = variant === 'onDark'

  const inner = (
    <>
      <img
        className="brand-mark-svg"
        width={px}
        height={px}
        src="/brand-mark.png"
        alt={showWordmark ? '' : 'A la PaR'}
        aria-hidden={showWordmark ? true : undefined}
      />
      {showWordmark && variant !== 'markOnly' ? (
        <span className={`brand-wordmark${onDark ? ' on-dark' : ''}`}>
          A la <span className="brand-p">P</span>a<span className="brand-r">R</span>
        </span>
      ) : null}
    </>
  )

  if (onHomeClick) {
    return (
      <button
        type="button"
        className={`brand-logo brand-logo-btn brand-logo-${size} ${className}`.trim()}
        style={{ gap: showWordmark ? '0.7rem' : 0 }}
        onClick={onHomeClick}
        aria-label="Ir al inicio"
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className={`brand-logo brand-logo-${size} ${className}`.trim()}
      style={{ gap: showWordmark ? '0.7rem' : 0 }}
    >
      {inner}
    </div>
  )
}
