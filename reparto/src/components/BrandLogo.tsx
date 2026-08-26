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
      <svg
        className="brand-mark-svg"
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden={showWordmark ? true : undefined}
        role={showWordmark ? undefined : 'img'}
        aria-label={showWordmark ? undefined : 'A la PaR'}
      >
        <rect width="64" height="64" rx="16" fill="#FFFFFF" />
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="15.25"
          stroke={onDark ? 'rgba(255,255,255,0.25)' : '#E4EEEF'}
          strokeWidth="1.5"
        />
        {/* p — Connect Coral */}
        <path
          fill="#FF7F50"
          d="M15.5 48.5V16.5h14.2c7.6 0 12.6 4.1 12.6 10.9 0 6.7-5 10.8-12.8 10.8H25.8v10.3H15.5zm10.3-16.8h3.1c3.3 0 5.2-1.6 5.2-4.2s-1.9-4.1-5.2-4.1h-3.1v8.3z"
        />
        {/* r — Teal, overlapping stem */}
        <path
          fill="#008080"
          d="M34 48.5V26.8h9.4c5.9 0 9.7 3 9.7 7.8 0 3.5-1.8 6-4.9 7.3L55 48.5H44.4l-5.6-6.8H37.8v6.8H34zm9.4-13.6c2.3 0 3.8-1.2 3.8-3s-1.5-2.9-3.8-2.9H37.8v5.9H43.4z"
        />
      </svg>
      {showWordmark && variant !== 'markOnly' ? (
        <span className={`brand-wordmark${onDark ? ' on-dark' : ''}`}>
          A la <span className="brand-p">P</span>a<span className="brand-r">R</span>
        </span>
      ) : null}
    </div>
  )
}
