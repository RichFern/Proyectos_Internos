import { addCustomCategory, categoryLabel, slugCategory } from './categories'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(slugCategory('Farmacia') === 'farmacia', 'slug')
assert(slugCategory('  Luz y gas ') === 'luz-y-gas', 'slug spaces')
assert(categoryLabel('comida') === 'Comida', 'builtin')
assert(categoryLabel('farmacia', [{ id: 'farmacia', label: 'Farmacia' }]) === 'Farmacia', 'custom')

const added = addCustomCategory([], 'Farmacia')
assert(added?.id === 'farmacia', 'add id')
assert(added?.next[0].label === 'Farmacia', 'add label')
const again = addCustomCategory(added!.next, 'farmacia')
assert(again?.next.length === 1, 'no dup')

console.log('categories tests OK')
