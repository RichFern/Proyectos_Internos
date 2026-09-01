import type { Member, Space } from '../types'
import { categoryLabel } from '../lib/categories'
import type { ExpenseFilters, ExpenseSort, ExpenseTag } from '../lib/months'
import { AppIcon, CategoryIcon } from './AppIcon'
import type { LucideIconName } from '../lib/categoryIcons'

const SORTS: { id: ExpenseSort; label: string }[] = [
  { id: 'date-desc', label: 'Reciente' },
  { id: 'date-asc', label: 'Antiguo' },
  { id: 'amount-desc', label: 'Más caro' },
  { id: 'amount-asc', label: 'Más barato' },
  { id: 'name', label: 'A → Z' },
]

const TAGS: { id: ExpenseTag; label: string; icon: LucideIconName }[] = [
  { id: 'receipt', label: 'Ticket', icon: 'camera' },
  { id: 'installment', label: 'Cuota', icon: 'scroll-text' },
  { id: 'personal', label: 'Mío', icon: 'eye-off' },
]

interface Props {
  categories: string[]
  members: Member[]
  customCategories?: Space['customCategories']
  filters: ExpenseFilters
  sort: ExpenseSort
  onFilters: (filters: ExpenseFilters) => void
  onSort: (sort: ExpenseSort) => void
}

export function ExpenseFilterBar({
  categories,
  members,
  customCategories,
  filters,
  sort,
  onFilters,
  onSort,
}: Props) {
  const active = Boolean(filters.category || filters.paidById || filters.tag)

  return (
    <div className="filter-bar" role="toolbar" aria-label="Filtros y orden">
      <select
        className="sort-select"
        value={sort}
        aria-label="Ordenar"
        onChange={(event) => onSort(event.target.value as ExpenseSort)}
      >
        {SORTS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="filter-scroller">
        {categories.length > 1
          ? categories.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip${filters.category === id ? ' active' : ''}`}
                onClick={() =>
                  onFilters({
                    ...filters,
                    category: filters.category === id ? null : id,
                  })
                }
              >
                <CategoryIcon id={id} size={14} className="ui-icon ui-icon-inline" />
                {categoryLabel(id, customCategories)}
              </button>
            ))
          : null}
        {members.length > 1
          ? members.map((member) => (
              <button
                key={member.id}
                type="button"
                className={`chip${filters.paidById === member.id ? ' active' : ''}`}
                onClick={() =>
                  onFilters({
                    ...filters,
                    paidById: filters.paidById === member.id ? null : member.id,
                  })
                }
              >
                {member.name}
              </button>
            ))
          : null}
        {TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`chip${filters.tag === tag.id ? ' active' : ''}`}
            onClick={() =>
              onFilters({
                ...filters,
                tag: filters.tag === tag.id ? null : tag.id,
              })
            }
          >
            <AppIcon name={tag.icon} size={14} className="ui-icon ui-icon-inline" />
            {tag.label}
          </button>
        ))}
      </div>
      {active ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onFilters({})}
        >
          Limpiar
        </button>
      ) : null}
    </div>
  )
}
