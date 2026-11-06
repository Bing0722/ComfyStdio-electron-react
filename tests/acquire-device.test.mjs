import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquireComfy } from '../src/main/comfy/acquire.ts'
import { parseNvidia, command } from '../src/main/device/read-device.ts'
test('acquisition creates one program and never replaces an existing directory', async () => {
 const root = await mkdtemp(join(tmpdir(), 'comfy-acquire-'))
 try {
  const path = await acquireComfy(root, new AbortController().signal, async path => writeFile(join(path, 'main.py'), 'fixture'))
  await assert.rejects(acquireComfy(root, new AbortController().signal, async () => assert.fail('must not clone')), /已有/)
  assert.equal(await readFile(join(path, 'main.py'), 'utf8'), 'fixture')
 } finally { await rm(root, { recursive: true, force: true }) }
})
test('failed and cancelled acquisition cleans its own partial directory for retry', async () => {
 const root = await mkdtemp(join(tmpdir(), 'comfy-acquire-'))
 try {
  const controller = new AbortController()
  await assert.rejects(acquireComfy(root, controller.signal, async (path, signal) => { await writeFile(join(path, 'partial'), 'partial'); controller.abort(); assert.equal(signal.aborted, true); throw new Error('cancelled') }), /cancelled/)
  await assert.rejects(access(join(root, 'ComfyUI')))
  await acquireComfy(root, new AbortController().signal, async () => {})
 } finally { await rm(root, { recursive: true, force: true }) }
})
test('NVIDIA parser handles multiple cards and absent tools degrade gracefully', async () => {
 assert.deepEqual(parseNvidia('NVIDIA RTX 4090, 570.1, 24564\nNVIDIA RTX 3090, 570.1, 24576'), [{ name:'NVIDIA RTX 4090', driver:'570.1', memory:'24564 MiB' }, { name:'NVIDIA RTX 3090', driver:'570.1', memory:'24576 MiB' }])
 assert.deepEqual(parseNvidia(''), [])
 assert.equal(await command('comfystdio-nonexistent-test-tool', []), '')
})
