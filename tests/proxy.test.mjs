import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProxy } from '../src/shared/proxy.ts'
test('proxy protocols, direct connection, invalid destinations and credentials', () => {
 for (const protocol of ['http', 'https', 'socks5', 'socks5h']) assert.equal(validateProxy(`${protocol}://localhost:7890`), `${protocol}://localhost:7890`)
 assert.equal(validateProxy('  '), '')
 for (const value of [null, {}, 'localhost:7890', 'file:///tmp/a', 'http://localhost/path', 'http://localhost?x=1', 'http://localhost#x', 'http://user:password@localhost:7890']) assert.throws(() => validateProxy(value))
})
