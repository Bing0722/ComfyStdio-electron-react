import test from 'node:test'
import assert from 'node:assert/strict'
import { loadVersions, saveVersions } from '../src/renderer/src/features/versions/version-cache.ts'
test('version cache deduplicates loads, isolates directories and refreshes explicitly', async () => {
 let calls = 0
 const fetch = async () => ({ commit: String(++calls), tags: [] })
 const [a, b] = await Promise.all([loadVersions('a', fetch), loadVersions('a', fetch)])
 assert.equal(a, b); assert.equal(calls, 1)
 await loadVersions('a', fetch); assert.equal(calls, 1)
 await loadVersions('b', fetch); assert.equal(calls, 2)
 await loadVersions('a', fetch, true); assert.equal(calls, 3)
 saveVersions('a', { commit: 'switched' })
 assert.equal((await loadVersions('a', fetch)).commit, 'switched')
})
test('failed automatic load does not retry on page navigation', async () => {
 let calls = 0
 const fetch = async () => { calls++; throw new Error('offline') }
 await assert.rejects(loadVersions('failure', fetch))
 await assert.rejects(loadVersions('failure', fetch))
 assert.equal(calls, 1)
 await assert.rejects(loadVersions('failure', fetch, true))
 assert.equal(calls, 2)
})
