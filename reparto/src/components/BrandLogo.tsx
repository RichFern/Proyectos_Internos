interface Props {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showWordmark?: boolean
  /** dark = for dark backgrounds */
  variant?: 'default' | 'onDark' | 'markOnly'
  className?: string
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
}: Props) {
  const px = SIZES[size]
  const onDark = variant === 'onDark'

  return (
    <div className={`brand-logo brand-logo-${size} ${className}`.trim()} style={{ gap: showWordmark ? '0.7rem' : 0 }}>
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
    </div>
  )
}
