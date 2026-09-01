import { isCloudConfigured } from './cloudConfig'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// Sin env → no cloud
assert(isCloudConfigured() === false, 'no cloud by default')

console.log('cloudConfig tests OK')
