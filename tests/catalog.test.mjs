import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCatalog } from '../src/main/comfy/catalog.ts'
test('catalog accepts supported repositories, deduplicates and sorts titles', () => {
 const node = (title, url) => ({ title, files: [url], install_type: 'git-clone' })
 const result = parseCatalog({ custom_nodes: [node('Z', 'https://github.com/a/z'), node('A', 'https://github.com/a/a'), node('A', 'https://github.com/a/a'), node('Bad', 'file:///tmp/bad'), { ...node('Multi', 'https://github.com/a/m'), files: ['a', 'b'] }] })
 assert.deepEqual(result.map(x => x.title), ['A', 'Z'])
 assert.throws(() => parseCatalog({}))
})
