import { canAccessExpense, canAccessSpace, identityKeyFrom } from './identity'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(identityKeyFrom('User@Mail.com') === 'user@mail.com', 'google email lower')
assert(identityKeyFrom(null, { name: 'Ana' }) === 'local:ana', 'local name key')
assert(identityKeyFrom(null, { name: 'Ana', email: 'a@b.com' }) === 'a@b.com', 'local email wins')

assert(canAccessSpace({ visibility: 'shared' }, null), 'shared visible to all')
assert(canAccessSpace({ visibility: 'personal', ownerKey: 'local:ana' }, 'local:ana'), 'owner sees personal')
assert(!canAccessSpace({ visibility: 'personal', ownerKey: 'local:ana' }, 'local:ben'), 'other blocked')
assert(!canAccessSpace({ visibility: 'personal', ownerKey: 'local:ana' }, null), 'no identity blocked')

assert(
  canAccessExpense({ visibility: 'personal', ownerUid: 'uid-a' }, 'uid-a'),
  'expense owner sees personal',
)
assert(
  !canAccessExpense({ visibility: 'personal', ownerUid: 'uid-a' }, 'uid-b'),
  'other user cannot see personal expense',
)
assert(
  canAccessExpense({ visibility: 'shared', ownerUid: null }, 'uid-b'),
  'shared expense visible',
)

console.log('identity.test.ts OK')
