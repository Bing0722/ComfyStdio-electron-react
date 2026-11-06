import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, rename, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { managePlugin } from '../src/main/comfy/plugins.ts'
test('delete validates plugin boundary and delegates to recoverable trash', async t => {
 const root = await mkdtemp(join(tmpdir(), 'plugin-delete-'))
 t.after(() => rm(root, { recursive: true, force: true }))
 const target = join(root, 'custom_nodes', 'example.disabled')
 await mkdir(target, { recursive: true })
 let trashed
 await assert.rejects(managePlugin(root, undefined, 'delete', '../escape', '', () => {}, async () => assert.fail()))
 await managePlugin(root, undefined, 'delete', 'example.disabled', '', () => {}, async path => { trashed = path; await rename(path, join(root, 'trash')) })
 assert.equal(trashed, target)
 await assert.rejects(access(target))
 await access(join(root, 'trash'))
})
