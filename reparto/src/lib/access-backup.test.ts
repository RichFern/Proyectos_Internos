import { hashPin, setPin, verifyPin, clearAccessConfig, loadAccessConfig } from './access'
import { buildBackup, parseBackup } from './backup'
import { saveData, loadData, resetDemoData } from './storage'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function mockStorage() {
  const map = new Map<string, string>()
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
    clear: () => map.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true })
}

async function run() {
  mockStorage()
  clearAccessConfig()
  await setPin('1234', 'Ana y Luis')
  assert(await verifyPin('1234'), 'pin ok')
  assert(!(await verifyPin('9999')), 'pin bad')
  const cfg = loadAccessConfig()
  assert(cfg?.allowedPeople === 'Ana y Luis', 'people note')
  const h = await hashPin('1234', cfg!.salt)
  assert(h === cfg!.pinHash, 'hash match')

  resetDemoData()
  const backup = buildBackup('test')
  assert(backup.app === 'a-la-par', 'backup app')
  assert(backup.data.spaces.length >= 1, 'has spaces')
  const round = parseBackup(JSON.stringify(backup))
  saveData(round.data)
  assert(loadData().spaces.length === round.data.spaces.length, 'restore')

  clearAccessConfig()
  console.log('access+backup tests OK')
}

void run()
