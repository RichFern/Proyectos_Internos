import assert from 'node:assert/strict'
import { categoriesForSpace } from './categories'
import {
  childSpacesOf,
  isFolderSpace,
  presetForSpace,
  SPACE_PRESETS,
} from './spacePresets'
import type { Space } from '../types'

assert.equal(SPACE_PRESETS.viaje.defaultSplitMode, 'equal')
assert.equal(SPACE_PRESETS.viaje.requiresIncome, false)
assert.equal(SPACE_PRESETS.salida.defaultSplitMode, 'equal')
assert.equal(SPACE_PRESETS.hogar.requiresIncome, true)
assert.equal(isFolderSpace({ kind: 'viajes' }), true)
assert.equal(isFolderSpace({ kind: 'viaje' }), false)

const tripCategories = categoriesForSpace({ kind: 'viaje' }).map((item) => item.id)
assert(tripCategories.includes('transporte'))
assert(!tripCategories.includes('vivienda'))

const salidaCategories = categoriesForSpace({ kind: 'salida' }).map((item) => item.id)
assert.deepEqual(salidaCategories, ['comida', 'entretenimiento', 'otros'])

const folder: Space = {
  id: 'f1',
  name: 'Mis viajes',
  description: '',
  kind: 'viajes',
  members: [],
  expenses: [],
  templates: [],
  installmentPlans: [],
  createdAt: '',
  updatedAt: '',
}
const trip: Space = {
  ...folder,
  id: 't1',
  name: 'Mendoza',
  kind: 'viaje',
  parentSpaceId: 'f1',
}
assert.equal(childSpacesOf([folder, trip], 'f1').length, 1)
assert.equal(presetForSpace({ kind: 'salida' }).peopleLabel, 'Quién va')

console.log('spacePresets.test.ts OK')
