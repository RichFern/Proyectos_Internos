function parseEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function isAllowed(
  email: string | null | undefined,
  list: string[],
  production: boolean,
): boolean {
  if (!email) return false
  if (list.length === 0) return !production
  return list.includes(email.trim().toLowerCase())
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(parseEmails(' A@Gmail.com , b@x.com ').join(',') === 'a@gmail.com,b@x.com', 'parse')
assert(isAllowed('a@gmail.com', ['a@gmail.com'], true), 'listed is allowed')
assert(!isAllowed('otro@gmail.com', ['a@gmail.com'], true), 'unlisted is blocked')
assert(!isAllowed('a@gmail.com', [], true), 'empty list blocks in production')
assert(isAllowed('a@gmail.com', [], false), 'empty list allows in development')
assert(!isAllowed(null, ['a@gmail.com'], true), 'missing email blocked')

console.log('allowlist.test.ts OK')
