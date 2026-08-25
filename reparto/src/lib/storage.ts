import type { AppData, Space } from '../types'
import { createId } from './id'
import { MEMBER_COLORS } from '../types'

const STORAGE_KEY = 'reparto-data-v1'

function demoData(): AppData {
  const ana = createId()
  const luis = createId()
  const sofia = createId()
  const now = new Date().toISOString()

  const hogar: Space = {
    id: createId(),
    name: 'Casa compartida',
    description: 'Gastos del mes: alquiler, comida y servicios',
    kind: 'hogar',
    createdAt: now,
    updatedAt: now,
    members: [
      { id: ana, name: 'Ana', income: 850000, color: MEMBER_COLORS[0], createdAt: now },
      { id: luis, name: 'Luis', income: 620000, color: MEMBER_COLORS[1], createdAt: now },
      { id: sofia, name: 'Sofía', income: 480000, color: MEMBER_COLORS[2], createdAt: now },
    ],
    expenses: [
      {
        id: createId(),
        description: 'Alquiler marzo',
        amount: 450000,
        category: 'vivienda',
        paidById: ana,
        date: '2026-03-01',
        splitMode: 'income',
        participantIds: [],
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Supermercado semanal',
        amount: 87500,
        category: 'comida',
        paidById: luis,
        date: '2026-03-08',
        splitMode: 'income',
        participantIds: [],
        notes: 'Verdulería + carnicería',
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Luz y gas',
        amount: 42000,
        category: 'servicios',
        paidById: sofia,
        date: '2026-03-05',
        splitMode: 'equal',
        participantIds: [],
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Salida al cine',
        amount: 28500,
        category: 'entretenimiento',
        paidById: luis,
        date: '2026-03-12',
        splitMode: 'equal',
        participantIds: [ana, luis],
        notes: 'Solo Ana y Luis',
        createdAt: now,
      },
    ],
  }

  const viaje: Space = {
    id: createId(),
    name: 'Paseo a Córdoba',
    description: 'Fin de semana largo',
    kind: 'viaje',
    createdAt: now,
    updatedAt: now,
    members: [
      { id: ana, name: 'Ana', income: 850000, color: MEMBER_COLORS[0], createdAt: now },
      { id: luis, name: 'Luis', income: 620000, color: MEMBER_COLORS[1], createdAt: now },
    ],
    expenses: [
      {
        id: createId(),
        description: 'Combustible ida y vuelta',
        amount: 68000,
        category: 'transporte',
        paidById: luis,
        date: '2026-02-14',
        splitMode: 'income',
        participantIds: [],
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Cabaña 2 noches',
        amount: 120000,
        category: 'viaje',
        paidById: ana,
        date: '2026-02-14',
        splitMode: 'income',
        participantIds: [],
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Asado y bebidas',
        amount: 35000,
        category: 'comida',
        paidById: luis,
        date: '2026-02-15',
        splitMode: 'equal',
        participantIds: [],
        createdAt: now,
      },
    ],
  }

  return {
    spaces: [hogar, viaje],
    activeSpaceId: hogar.id,
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const data = demoData()
      saveData(data)
      return data
    }
    return JSON.parse(raw) as AppData
  } catch {
    return demoData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetDemoData(): AppData {
  const data = demoData()
  saveData(data)
  return data
}
