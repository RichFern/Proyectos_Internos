import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMonth, formatMoney } from '../lib/format'

interface Props {
  data: { month: string; amount: number }[]
  currency?: string
}

export function SavingsBarChart({ data, currency = 'CLP' }: Props) {
  if (data.length === 0) {
    return (
      <div className="savings-chart-empty">
        <p>Sin abonos registrados todavía</p>
      </div>
    )
  }

  const chartData = data.map((row) => ({
    ...row,
    label: formatMonth(row.month).replace(/\s+\d{4}$/, ''),
  }))

  return (
    <div className="savings-bar-chart" aria-label="Abonos por mes">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            cursor={{ fill: 'rgba(0, 128, 128, 0.06)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const row = payload[0].payload as { month: string; amount: number }
              return (
                <div className="savings-chart-tooltip">
                  <strong>{formatMonth(row.month)}</strong>
                  <span>{formatMoney(row.amount, false, currency)}</span>
                </div>
              )
            }}
          />
          <Bar dataKey="amount" fill="#008080" radius={[8, 8, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
