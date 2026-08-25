import type { AppData, ExpenseTemplate, Space } from '../types'
import { createId } from './id'
import { MEMBER_COLORS } from '../types'

const STORAGE_KEY = 'reparto-data-v2'

function normalizeSpace(raw: Space): Space {
  return {
    ...raw,
    templates: raw.templates ?? [],
    members: raw.members ?? [],
    expenses: raw.expenses ?? [],
  }
}

function demoData(): AppData {
  const ana = createId()
  const luis = createId()
  const sofia = createId()
  const now = new Date().toISOString()

  const tplAlquiler = createId()
  const tplLuz = createId()
  const tplSuper = createId()

  const templates: ExpenseTemplate[] = [
    {
      id: tplAlquiler,
      description: 'Alquiler',
      amount: 450000,
      category: 'vivienda',
      paidById: ana,
      splitMode: 'income',
      participantIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: tplLuz,
      description: 'Luz y gas',
      amount: 42000,
      category: 'servicios',
      paidById: sofia,
      splitMode: 'equal',
      participantIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: tplSuper,
      description: 'Supermercado',
      amount: 90000,
      category: 'comida',
      paidById: luis,
      splitMode: 'income',
      participantIds: [],
      notes: 'Compra del mes',
      createdAt: now,
      updatedAt: now,
    },
  ]

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
    templates,
    expenses: [
      {
        id: createId(),
        description: 'Alquiler',
        amount: 450000,
        category: 'vivienda',
        paidById: ana,
        date: '2026-08-01',
        splitMode: 'income',
        participantIds: [],
        templateId: tplAlquiler,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Supermercado',
        amount: 98500,
        category: 'comida',
        paidById: luis,
        date: '2026-08-08',
        splitMode: 'income',
        participantIds: [],
        notes: 'Verdulería + carnicería',
        templateId: tplSuper,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Luz y gas',
        amount: 46500,
        category: 'servicios',
        paidById: sofia,
        date: '2026-08-05',
        splitMode: 'equal',
        participantIds: [],
        templateId: tplLuz,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Salida al cine',
        amount: 28500,
        category: 'entretenimiento',
        paidById: luis,
        date: '2026-08-12',
        splitMode: 'equal',
        participantIds: [ana, luis],
        notes: 'Solo Ana y Luis',
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Alquiler',
        amount: 450000,
        category: 'vivienda',
        paidById: ana,
        date: '2026-07-01',
        splitMode: 'income',
        participantIds: [],
        templateId: tplAlquiler,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Supermercado',
        amount: 87200,
        category: 'comida',
        paidById: luis,
        date: '2026-07-10',
        splitMode: 'income',
        participantIds: [],
        templateId: tplSuper,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Luz y gas',
        amount: 39800,
        category: 'servicios',
        paidById: sofia,
        date: '2026-07-04',
        splitMode: 'equal',
        participantIds: [],
        templateId: tplLuz,
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Internet',
        amount: 28000,
        category: 'servicios',
        paidById: ana,
        date: '2026-07-15',
        splitMode: 'equal',
        participantIds: [],
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
    templates: [],
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
    const parsed = JSON.parse(raw) as AppData
    return {
      ...parsed,
      spaces: (parsed.spaces ?? []).map(normalizeSpace),
    }
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
