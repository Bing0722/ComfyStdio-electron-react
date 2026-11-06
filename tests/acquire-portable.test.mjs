import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquirePortable } from '../src/main/comfy/acquire-portable.ts'
import { findEmbeddedPython } from '../src/main/runtime/python.ts'

const folder = 'ComfyUI_windows_portable'
const name = folder + '_nvidia.7z'
const url = 'https://github.com/Comfy-Org/ComfyUI/releases/download/v1.2.3/' + name
const bytes = Buffer.from('portable fixture')
const asset = {
  name,
  browser_download_url: url,
  size: bytes.length,
  digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
}

function fetchFixture(releaseAsset = asset) {
  return async (input, options) => {
    options.signal.throwIfAborted()
    if (input === 'https://api.github.com/repos/Comfy-Org/ComfyUI/releases/latest')
      return Response.json({ tag_name: 'v1.2.3', assets: [releaseAsset] })
    assert.equal(input, url)
    return new Response(bytes)
  }
}

async function extractFixture(_archive, destination) {
  const program = join(destination, folder, 'ComfyUI')
  const python = join(destination, folder, 'python_embeded')
  await mkdir(program, { recursive: true })
  await mkdir(python, { recursive: true })
  await writeFile(join(program, 'main.py'), '')
  await writeFile(join(program, 'folder_paths.py'), '')
  await writeFile(join(python, 'python.exe'), '')
}

test('verified portable distribution installs beside source and reuses its embedded Python', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'comfy-portable-download-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'ComfyUI'))
  const destination = join(root, folder)
  const signal = new AbortController().signal
  const progress = []
  assert.equal(await acquirePortable(destination, signal, fetchFixture(), extractFixture, value => progress.push(value)), destination)
  assert.equal(progress[0].step, '查询官方版本')
  const downloaded = progress.find(value => value.received === bytes.length)
  assert.equal(downloaded.total, bytes.length)
  assert(progress.some(value => value.step === '校验通过，正在解压'))
  assert.equal(progress.at(-1).step, '保存便携版')
  assert.deepEqual((await readdir(root)).sort(), ['ComfyUI', folder])
  assert.equal(
    await findEmbeddedPython(join(destination, 'ComfyUI'), 'win32'),
    join(destination, 'python_embeded', 'python.exe'),
  )
  assert.equal(await acquirePortable(destination, signal, () => assert.fail('already installed')), destination)
})

test('portable acquisition rejects unofficial or corrupt archives and removes cancelled staging', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'comfy-portable-fail-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const destination = join(root, folder)
  const controller = new AbortController()
  const noExtract = () => assert.fail('unverified archive must not be extracted')
  await assert.rejects(
    acquirePortable(destination, controller.signal, fetchFixture({ ...asset, browser_download_url: 'https://example.com/file.7z' }), noExtract),
    /没有可校验/,
  )
  await assert.rejects(
    acquirePortable(destination, controller.signal, fetchFixture({ ...asset, digest: 'sha256:' + 'a'.repeat(64) }), noExtract),
    /校验失败/,
  )
  await assert.rejects(
    acquirePortable(destination, controller.signal, fetchFixture(), async (archive, path) => {
      await extractFixture(archive, path)
      controller.abort()
    }),
    { name: 'AbortError' },
  )
  assert.deepEqual(await readdir(root), [])
  await acquirePortable(destination, new AbortController().signal, fetchFixture(), extractFixture)
})
