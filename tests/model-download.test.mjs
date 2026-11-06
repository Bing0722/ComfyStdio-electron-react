import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { modelCatalog, downloadModel } from '../src/main/comfy/model-download.ts'
test('model downloads save complete files without overwriting and clean failed partials', async t => {
 const root = await mkdtemp(join(tmpdir(), 'model-download-'))
 t.after(() => rm(root, { recursive: true, force: true }))
 const data = { name: 'Example', type: 'checkpoint', save_path: 'default', filename: 'a.safetensors', url: 'https://example.com/a' }
 const [model] = modelCatalog({ models: [data] })
 assert.equal(model.folder, 'checkpoints')
 assert.equal(modelCatalog({ models: [{ ...data, save_path: '../outside' }] }).length, 0)
 const fetch = async () => new Response('fixture', { headers: { 'content-length': '7' } })
 const target = await downloadModel(root, model, fetch, () => {})
 assert.equal(await readFile(target, 'utf8'), 'fixture')
 await assert.rejects(downloadModel(root, model, fetch, () => {}))
 await assert.rejects(downloadModel(root, { ...model, filename: 'bad.safetensors' }, async () => new Response('x', { headers: { 'content-length': '100' } }), () => {}))
 assert.deepEqual(await readdir(join(root, 'models/checkpoints')), ['a.safetensors'])
})
