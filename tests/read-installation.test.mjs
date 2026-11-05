import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readInstallation } from '../src/main/comfy/read-installation.ts'
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'comfystdio-scan-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const root = join(directory, 'ComfyUI')
  await mkdir(join(root, 'models', 'loras'), { recursive: true })
  await mkdir(join(root, 'custom_nodes'), { recursive: true })
  await writeFile(
    join(root, 'main.py'),
    'raise RuntimeError("must not execute")',
  )
  await writeFile(join(root, 'folder_paths.py'), '# test installation')
  await writeFile(join(root, 'comfyui_version.py'), '__version__ = "0.3.26"')
  return { directory, root }
}

test('reads the selected portable installation, actual models, nested model names and plugin metadata only', async (t) => {
  const { root, directory } = await fixture(t)
  await mkdir(join(root, 'models', 'loras', 'nested'))
  await writeFile(
    join(root, 'models', 'loras', 'nested', 'real.safetensors'),
    'MODEL',
  )
  await writeFile(join(root, 'models', 'loras', 'README.md'), 'not a model')
  await mkdir(join(root, 'custom_nodes', 'test-node'))
  await writeFile(
    join(root, 'custom_nodes', 'test-node', 'pyproject.toml'),
    '[project]\nname="test-node"\nversion = "2.1.0"\n[other]\nversion="wrong"',
  )
  await writeFile(
    join(root, 'custom_nodes', 'disabled.py.disabled'),
    'raise RuntimeError("must not execute")',
  )
  const result = await readInstallation(directory)
  assert.equal(result.source, 'local')
  assert.equal(result.version, 'v0.3.26')
  assert.equal(result.models.length, 1)
  assert.equal(result.models[0].type, 'LoRA')
  assert.equal(result.models[0].size, 5 / 1024 ** 3)
  assert.equal(result.plugins['test-node'].version, '2.1.0')
  assert.equal(result.plugins['disabled.py.disabled'].enabled, false)
  assert.equal(result.modelsPath, join(result.path, 'models'))
})

test('empty valid directories remain empty and invalid roots fail instead of producing seeded data', async (t) => {
  const { root } = await fixture(t)
  const result = await readInstallation(root)
  assert.deepEqual(result.models, [])
  assert.deepEqual(result.plugins, {})
  await assert.rejects(readInstallation(join(root, 'models')), /不是 ComfyUI/)
})

test('reports extra model paths and skips symbolic-link cycles without executing configuration', async (t) => {
  const { root } = await fixture(t)
  await symlink(join(root, 'models'), join(root, 'models', 'loop'))
  await writeFile(
    join(root, 'extra_model_paths.yaml'),
    'other:\n  base_path: /not-read',
  )
  const result = await readInstallation(root)
  assert.equal(
    result.warnings.some((warning) => warning.includes('符号链接')),
    true,
  )
  assert.equal(
    result.warnings.some((warning) =>
      warning.includes('extra_model_paths.yaml'),
    ),
    true,
  )
  assert.deepEqual(result.models, [])
})
