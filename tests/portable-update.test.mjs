import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import {
  portableRoot,
  preparePortable,
  runtimeEnvironment,
} from '../src/main/portable/paths.ts'
import { readCurrentPath, saveCurrentPath } from '../src/main/portable/state.ts'
import {
  newerVersion,
  selectAsset,
  releaseBase,
} from '../src/main/updates/release.ts'
import { saveUpdate } from '../src/main/updates/download.ts'
test('portable state and standard caches stay under application folder, relative context survives relocation', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'comfy-portable-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const paths = preparePortable(root)
  assert.equal(paths.comfy, join(paths.root, 'ComfyUI'))
  for (const path of Object.values(runtimeEnvironment(paths)))
    assert(path.startsWith(paths.data))
  saveCurrentPath(paths, paths.comfy)
  assert.equal(
    JSON.parse(await readFile(join(paths.data, 'workspace.json'), 'utf8'))
      .comfy,
    'ComfyUI',
  )
  assert.equal(
    readCurrentPath({ ...paths, root: join(paths.root, 'moved') }),
    join(paths.root, 'moved', 'ComfyUI'),
  )
  assert.equal(
    portableRoot(
      '/Apps/ComfyStdio/ComfyStdio.app/Contents/MacOS/ComfyStdio',
      'darwin',
    ),
    '/Apps/ComfyStdio',
  )
})
test('updates compare stable numeric versions and only select matching verified official assets', () => {
  assert(newerVersion('v0.10.0', '0.7.0'))
  assert(!newerVersion('v0.7.0', '0.7.0'))
  assert(!newerVersion('v1.0.0-beta', '0.7.0'))
  const asset = {
    name: 'ComfyStdio-0.8.0-win32-x64.zip',
    browser_download_url: releaseBase + 'v0.8.0/file.zip',
    size: 10,
    digest: 'sha256:' + 'a'.repeat(64),
  }
  assert.equal(
    selectAsset({ tag_name: 'v0.8.0', assets: [asset] }, 'win32', 'x64'),
    asset,
  )
  assert.equal(
    selectAsset({ tag_name: 'v0.8.0', assets: [asset] }, 'darwin', 'arm64'),
    undefined,
  )
  assert.equal(
    selectAsset(
      { tag_name: 'v0.8.0', assets: [{ ...asset, digest: '' }] },
      'win32',
      'x64',
    ),
    undefined,
  )
  assert.equal(
    selectAsset(
      {
        tag_name: 'v0.8.0',
        assets: [
          { ...asset, browser_download_url: 'https://example.com/x.zip' },
        ],
      },
      'win32',
      'x64',
    ),
    undefined,
  )
})
test('verified downloads become archives; digest mismatch removes partial content and preserves prior archive', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'comfy-update-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const bytes = Buffer.from('zip fixture'),
    file = join(root, 'update.zip')
  const asset = {
    size: bytes.length,
    digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
  }
  await saveUpdate(new Response(bytes), asset, file)
  assert.equal(await readFile(file, 'utf8'), 'zip fixture')
  await assert.rejects(
    saveUpdate(new Response(Buffer.from('bad fixture')), asset, file),
  )
  assert.equal(await readFile(file, 'utf8'), 'zip fixture')
  await assert.rejects(access(file + '.part'))
})
