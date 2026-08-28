import { useMemo } from 'react'
import type { Household, PlanTier, Space } from '../types'
import { totalSpent } from '../lib/balances'
import { currentMonth, formatMoney } from '../lib/format'
import { limitsFor } from '../lib/plans'
import { overallSavingsProgress } from '../lib/savings'
import { wishlistSummary } from '../lib/wishlist'
import { SpaceIcon } from './AppIcon'

interface Props {
  household: Household
  spaces: Space[]
  planTier: PlanTier
  onOpenHousehold: () => void
  onOpenPlans: () => void
}

export function HouseholdDashboard({
  household,
  spaces,
  planTier,
  onOpenHousehold,
  onOpenPlans,
}: Props) {
  const month = currentMonth()
  const plan = limitsFor(planTier)

  const stats = useMemo(() => {
    let monthSpent = 0
    let savingsGoals = 0
    let savingsBalance = 0
    let wishlistTotal = 0
    let members = 0

    for (const space of spaces) {
      const scoped = {
        ...space,
        expenses: space.expenses.filter(
          (expense) =>
            (expense.accountingMonth ?? expense.date.slice(0, 7)) === month,
        ),
      }
      monthSpent += totalSpent(scoped)
      members += space.members.length
      const savings = overallSavingsProgress(
        space.savingsGoals ?? [],
        space.savingsMovements ?? [],
      )
      savingsGoals += space.savingsGoals?.length ?? 0
      savingsBalance += savings.saved
      wishlistTotal += (space.wishlistItems ?? []).length
    }

    return { monthSpent, savingsGoals, savingsBalance, wishlistTotal, members }
  }, [spaces, month])

  const spaceRows = useMemo(
    () =>
      spaces.map((space) => {
        const scoped = {
          ...space,
          expenses: space.expenses.filter(
            (expense) =>
              (expense.accountingMonth ?? expense.date.slice(0, 7)) === month,
          ),
        }
        return {
          id: space.id,
          name: space.name,
          space,
          spent: totalSpent(scoped),
          expenses: scoped.expenses.length,
          members: space.members.length,
          savings: overallSavingsProgress(
            space.savingsGoals ?? [],
            space.savingsMovements ?? [],
          ),
          wishlist: wishlistSummary(space.wishlistItems ?? []),
        }
      }),
    [spaces, month],
  )

  return (
    <section className="panel app-section household-dashboard">
      <header className="app-section-head">
        <div>
          <h1>{household.name}</h1>
          <p className="brand-sub">
            Resumen del hogar · Plan {plan.label} · {spaces.length} espacio(s)
          </p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPlans}>
            Tu plan
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenHousehold}>
            Gestionar familia
          </button>
        </div>
      </header>

      <div className="impact-grid savings-summary">
        <div className="stat impact-card">
          <div className="stat-label">Gastos este mes</div>
          <div className="stat-value">{formatMoney(stats.monthSpent)}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Integrantes</div>
          <div className="stat-value">{stats.members}</div>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Ahorros</div>
          <div className="stat-value">{formatMoney(stats.savingsBalance)}</div>
          <span className="row-meta">{stats.savingsGoals} meta(s)</span>
        </div>
        <div className="stat impact-card">
          <div className="stat-label">Cotizaciones</div>
          <div className="stat-value">{stats.wishlistTotal}</div>
          <span className="row-meta">productos planificados</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Espacios</h2>
      </div>
      {spaceRows.length === 0 ? (
        <div className="empty">
          <h3>Sin espacios</h3>
          <p>Crea un espacio para empezar a registrar gastos.</p>
        </div>
      ) : (
        <div className="list household-space-list">
          {spaceRows.map((row) => (
            <div className="row household-space-row" key={row.id}>
              <div>
                <div className="row-title">
                  <SpaceIcon space={row.space} size={16} className="ui-icon ui-icon-inline" />
                  {row.name}
                </div>
                <div className="row-meta">
                  {row.expenses} gastos · {row.members} personas
                  {plan.features.savings && row.savings.target > 0
                    ? ` · ahorros ${formatMoney(row.savings.saved)}`
                    : ''}
                  {plan.features.wishlist && row.wishlist.total > 0
                    ? ` · ${row.wishlist.total} cotización(es)`
                    : ''}
                </div>
              </div>
              <div className="row-amount">{formatMoney(row.spent)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="hint">
        Usa la barra inferior para ir a Gastos, Ahorros o Cotizaciones de cada espacio.
      </p>
    </section>
  )
}
