import type { PlanTier } from '../types'
import {
  PLAN_LIMITS,
  minimumTierForFeature,
  type PlanFeatureKey,
} from '../lib/plans'
import { UiLock } from './AppIcon'
import { Modal } from './Modal'

export type UpgradeFeature =
  | PlanFeatureKey
  | 'history'

const COPY: Record<
  UpgradeFeature,
  { title: string; teaser: string; bullets: string[] }
> = {
  budgets: {
    title: 'Presupuestos mensuales',
    teaser: 'Fija topes por categoría y recibe alertas antes de pasarte.',
    bullets: [
      'Tope por categoría (ej. Supermercado $150.000)',
      'Alertas visuales al acercarte al límite',
      'Comparación gasto real vs presupuesto',
    ],
  },
  installments: {
    title: 'Compras en cuotas',
    teaser: 'Registra compras en cuotas y proyecta la deuda en meses futuros.',
    bullets: [
      'Cuotas automáticas mes a mes',
      'Proyección de deuda del hogar',
      'Ideal para tarjetas y créditos',
    ],
  },
  expenseSplit: {
    title: 'División de gastos',
    teaser: 'Reparte gastos 50/50, proporcional al ingreso o con porcentajes manuales.',
    bullets: [
      'Reparto entre integrantes del hogar',
      'Proporcional al ingreso o partes iguales',
      'Saldos y transferencias entre personas',
    ],
  },
  personalSpaces: {
    title: 'Espacios personales',
    teaser: 'Lleva tus finanzas personales sin mezclarlas con las de la pareja.',
    bullets: [
      'Espacio privado solo para ti',
      'Gastos personales separados del hogar',
      'Misma app, distintos contextos',
    ],
  },
  customCategories: {
    title: 'Categorías personalizadas',
    teaser: 'Crea las categorías que necesites, sin límite.',
    bullets: [
      'Etiquetas a tu medida',
      'Mejor filtrado en la cartola',
      'Presupuestos por categoría propia',
    ],
  },
  savings: {
    title: 'Metas de ahorro y proyectos',
    teaser: 'Anillos de progreso, metas compartidas y proyección mensual.',
    bullets: [
      'Metas familiares y personales',
      'Abono rápido y historial de depósitos',
      'Cuenta regresiva y proyección matemática',
    ],
  },
  wishlist: {
    title: 'Planificador de compras',
    teaser: 'Tablero Kanban, comparar precios y pasar a gasto con un clic.',
    bullets: [
      'Ideas → Evaluación → Comprado',
      'Comparativa de precios y votos',
      'Inyectar compra a la cartola del mes',
    ],
  },
  multipleCurrencies: {
    title: 'Multimoneda',
    teaser: 'Registra gastos en distintas monedas, ideal para viajes.',
    bullets: [
      'Moneda por gasto',
      'Viajes y compras internacionales',
      'Cartola multimoneda',
    ],
  },
  receiptScan: {
    title: 'Escaneo de comprobantes',
    teaser: 'Adjunta la foto de la boleta respaldando cada gasto.',
    bullets: [
      'Foto de boleta por gasto',
      'Respaldo para rendiciones',
      'Todo en un solo lugar',
    ],
  },
  advancedExport: {
    title: 'Exportación avanzada',
    teaser: 'Descarga cartolas en PDF y Excel para rendiciones.',
    bullets: [
      'Exportar cartola CSV / Excel',
      'Resumen imprimible',
      'Ideal para contabilidad',
    ],
  },
  history: {
    title: 'Historial completo',
    teaser: 'Accede a todos los meses anteriores, no solo los últimos 3.',
    bullets: [
      'Ver años anteriores sin límite',
      'Comparar meses y tendencias',
      'Gráficos anuales completos',
    ],
  },
}

interface Props {
  feature: UpgradeFeature
  planTier: PlanTier
  onOpenPlans: () => void
  onClose: () => void
}

export function UpgradeModal({ feature, planTier, onOpenPlans, onClose }: Props) {
  const copy = COPY[feature]
  const minTier =
    feature === 'history' ? 'family' : minimumTierForFeature(feature as PlanFeatureKey)
  const targetPlan = PLAN_LIMITS[minTier]

  return (
    <Modal
      title={copy.title}
      subtitle={`Disponible desde ${targetPlan.label}`}
      onClose={onClose}
    >
      <div className="upgrade-modal-body">
        <div className="premium-upsell-icon" aria-hidden>
          <UiLock size={32} className="ui-icon ui-icon-lock ui-icon-muted" />
        </div>
        <p className="brand-sub">{copy.teaser}</p>
        <p className="hint">
          Tu plan <strong>{PLAN_LIMITS[planTier].label}</strong> no incluye este módulo.
          Mejora a <strong>{targetPlan.label}</strong> para desbloquearlo en todos tus
          dispositivos.
        </p>
        <ul className="premium-upsell-features">
          {copy.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Ahora no
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onClose()
            onOpenPlans()
          }}
        >
          Ver planes y mejorar
        </button>
      </div>
    </Modal>
  )
}
