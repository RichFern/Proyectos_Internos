import {
  JOIN_STORAGE_KEY,
  captureJoinFromWindow,
  consumePendingJoin,
  peekPendingJoin,
  readJoinIdFromSearch,
} from './joinInvite'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(readJoinIdFromSearch('?join=abc-1') === 'abc-1', 'reads join id')
assert(readJoinIdFromSearch('/?foo=1') === null, 'missing join')

const mem = new Map<string, string>()
const storage = {
  getItem: (key: string) => mem.get(key) ?? null,
  setItem: (key: string, value: string) => {
    mem.set(key, value)
  },
  removeItem: (key: string) => {
    mem.delete(key)
  },
}

let path = '/?join=casa-9'
const captured = captureJoinFromWindow(
  '?join=casa-9',
  storage,
  storage,
  (next) => {
    path = next
  },
  '/',
)
assert(captured === 'casa-9', 'captures join')
assert(path === '/', 'clears search from url')
assert(peekPendingJoin(storage) === 'casa-9', 'peek keeps id')
assert(consumePendingJoin(storage) === 'casa-9', 'consume returns id')
assert(peekPendingJoin(storage) === null, 'consume clears')
assert(mem.get(JOIN_STORAGE_KEY) == null, 'storage empty')

console.log('joinInvite tests OK')
