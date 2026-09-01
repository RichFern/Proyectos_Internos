import type { Space } from '../types'
import { KIND_LABELS } from '../types'
import { totalSpent } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { childKindForFolder, presetForSpace } from '../lib/spacePresets'
import { SpaceIcon } from './AppIcon'

interface Props {
  folder: Space
  children: Space[]
  onOpenChild: (spaceId: string) => void
  onCreateChild: () => void
  onDeleteFolder: () => void
}

export function SpaceFolderView({
  folder,
  children,
  onOpenChild,
  onCreateChild,
  onDeleteFolder,
}: Props) {
  const preset = presetForSpace(folder)
  const childKind = childKindForFolder(folder.kind)
  const childPreset = childKind ? presetForSpace({ kind: childKind }) : null
  const childLabel = preset.childLabel ?? 'espacio'
  const folderTotal = children.reduce((sum, item) => sum + totalSpent(item), 0)

  return (
    <div className="panel main-panel">
      <header className="hero-space">
        <div className="section-head" style={{ marginBottom: '0.35rem' }}>
          <div>
            <h1 className="hero-space-title">
              <SpaceIcon space={folder} size={20} className="ui-icon space-icon" />
              <span className="hero-space-name">{folder.name}</span>
            </h1>
            <p>{folder.description || preset.description}</p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                const msg =
                  children.length > 0
                    ? `¿Eliminar “${folder.name}” y sus ${children.length} espacio(s)?`
                    : `¿Eliminar la carpeta “${folder.name}”?`
                if (confirm(msg)) onDeleteFolder()
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
        <div className="hero-meta hide-mobile">
          <span className="chip">{KIND_LABELS[folder.kind]}</span>
          <span className="chip">{children.length} {childLabel}(s)</span>
          <span className="chip">{formatMoney(folderTotal)} en total</span>
        </div>
        <div className="folder-mobile-summary show-sm" aria-label="Resumen de la carpeta">
          <span className="chip">{children.length} {childLabel}(s)</span>
          <span className="chip">{formatMoney(folderTotal)}</span>
        </div>
      </header>

      <div className="folder-body">
        <div className="section-head">
          <h2>Espacios en esta carpeta</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreateChild}>
            + {preset.expenseButton}
          </button>
        </div>

        {children.length === 0 ? (
          <div className="empty">
            <h3>{preset.emptyTitle}</h3>
            <p>{childPreset?.description ?? preset.description}</p>
            <button type="button" className="btn btn-primary" onClick={onCreateChild}>
              Crear primer {childLabel}
            </button>
          </div>
        ) : (
          <div className="folder-trip-list">
            {children.map((item) => (
              <button
                key={item.id}
                type="button"
                className="folder-trip-card"
                onClick={() => onOpenChild(item.id)}
              >
                <span className="folder-trip-head">
                  <SpaceIcon space={item} size={18} className="ui-icon ui-icon-inline" />
                  <strong>{item.name}</strong>
                </span>
                <span className="folder-trip-meta">
                  {formatMoney(totalSpent(item))} · {item.members.length}{' '}
                  {childPreset?.peopleLabel.toLowerCase() ?? 'persona(s)'} ·{' '}
                  {item.expenses.length} gasto(s)
                </span>
                {item.description ? (
                  <span className="folder-trip-desc">{item.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
