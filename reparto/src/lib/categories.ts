import { CATEGORY_LABELS, type ExpenseCategory, type Space } from '../types'

export function slugCategory(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'otros'
}

export function categoryLabel(
  id: ExpenseCategory,
  extras: Space['customCategories'] = [],
): string {
  if (id in CATEGORY_LABELS) {
    return CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS]
  }
  const custom = extras?.find((item) => item.id === id)
  return custom?.label ?? id
}

export function allCategories(space?: Pick<Space, 'customCategories'> | null): {
  id: string
  label: string
}[] {
  const builtins = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
    id,
    label,
  }))
  const extras = (space?.customCategories ?? []).filter(
    (item) => !(item.id in CATEGORY_LABELS),
  )
  return [...builtins, ...extras]
}

export function addCustomCategory(
  current: Space['customCategories'],
  rawLabel: string,
): { id: string; next: NonNullable<Space['customCategories']> } | null {
  const label = rawLabel.trim()
  if (!label) return null
  const id = slugCategory(label)
  const list = current ?? []
  if (id in CATEGORY_LABELS || list.some((item) => item.id === id)) {
    return { id, next: list }
  }
  return { id, next: [...list, { id, label }] }
}
