interface Props {
  percent: number
  size?: number
  stroke?: number
  label?: string
}

function progressColor(percent: number): string {
  if (percent >= 0.85) return 'var(--ok)'
  if (percent >= 0.45) return 'var(--orange)'
  return 'var(--rose)'
}

export function ProgressRing({
  percent,
  size = 96,
  stroke = 8,
  label,
}: Props) {
  const clamped = Math.min(1, Math.max(0, percent))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)
  const color = progressColor(clamped)

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(11,31,42,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{Math.round(clamped * 100)}%</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  )
}
