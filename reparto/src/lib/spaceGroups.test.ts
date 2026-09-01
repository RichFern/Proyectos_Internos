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
  createdAt: '',
  updatedAt: '',
})

const spaces: Space[] = [
  base('viaje', 't1', 'Mendoza'),
  base('hogar', 'h1', 'Mi hogar'),
  base('salida', 's1', 'Cena'),
  base('viajes', 'f1', 'Mis viajes'),
  { ...base('viaje', 't2', 'Playa'), parentSpaceId: 'f1' },
]

const sections = buildSpaceSections(spaces)
assert(sections[0]?.id === 'hogar', 'hogar first')
assert(sections.some((s) => s.id === 'viajes'), 'viajes section')
assert(sections.some((s) => s.id === 'salidas'), 'salidas section')
const viajes = sections.find((s) => s.id === 'viajes')
assert(viajes?.folders.length === 1, 'one folder')
assert(viajes?.folders[0]?.trips.length === 1, 'one nested trip')
assert(viajes?.items.some((s) => s.id === 't1'), 'orphan trip listed')

console.log('spaceGroups.test.ts OK')
