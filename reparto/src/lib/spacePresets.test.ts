import { categoriesForSpace } from './categories'
import {
  childSpacesOf,
  childKindForFolder,
  isFolderSpace,
  presetForSpace,
  SPACE_PRESETS,
} from './spacePresets'
import type { Space } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(SPACE_PRESETS.viaje.defaultSplitMode === 'equal', 'viaje split')
assert(SPACE_PRESETS.viaje.requiresIncome === false, 'viaje income')
assert(SPACE_PRESETS.salida.defaultSplitMode === 'equal', 'salida split')
assert(SPACE_PRESETS.hogar.requiresIncome === true, 'hogar income')
assert(isFolderSpace({ kind: 'viajes' }), 'viajes folder')
assert(isFolderSpace({ kind: 'salidas' }), 'salidas folder')
assert(isFolderSpace({ kind: 'eventos' }), 'eventos folder')
assert(isFolderSpace({ kind: 'otros' }), 'otros folder')
assert(!isFolderSpace({ kind: 'viaje' }), 'viaje not folder')
assert(childKindForFolder('salidas') === 'salida', 'salidas child')

const tripCategories = categoriesForSpace({ kind: 'viaje' }).map((item) => item.id)
assert(tripCategories.includes('transporte'), 'viaje transporte')
assert(!tripCategories.includes('vivienda'), 'viaje no vivienda')

const salidaCategories = categoriesForSpace({ kind: 'salida' }).map((item) => item.id)
assert(
  salidaCategories.join(',') === 'comida,entretenimiento,otros',
  'salida categories',
)

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
assert(childSpacesOf([folder, trip], 'f1').length === 1, 'child count')
assert(presetForSpace({ kind: 'salida' }).peopleLabel === 'Quién va', 'salida label')

console.log('spacePresets.test.ts OK')
