import { useMemo, useState } from 'react'
import type { Space } from '../types'
import { Modal } from './Modal'
import {
  compareMonths,
  filterYearExpenses,
  monthShort,
  topCategoryLabel,
  yearSpend,
  yearsFromExpenses,
} from '../lib/year'
import { currentMonth, formatMoney, formatMonth, formatPercent, shiftMonth } from '../lib/format'
import { allCategories, categoryLabel } from '../lib/categories'
import type { MonthFilter } from '../lib/months'

interface Props {
  space: Space
  month: MonthFilter
  onPickMonth: (month: string) => void
  onClose: () => void
}

export function YearModal({ space, month, onPickMonth, onClose }: Props) {
  const now = currentMonth()
  const years = yearsFromExpenses(space.expenses)
  const [year, setYear] = useState(() =>
    month !== 'all' ? month.slice(0, 4) : now.slice(0, 4),
  )
  const defaultLeft =
    month !== 'all' ? shiftMonth(month, -1) : shiftMonth(now, -1)
  const defaultRight = month !== 'all' ? month : now
  const [left, setLeft] = useState(defaultLeft)
  const [right, setRight] = useState(defaultRight)

  const [filterPerson, setFilterPerson] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredExpenses = useMemo(
    () =>
      filterYearExpenses(space.expenses, {
        paidById: filterPerson === 'all' ? null : filterPerson,
        category: filterCategory === 'all' ? null : filterCategory,
      }),
    [space.expenses, filterPerson, filterCategory],
  )
  const rows = useMemo(
    () => yearSpend(filteredExpenses, year),
    [filteredExpenses, year],
  )
  const compareOptions = useMemo(() => {
    const keys = new Set(rows.map((row) => row.month))
    keys.add(left)
    keys.add(right)
    return [...keys].sort((a, b) => b.localeCompare(a))
  }, [rows, left, right])
  const max = Math.max(1, ...rows.map((row) => row.amount))
  const yearTotal = rows.reduce((sum, row) => sum + row.amount, 0)
  const peak = rows.reduce((best, row) => (row.amount > best.amount ? row : best), rows[0])
  const compare = compareMonths(filteredExpenses, left, right)
  const labelFor = (id: string) => categoryLabel(id, space.customCategories)
  const categories = allCategories(space)
  const filteredSpace = { ...space, expenses: filteredExpenses }

  const story =
    compare.hotter === 'tie'
      ? 'Empate: gastaron casi lo mismo.'
      : compare.hotter === 'right'
        ? `${formatMonth(right)} se pasó a ${formatMonth(left)}${
            compare.percent != null ? ` (${formatPercent(Math.abs(compare.percent))})` : ''
          }.`
        : `${formatMonth(left)} fue más pesado que ${formatMonth(right)}.`

  return (
    <Modal
      title={`El año ${year}`}
      subtitle={
        peak?.amount
          ? `Van ${formatMoney(yearTotal)} · el mes más caro fue ${formatMonthNameSafe(peak.month)}`
          : 'Todavía no hay gastos este año'
      }
      onClose={onClose}
    >
      {years.length > 1 ? (
        <label className="field">
          Año
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="form-row">
        <label className="field">
          Persona
          <select value={filterPerson} onChange={(event) => setFilterPerson(event.target.value)}>
            <option value="all">Todas</option>
            {space.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Tipo de gasto
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
          >
            <option value="all">Todos</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="year-chart" role="img" aria-label={`Gastos de ${year}`}>
        {rows.map((row) => {
          const height = Math.max(row.amount > 0 ? 8 : 2, (row.amount / max) * 100)
          const selected = month === row.month
          return (
            <button
              key={row.month}
              type="button"
              className={`year-col${selected ? ' active' : ''}${row.month === now ? ' now' : ''}`}
              title={`${formatMonth(row.month)} · ${formatMoney(row.amount)}`}
              onClick={() => onPickMonth(row.month)}
            >
              <span className="year-col-track">
                <span className="year-col-bar" style={{ height: `${height}%` }} />
              </span>
              <span className="year-col-label">{monthShort(row.month)}</span>
            </button>
          )
        })}
      </div>
      <p className="hint">Tocá un mes para verlo en la app.</p>

      <div className="section-head" style={{ marginTop: '1.1rem' }}>
        <h2>Comparar meses</h2>
      </div>
      <div className="compare-picks">
        <label className="field">
          Mes A
          <select value={left} onChange={(event) => setLeft(event.target.value)}>
            {compareOptions.map((key) => (
              <option key={key} value={key}>
                {formatMonth(key)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Mes B
          <select value={right} onChange={(event) => setRight(event.target.value)}>
            {compareOptions.map((key) => (
              <option key={`b-${key}`} value={key}>
                {formatMonth(key)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="compare-story">{story}</p>
      <div className="compare-grid">
        <CompareCard
          spend={compare.left}
          category={topCategoryLabel(filteredSpace, left, labelFor)}
          hot={compare.hotter === 'left'}
        />
        <CompareCard
          spend={compare.right}
          category={topCategoryLabel(filteredSpace, right, labelFor)}
          hot={compare.hotter === 'right'}
        />
      </div>
    </Modal>
  )
}

function formatMonthNameSafe(month: string) {
  return formatMonth(month)
}

function CompareCard({
  spend,
  category,
  hot,
}: {
  spend: { month: string; amount: number; count: number }
  category: string | null
  hot: boolean
}) {
  return (
    <div className={`compare-card${hot ? ' hot' : ''}`}>
      <div className="stat-label">{formatMonth(spend.month)}</div>
      <div className="stat-value">{formatMoney(spend.amount)}</div>
      <div className="row-meta">
        {spend.count} {spend.count === 1 ? 'gasto' : 'gastos'}
        {category ? ` · top ${category}` : ''}
        {hot ? ' · 🔥' : ''}
      </div>
    </div>
  )
}
