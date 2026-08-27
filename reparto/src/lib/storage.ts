import type { AppData, ExpenseTemplate, InstallmentPlan, Space } from '../types'
import { createId } from './id'
import { MEMBER_COLORS } from '../types'
import { buildInstallmentPlan } from './installments'

const STORAGE_KEY = 'reparto-data-v4'
const LEGACY_KEY = 'reparto-data-v3'

function normalizeSpace(raw: Space): Space {
  return {
    ...raw,
    visibility: raw.visibility ?? 'shared',
    ownerKey: raw.ownerKey ?? null,
    templates: raw.templates ?? [],
    members: (raw.members ?? []).map((m) => ({
      ...m,
      incomeByMonth: m.incomeByMonth ?? {},
    })),
    expenses: (raw.expenses ?? []).map((expense) => ({
      ...expense,
      visibility: expense.visibility ?? 'shared',
      ownerUid: expense.ownerUid ?? null,
    })),
    installmentPlans: raw.installmentPlans ?? [],
    settlementRecords: raw.settlementRecords ?? [],
    budgetsByMonth: raw.budgetsByMonth ?? {},
    budgetSettings: raw.budgetSettings ?? {
      type: 'category',
      recurring: false,
      defaultByCategory: {},
    },
    alertSettings: raw.alertSettings ?? {
      dueEnabled: true,
      dueDays: 10,
      budgetEnabled: true,
    },
  }
}

export function starterData(): AppData {
  const now = new Date().toISOString()
  const home: Space = {
    id: createId(),
    name: 'Mi hogar',
    description: 'Gastos compartidos del hogar',
    kind: 'hogar',
    visibility: 'shared',
    ownerKey: null,
    ownerUid: null,
    members: [],
    expenses: [],
    templates: [],
    installmentPlans: [],
    settlementRecords: [],
    budgetsByMonth: {},
    budgetSettings: {
      type: 'category',
      recurring: false,
      defaultByCategory: {},
    },
    alertSettings: {
      dueEnabled: true,
      dueDays: 10,
      budgetEnabled: true,
    },
    createdAt: now,
    updatedAt: now,
  }
  return { spaces: [home], activeSpaceId: home.id }
}

function demoData(): AppData {
  // Solo se usa en desarrollo local (sin Firebase) para probar la UI.
  const ana = createId()
  const luis = createId()
  const sofia = createId()
  const now = new Date().toISOString()

  const tplAlquiler = createId()
  const tplLuz = createId()
  const tplSuper = createId()

  const { plan: heladeraPlan, expenses: heladeraCuotas } = buildInstallmentPlan({
    description: 'Heladera',
    category: 'compras',
    totalAmount: 600000,
    installmentCount: 6,
    paidById: ana,
    splitMode: 'income',
    participantIds: [],
    startDate: '2026-07-10',
    notes: 'Compra en 6 cuotas',
  })

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

  const installmentPlans: InstallmentPlan[] = [heladeraPlan]

  const hogar: Space = {
    id: createId(),
    name: 'Casa compartida',
    description: 'Gastos del mes: alquiler, comida y servicios',
    kind: 'hogar',
    createdAt: now,
    updatedAt: now,
    members: [
      {
        id: ana,
        name: 'Patricia',
        income: 850000,
        incomeByMonth: { '2026-08': 920000 },
        color: MEMBER_COLORS[0],
        createdAt: now,
      },
      {
        id: luis,
        name: 'Richard',
        income: 620000,
        color: MEMBER_COLORS[1],
        createdAt: now,
      },
      {
        id: sofia,
        name: 'Sofía',
        income: 480000,
        color: MEMBER_COLORS[2],
        createdAt: now,
      },
    ],
    templates,
    installmentPlans,
    expenses: [
      {
        id: createId(),
        description: 'Alquiler',
        amount: 450000,
        category: 'vivienda',
        paidById: ana,
        date: '2026-08-01',
        dueDate: '2026-08-05',
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
        dueDate: '2026-08-15',
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
        notes: 'Solo Patricia y Richard',
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Auriculares (personal)',
        amount: 45000,
        category: 'compras',
        paidById: sofia,
        date: '2026-08-09',
        splitMode: 'equal',
        participantIds: [sofia],
        notes: 'Solo Sofía — no se reparte',
        createdAt: now,
      },
      {
        id: createId(),
        description: 'Alquiler',
        amount: 450000,
        category: 'vivienda',
        paidById: ana,
        date: '2026-07-01',
        dueDate: '2026-07-05',
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
        dueDate: '2026-07-20',
        splitMode: 'equal',
        participantIds: [],
        createdAt: now,
      },
      ...heladeraCuotas.map((e) => ({
        ...e,
        id: createId(),
        createdAt: now,
      })),
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
    installmentPlans: [],
    members: [
      { id: ana, name: 'Patricia', income: 850000, color: MEMBER_COLORS[0], createdAt: now },
      { id: luis, name: 'Richard', income: 620000, color: MEMBER_COLORS[1], createdAt: now },
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

  const demoMemberId = createId()
  const personal: Space = {
    id: createId(),
    name: 'Mis gastos personales',
    description: 'Solo tú puedes ver este espacio',
    kind: 'otro',
    visibility: 'personal',
    ownerKey: 'local:demo',
    createdAt: now,
    updatedAt: now,
    templates: [],
    installmentPlans: [],
    settlementRecords: [],
    budgetsByMonth: { '2026-08': { comida: 50000, entretenimiento: 20000 } },
    members: [
      {
        id: demoMemberId,
        name: 'Demo',
        income: 500000,
        color: MEMBER_COLORS[3],
        createdAt: now,
      },
    ],
    expenses: [
      {
        id: createId(),
        description: 'Suscripción streaming',
        amount: 8500,
        category: 'entretenimiento',
        paidById: demoMemberId,
        date: '2026-08-03',
        splitMode: 'equal',
        participantIds: [demoMemberId],
        createdAt: now,
      },
    ],
  }

  return {
    spaces: [hogar, viaje, personal],
    activeSpaceId: hogar.id,
    localIdentity: { name: 'Demo' },
  }
}

export function loadData(): AppData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY)
    }
    if (!raw) {
      const data = starterData()
      saveData(data)
      return data
    }
    const parsed = JSON.parse(raw) as AppData
    return {
      ...parsed,
      localIdentity: parsed.localIdentity ?? null,
      spaces: (parsed.spaces ?? []).map(normalizeSpace),
    }
  } catch {
    return starterData()
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
