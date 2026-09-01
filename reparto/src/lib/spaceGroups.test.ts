import { buildSpaceSections } from './spaceGroups'
import type { Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const base = (kind: Space['kind'], id: string, name: string): Space => ({
  id,
  name,
  description: '',
  kind,
  members: [],
  expenses: [],
  templates: [],
  installmentPlans: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
})

const spaces: Space[] = [
  { ...base('viaje', 't1', 'Mendoza'), updatedAt: '2026-08-20' },
  { ...base('hogar', 'h1', 'Mi hogar'), updatedAt: '2026-08-28' },
  { ...base('salida', 's1', 'Cena'), updatedAt: '2026-08-15' },
  base('viajes', 'f1', 'Mis viajes'),
  { ...base('viaje', 't2', 'Playa'), parentSpaceId: 'f1', updatedAt: '2026-08-25' },
  base('salidas', 'sf1', 'Salidas'),
  { ...base('salida', 's2', 'Sushi'), parentSpaceId: 'sf1', updatedAt: '2026-08-10' },
]

const sections = buildSpaceSections(spaces)
assert(sections[0]?.id === 'hogar', 'hogar first')
assert(sections.some((s) => s.id === 'viajes'), 'viajes section')
assert(sections.some((s) => s.id === 'salidas'), 'salidas section')
const viajes = sections.find((s) => s.id === 'viajes')
assert(viajes?.folders.length === 1, 'one viajes folder')
assert(viajes?.folders[0]?.children.length === 1, 'one nested trip')
assert(viajes?.items[0]?.id === 't1', 'orphan trip recent first in items')
const salidas = sections.find((s) => s.id === 'salidas')
assert(salidas?.folders.length === 1, 'salidas folder')

console.log('spaceGroups.test.ts OK')
