import { isPlatformAdminEmail, parseAdminEmails } from './admin'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(parseAdminEmails(undefined).length === 0, 'empty env has no admins')
assert(parseAdminEmails('').length === 0, 'blank env has no admins')
assert(
  parseAdminEmails(' vos@gmail.com , OTRA@Gmail.com ').join(',') ===
    'vos@gmail.com,otra@gmail.com',
  'parses and lowercases admin emails',
)
assert(
  isPlatformAdminEmail('vos@gmail.com', ['vos@gmail.com']),
  'matching admin is allowed',
)
assert(
  !isPlatformAdminEmail('otro@gmail.com', ['vos@gmail.com']),
  'non-admin is not allowed',
)
assert(!isPlatformAdminEmail(null, ['vos@gmail.com']), 'missing email is not admin')

console.log('admin.test.ts OK')
