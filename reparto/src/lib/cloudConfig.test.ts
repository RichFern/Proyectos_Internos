import { getAllowedEmails, isEmailAllowed, isCloudConfigured } from './cloudConfig'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// Sin env → no cloud
assert(isCloudConfigured() === false, 'no cloud by default')
assert(getAllowedEmails().length === 0, 'no emails')
assert(isEmailAllowed('a@gmail.com') === false, 'deny without list')

console.log('cloudConfig tests OK')
