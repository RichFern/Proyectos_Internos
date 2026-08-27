import type { Space } from '../types'
import { categoryLabel } from './categories'
import { computeBalances, categoryTotals, totalSpent } from './balances'
import {
  applySettlementRecords,
  pendingSettlements,
  filterSettlementRecords,
} from './settlements'
import { formatDate, formatMoney, formatMonth } from './format'
import type { MonthFilter } from './months'

function csvEscape(v: string | number): string {
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportMonthCsv(
  space: Space,
  month: MonthFilter,
  memberName: (id: string) => string,
): void {
  const monthLabel = month === 'all' ? 'todos' : month
  const lines: string[] = []
  lines.push(`A la PaR - ${space.name} - ${monthLabel}`)
  lines.push('')

  lines.push('GASTOS')
  lines.push('Descripción,Categoría,Fecha,Vence,Monto,Quién pagó,Notas')
  for (const e of space.expenses) {
    if (month !== 'all' && !e.date.startsWith(month)) continue
    lines.push(
      [
        csvEscape(e.description),
        csvEscape(categoryLabel(e.category, space.customCategories)),
        e.date,
        e.dueDate ?? '',
        e.amount,
        csvEscape(memberName(e.paidById)),
        csvEscape(e.notes ?? ''),
      ].join(','),
    )
  }

  lines.push('')
  lines.push('SALDOS')
  lines.push('Persona,Pagó,Le corresponde,Neto')
  const balMonth = month !== 'all' ? month : null
  const scopedExpenses =
    month === 'all'
      ? space.expenses
      : space.expenses.filter((e) => e.date.startsWith(month))
  const scopedSpace = { ...space, expenses: scopedExpenses }
  const records = filterSettlementRecords(space.settlementRecords ?? [], balMonth)
  const balances = applySettlementRecords(
    computeBalances(scopedSpace, balMonth),
    records,
  )
  for (const b of balances) {
    lines.push(
      [csvEscape(b.name), b.paid, b.owes, b.net].join(','),
    )
  }

  lines.push('')
  lines.push('TRANSFERENCIAS SUGERIDAS')
  lines.push('De,A,Monto')
  const pending = pendingSettlements(balances)
  for (const s of pending) {
    lines.push([csvEscape(s.fromName), csvEscape(s.toName), s.amount].join(','))
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `a-la-par-${space.name.replace(/\s+/g, '-')}-${monthLabel}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportMonthPdf(
  space: Space,
  month: MonthFilter,
  memberName: (id: string) => string,
): void {
  const monthLabel = month === 'all' ? 'Todos los meses' : formatMonth(month)
  const balMonth = month !== 'all' ? month : null
  const scopedExpenses =
    month === 'all'
      ? space.expenses
      : space.expenses.filter((e) => e.date.startsWith(month))
  const scopedSpace = { ...space, expenses: scopedExpenses }
  const balances = applySettlementRecords(
    computeBalances(scopedSpace, balMonth),
    filterSettlementRecords(space.settlementRecords ?? [], balMonth),
  )
  const settlements = pendingSettlements(balances)
  const cats = categoryTotals(scopedSpace)
  const spent = totalSpent(scopedSpace)

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
<title>A la PaR ${space.name}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:24px;color:#14201c;max-width:720px;margin:0 auto}
  h1{font-size:1.4rem;margin:0 0 4px}
  h2{font-size:1rem;margin:1.25rem 0 0.5rem;border-bottom:1px solid #ddd;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:8px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee}
  th{background:#f3f6f2}
  .meta{color:#6b7a73;font-size:0.9rem;margin-bottom:1rem}
  .settlement{background:#f6e7d0;padding:8px 12px;border-radius:8px;margin:4px 0}
  @media print{body{padding:12px}}
</style></head><body>
<h1>${escapeHtml(space.name)}</h1>
<p class="meta">${escapeHtml(monthLabel)} · Total ${formatMoney(spent)} · ${scopedExpenses.length} movimientos</p>

<h2>Gastos</h2>
<table><thead><tr><th>Descripción</th><th>Categoría</th><th>Fecha</th><th>Monto</th><th>Pagó</th></tr></thead><tbody>
${scopedExpenses
  .map(
    (e) =>
      `<tr><td>${escapeHtml(e.description)}</td><td>${escapeHtml(categoryLabel(e.category, space.customCategories))}</td><td>${formatDate(e.date)}</td><td>${formatMoney(e.amount)}</td><td>${escapeHtml(memberName(e.paidById))}</td></tr>`,
  )
  .join('')}
</tbody></table>

<h2>Saldos</h2>
<table><thead><tr><th>Persona</th><th>Pagó</th><th>Le toca</th><th>Neto</th></tr></thead><tbody>
${balances
  .map(
    (b) =>
      `<tr><td>${escapeHtml(b.name)}</td><td>${formatMoney(b.paid, true)}</td><td>${formatMoney(b.owes, true)}</td><td>${formatMoney(b.net, true)}</td></tr>`,
  )
  .join('')}
</tbody></table>

<h2>Cómo saldar</h2>
${
  settlements.length === 0
    ? '<p>Están a mano — no hay transferencias pendientes.</p>'
    : settlements
        .map(
          (s) =>
            `<div class="settlement"><strong>${escapeHtml(s.fromName)}</strong> le transfiere a <strong>${escapeHtml(s.toName)}</strong>: ${formatMoney(s.amount, true)}</div>`,
        )
        .join('')
}

<h2>Por categoría</h2>
<table><thead><tr><th>Categoría</th><th>Monto</th></tr></thead><tbody>
${cats.map((c) => `<tr><td>${escapeHtml(categoryLabel(c.category, space.customCategories))}</td><td>${formatMoney(c.amount)}</td></tr>`).join('')}
</tbody></table>

<script>window.onload=function(){window.print()}</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permite ventanas emergentes para exportar PDF')
    return
  }
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function monthShareText(
  space: Space,
  month: MonthFilter,
  memberName: (id: string) => string,
): string {
  const monthLabel = month === 'all' ? 'Todos los meses' : formatMonth(month)
  const scopedExpenses =
    month === 'all'
      ? space.expenses
      : space.expenses.filter((e) => e.date.startsWith(month))
  const scopedSpace = { ...space, expenses: scopedExpenses }
  const balMonth = month !== 'all' ? month : null
  const balances = applySettlementRecords(
    computeBalances(scopedSpace, balMonth),
    filterSettlementRecords(space.settlementRecords ?? [], balMonth),
  )
  const settlements = pendingSettlements(balances)
  const spent = totalSpent(scopedSpace)
  const lines = [
    `A la PaR — ${space.name}`,
    monthLabel,
    `Total: ${formatMoney(spent)} · ${scopedExpenses.length} gastos`,
    '',
  ]
  if (scopedExpenses.length) {
    lines.push('Gastos')
    for (const expense of scopedExpenses.slice(0, 25)) {
      lines.push(
        `• ${expense.description} ${formatMoney(expense.amount)} (pagó ${memberName(expense.paidById)})`,
      )
    }
    if (scopedExpenses.length > 25) {
      lines.push(`… y ${scopedExpenses.length - 25} más`)
    }
    lines.push('')
  }
  if (settlements.length) {
    lines.push('Cómo saldar')
    for (const item of settlements) {
      lines.push(
        `• ${item.fromName} le transfiere a ${item.toName} ${formatMoney(item.amount, true)}`,
      )
    }
  } else {
    lines.push('Saldos a mano: no hay transferencias pendientes.')
  }
  return lines.join('\n')
}

export function shareMonthWhatsApp(
  space: Space,
  month: MonthFilter,
  memberName: (id: string) => string,
): void {
  const text = monthShareText(space, month, memberName)
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener',
  )
}

export function shareInviteWhatsApp(householdName: string, link: string): void {
  const text = `Te invito a A la PaR para los gastos de ${householdName}. Entrá con tu cuenta Google:\n${link}`
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener',
  )
}
