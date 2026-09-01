import { useMemo } from 'react'
import type { Household, PlanTier, Space } from '../types'
import { totalSpent } from '../lib/balances'
import { currentMonth, formatMoney, formatMonth } from '../lib/format'
import { limitsFor } from '../lib/plans'
import { overallSavingsProgress } from '../lib/savings'
import { wishlistSummary } from '../lib/wishlist'
import { buildSpaceSections } from '../lib/spaceGroups'
import { presetForSpace } from '../lib/spacePresets'
import { AppIcon, SpaceIcon } from './AppIcon'

interface Props {
  household: Household
  spaces: Space[]
  hubSpace?: Space | null
  memberCount: number
  planTier: PlanTier
  onOpenHousehold: () => void
  onOpenPlans: () => void
  onOpenSpace?: (spaceId: string) => void
  onOpenSavings?: () => void
  onOpenWishlist?: () => void
}

function scopedMonthExpenses(space: Space, month: string) {
  return space.expenses.filter(
    (expense) => (expense.accountingMonth ?? expense.date.slice(0, 7)) === month,
  )
}

export function HouseholdDashboard({
  household,
  spaces,
  hubSpace,
  memberCount,
  planTier,
  onOpenHousehold,
  onOpenPlans,
  onOpenSpace,
  onOpenSavings,
  onOpenWishlist,
}: Props) {
  const month = currentMonth()
  const monthLabel = formatMonth(month)
  const plan = limitsFor(planTier)

  const stats = useMemo(() => {
    let monthSpent = 0

    for (const space of spaces) {
      const scoped = {
        ...space,
        expenses: scopedMonthExpenses(space, month),
      }
      monthSpent += totalSpent(scoped)
    }

    const savings = overallSavingsProgress(
      hubSpace?.savingsGoals ?? [],
      hubSpace?.savingsMovements ?? [],
    )
    const wishlist = wishlistSummary(hubSpace?.wishlistItems ?? [])

    return {
      monthSpent,
      savingsGoals: hubSpace?.savingsGoals?.length ?? 0,
      savingsBalance: savings.saved,
      wishlistTotal: wishlist.total,
    }
  }, [spaces, hubSpace, month])

  const spaceSections = useMemo(() => {
    return buildSpaceSections(spaces).map((section) => ({
      ...section,
      rows: section.items.map((space) => {
        const scoped = {
          ...space,
          expenses: scopedMonthExpenses(space, month),
        }
        return {
          id: space.id,
          name: space.name,
          space,
          spent: totalSpent(scoped),
          expenses: scoped.expenses.length,
          members: space.members.length,
        }
      }),
      folderRows: section.folders.map(({ folder, children }) => ({
        folder,
        children: children.map((space) => {
          const scoped = {
            ...space,
            expenses: scopedMonthExpenses(space, month),
          }
          return {
            id: space.id,
            name: space.name,
            space,
            spent: totalSpent(scoped),
            expenses: scoped.expenses.length,
            members: space.members.length,
          }
        }),
      })),
    }))
  }, [spaces, month])

  const totalSpaces = spaces.length

  const statCards = [
    {
      id: 'spent',
      label: 'Gastos este mes',
      value: formatMoney(stats.monthSpent),
      meta: monthLabel,
      icon: 'wallet' as const,
      tone: 'primary',
    },
    {
      id: 'members',
      label: 'Integrantes',
      value: String(memberCount),
      meta: memberCount === 1 ? 'persona en el hogar' : 'personas en el hogar',
      icon: 'users' as const,
      tone: 'neutral',
    },
    ...(plan.features.savings
      ? [
          {
            id: 'savings',
            label: 'Ahorros',
            value: formatMoney(stats.savingsBalance),
            meta: `${stats.savingsGoals} meta(s) activa(s)`,
            icon: 'target' as const,
            tone: 'savings',
            onClick: onOpenSavings,
          },
        ]
      : []),
    ...(plan.features.wishlist
      ? [
          {
            id: 'wishlist',
            label: 'Cotizaciones',
            value: String(stats.wishlistTotal),
            meta: stats.wishlistTotal === 1 ? 'producto planificado' : 'productos planificados',
            icon: 'layout-grid' as const,
            tone: 'wishlist',
            onClick: onOpenWishlist,
          },
        ]
      : []),
  ]

  const renderSpaceCard = (row: {
    id: string
    name: string
    space: Space
    spent: number
    expenses: number
    members: number
  }) => (
    <button
      type="button"
      key={row.id}
      className="saas-card dashboard-space-card"
      onClick={() => onOpenSpace?.(row.id)}
    >
      <div className="dashboard-space-icon-wrap">
        <SpaceIcon space={row.space} size={22} className="ui-icon" />
      </div>
      <div className="dashboard-space-copy">
        <strong>{row.name}</strong>
        <span>
          {row.expenses} {row.expenses === 1 ? 'gasto' : 'gastos'} · {row.members}{' '}
          {row.members === 1 ? 'persona' : 'personas'}
        </span>
      </div>
      <div className="dashboard-space-amount">{formatMoney(row.spent)}</div>
    </button>
  )

  return (
    <section className="module-page dashboard-module">
      <header className="module-header dashboard-header">
        <div>
          <h1 className="module-title">{household.name}</h1>
          <p className="module-subtitle">
            Resumen de {monthLabel} · Plan {plan.label} · {totalSpaces}{' '}
            {totalSpaces === 1 ? 'espacio' : 'espacios'}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenPlans}>
            Tu plan
          </button>
          <button type="button" className="btn btn-accent btn-sm" onClick={onOpenHousehold}>
            Gestionar familia
          </button>
        </div>
      </header>

      <div className={`dashboard-stats-grid cols-${statCards.length}`}>
        {statCards.map((card) => {
          const Tag = card.onClick ? 'button' : 'article'
          return (
            <Tag
              key={card.id}
              type={card.onClick ? 'button' : undefined}
              className={`dashboard-stat-card tone-${card.tone}${card.onClick ? ' dashboard-stat-clickable' : ''}`}
              onClick={card.onClick}
            >
              <span className="dashboard-stat-icon" aria-hidden>
                <AppIcon name={card.icon} size={20} className="ui-icon" />
              </span>
              <div className="dashboard-stat-copy">
                <span className="dashboard-stat-label">{card.label}</span>
                <strong className="dashboard-stat-value">{card.value}</strong>
                <span className="dashboard-stat-meta">{card.meta}</span>
              </div>
            </Tag>
          )
        })}
      </div>

      <div className="dashboard-section-head">
        <h2 className="dashboard-section-title">Espacios de gastos</h2>
        <span className="dashboard-section-count">{totalSpaces}</span>
      </div>

      {totalSpaces === 0 ? (
        <div className="module-empty-state">
          <div className="module-empty-icon" aria-hidden>
            <AppIcon name="home" size={32} className="ui-icon ui-icon-muted" />
          </div>
          <h3>Sin espacios todavía</h3>
          <p>Crea un espacio para empezar a registrar gastos compartidos.</p>
        </div>
      ) : (
        <div className="dashboard-space-sections">
          {spaceSections.map((section) => (
            <section key={section.id} className="dashboard-space-section">
              <h3 className="dashboard-space-section-label">{section.label}</h3>
              {section.folderRows.map(({ folder, children }) => {
                const childLabel = presetForSpace(folder).childLabel ?? 'espacio'
                return (
                <div key={folder.id} className="dashboard-space-folder">
                  <div className="dashboard-space-folder-head">
                    <SpaceIcon space={folder} size={18} className="ui-icon ui-icon-inline" />
                    <strong>{folder.name}</strong>
                    <span>{children.length} {childLabel}(s)</span>
                  </div>
                  <div className="dashboard-spaces-grid">
                    {children.map((row) => renderSpaceCard(row))}
                  </div>
                </div>
                )
              })}
              {section.rows.length > 0 ? (
                <div className="dashboard-spaces-grid">
                  {section.rows.map((row) => renderSpaceCard(row))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
