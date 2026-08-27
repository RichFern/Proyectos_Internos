import { useEffect, useState } from 'react'
import { completeTour, isTourCompleted } from '../lib/onboarding'

const STEPS = [
  {
    title: 'Bienvenido a A la PaR',
    body: 'Organiza gastos compartidos del hogar, viajes o eventos. Empieza creando un espacio y cargando tu primer gasto.',
    target: 'dock-gastos',
  },
  {
    title: 'Cartola y reparto',
    body: 'En Gastos verás la cartola del mes, quién pagó y cómo se reparte. Usa el botón + para registrar un movimiento.',
    target: 'dock-gasto',
  },
  {
    title: 'Ahorros',
    body: 'Metas y movimientos aparte de los gastos del día a día. Ideal para vacaciones o fondos del hogar.',
    target: 'dock-ahorros',
  },
  {
    title: 'Cotizaciones',
    body: 'Compara precios antes de comprar. Cuando compres, puedes registrar el gasto con un clic.',
    target: 'dock-cotizaciones',
  },
  {
    title: 'Familia y plan',
    body: 'Invita integrantes, revisa el resumen del hogar y elige tu plan cuando quieras más funciones.',
    target: 'dock-familia',
  },
] as const

interface Props {
  ready: boolean
}

export function OnboardingTour({ ready }: Props) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!ready || isTourCompleted()) return
    const timer = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(timer)
  }, [ready])

  if (!visible) return null

  const current = STEPS[step]
  const last = step === STEPS.length - 1

  const finish = () => {
    completeTour()
    setVisible(false)
  }

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Recorrido inicial">
      <div className="tour-card">
        <p className="tour-step">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
            Saltar
          </button>
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setStep((value) => value - 1)}
            >
              Anterior
            </button>
          ) : null}
          {last ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={finish}>
              Empezar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setStep((value) => value + 1)}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
