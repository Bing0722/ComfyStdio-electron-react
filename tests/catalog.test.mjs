import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCatalog, attachStars } from '../src/main/comfy/catalog.ts'
test('catalog accepts supported repositories, deduplicates and sorts titles', () => {
 const node = (title, url) => ({ title, files: [url], install_type: 'git-clone' })
 const result = parseCatalog({ custom_nodes: [node('Z', 'https://github.com/a/z'), node('A', 'https://github.com/a/a'), node('A', 'https://github.com/a/a'), node('Bad', 'file:///tmp/bad'), { ...node('Multi', 'https://github.com/a/m'), files: ['a', 'b'] }] })
 assert.deepEqual(result.map(x => x.title), ['A', 'Z'])
 assert.throws(() => parseCatalog({}))
})

test('star snapshots match canonical repository URLs and preserve unknown counts', () => {
 const items = [{ url: 'https://github.com/Owner/Repo.git', title: 'A' }, { url: 'https://github.com/x/y', title: 'B' }]
 const result = attachStars(items, { 'https://github.com/owner/repo': { stars: 42, last_update: '2026-11-07' } })
 assert.equal(result[0].stars, 42)
 assert.equal(result[1].stars, undefined)
 assert.equal(attachStars(items, { 'https://github.com/owner/repo': { stars: -1 } })[0].stars, undefined)
})
