import type { Expense, Member, Space } from '../types'
import { expenseCurrency } from '../lib/currency'
import { formatMoney } from '../lib/format'
import { membersWithMonthIncome } from '../lib/members'
import { sharesForExpense } from '../lib/balances'
import { splitBadge } from '../lib/split'

interface Props {
  expense: Expense
  members: Member[]
  space: Space
  memberName: (id: string) => string
  variant?: 'menu'
}

export function splitBreakdownEntries(
  expense: Expense,
  members: Member[],
): Array<[string, number]> | null {
  const badge = splitBadge(expense)
  if (badge.kind === 'personal') return null

  const month = expense.accountingMonth ?? expense.date.slice(0, 7)
  const scopedMembers = membersWithMonthIncome(members, month)
  const shares = sharesForExpense(expense, scopedMembers)
  const entries = Object.entries(shares).filter(([, amount]) => amount > 0.005)
  if (entries.length <= 1) return null

  return entries.sort((a, b) => b[1] - a[1])
}

export function SplitBreakdown({
  expense,
  members,
  space,
  memberName,
  variant,
}: Props) {
  const entries = splitBreakdownEntries(expense, members)
  if (!entries) return null

  const currency = expenseCurrency(expense, space)

  return (
    <div
      className={`split-breakdown${variant === 'menu' ? ' split-breakdown-menu' : ''}`}
      aria-label="Detalle del reparto"
    >
      {entries.map(([memberId, amount]) => {
        const member = members.find((item) => item.id === memberId)
        const pct =
          expense.amount > 0 ? Math.round((amount / expense.amount) * 100) : 0
        return (
          <span className="split-breakdown-item" key={memberId}>
            <span
              className="split-breakdown-dot"
              style={{ background: member?.color ?? '#94a3b8' }}
              aria-hidden
            />
            <span className="split-breakdown-name">{memberName(memberId)}</span>
            <span className="split-breakdown-amount">
              {formatMoney(amount, false, currency)}
            </span>
            <span className="split-breakdown-pct">{pct}%</span>
          </span>
        )
      })}
    </div>
  )
}
