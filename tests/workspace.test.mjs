import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorkspace,
  createDemoInstallation,
  modelCatalog,
} from '../src/renderer/src/state/demo-data.ts'
import {
  workspaceReducer as reduce,
  contextLockReason,
} from '../src/renderer/src/state/workspace-reducer.ts'
const tick = (state) => reduce(state, { type: 'tick' })
const loaded = (installation = createDemoInstallation()) =>
  reduce(
    reduce(createWorkspace(), { type: 'comfy/read-start', requestId: 1 }),
    { type: 'comfy/read-success', requestId: 1, installation },
  )

test('no local inventory or business mutation exists before reading ComfyUI', () => {
  const state = createWorkspace()
  assert.equal(state.comfy, null)
  for (const action of [
    { type: 'download/add', model: modelCatalog[0] },
    { type: 'plugin/install', name: 'node' },
    { type: 'version/change', version: 'nightly', kind: 'switch' },
    { type: 'runtime/status', status: '启动中' },
  ])
    assert.equal(reduce(state, action), state)
})

test('read failure clears the old inventory and stale read responses cannot overwrite current context', () => {
  let state = reduce(loaded(), { type: 'comfy/read-start', requestId: 2 })
  assert.equal(
    reduce(state, {
      type: 'comfy/read-success',
      requestId: 1,
      installation: createDemoInstallation(),
    }),
    state,
  )
  state = reduce(state, {
    type: 'comfy/read-failure',
    requestId: 2,
    error: 'invalid directory',
  })
  assert.equal(state.comfy, null)
  assert.equal(state.read.phase, 'failed')
  assert.equal(
    reduce(state, {
      type: 'comfy/read-success',
      requestId: 2,
      installation: createDemoInstallation(),
    }),
    state,
  )
})

test('cancelled folder selection preserves the current installation; successful replacement clears prior assets', () => {
  const first = loaded()
  let state = reduce(first, { type: 'comfy/read-start', requestId: 2 })
  state = reduce(state, { type: 'comfy/read-cancel', requestId: 2 })
  assert.equal(state.comfy, first.comfy)
  state = reduce(state, { type: 'comfy/read-start', requestId: 3 })
  state = reduce(state, {
    type: 'comfy/read-success',
    requestId: 3,
    installation: {
      ...createDemoInstallation(),
      path: '/replacement/ComfyUI',
      models: [],
      plugins: {},
    },
  })
  assert.deepEqual(state.comfy.models, [])
  assert.deepEqual(state.comfy.plugins, {})
  assert.equal(state.comfy.path, '/replacement/ComfyUI')
})

test('downloads belong to one root and retain progress through pause/failure; completion adds a model only to demo inventory', () => {
  let state = reduce(loaded(), { type: 'download/add', model: modelCatalog[0] })
  assert.equal(state.downloads[0].comfyPath, state.comfy.path)
  assert.ok(
    state.downloads[0].targetPath.startsWith(
      state.comfy.modelsPath + '/checkpoints/',
    ),
  )
  state = tick(tick(state))
  for (const phase of ['暂停', '失败']) {
    state = reduce(state, { type: 'download/status', id: 'flux-dev', phase })
    assert.equal(tick(state).downloads[0].progress, 5)
    assert.equal(
      reduce(state, { type: 'comfy/read-start', requestId: 2 }),
      state,
    )
  }
  state = reduce(state, {
    type: 'download/status',
    id: 'flux-dev',
    phase: '下载中',
  })
  for (let i = 0; i < 25; i++) state = tick(state)
  assert.equal(
    state.comfy.models.filter((model) => model.id === 'flux-dev').length,
    1,
  )
  state = reduce(state, { type: 'model/remove', id: 'flux-dev' })
  assert.equal(
    tick(state).comfy.models.some((model) => model.id === 'flux-dev'),
    false,
  )
})

test('version switch and update operate on the same program and preserve its inventory; busy operations are guarded', () => {
  let state = loaded()
  const models = state.comfy.models
  const plugins = state.comfy.plugins
  const root = state.comfy.path
  state = reduce(state, { type: 'runtime/status', status: '启动中' })
  assert.ok(contextLockReason(state))
  assert.equal(
    reduce(state, {
      type: 'version/change',
      version: 'v0.3.26',
      kind: 'update',
    }),
    state,
  )
  state = reduce(state, { type: 'runtime/status', status: '已停止' })
  assert.equal(tick(state).runtime.status, '已停止')
  for (const [version, kind] of [
    ['v0.3.26', 'update'],
    ['nightly', 'switch'],
  ]) {
    state = reduce(state, { type: 'version/change', version, kind })
    assert.equal(
      reduce(state, { type: 'runtime/status', status: '启动中' }),
      state,
    )
    state = tick(state)
    assert.equal(state.comfy.version, version)
    assert.equal(state.comfy.path, root)
    assert.deepEqual(state.comfy.models, models)
    assert.deepEqual(state.comfy.plugins, plugins)
  }
})

test('local scan data is not modified by demo downloads, plugin operations, deletion, or version changes', () => {
  let state = loaded({
    ...createDemoInstallation(),
    source: 'local',
    models: [],
    plugins: {},
  })
  for (const action of [
    { type: 'plugin/install', name: 'node' },
    { type: 'version/change', version: 'nightly', kind: 'switch' },
    { type: 'model/remove', id: 'sdxl-base' },
  ])
    assert.equal(reduce(state, action), state)
  state = reduce(state, { type: 'download/add', model: modelCatalog[0] })
  for (let i = 0; i < 25; i++) state = tick(state)
  assert.equal(state.downloads[0].phase, '完成')
  assert.deepEqual(state.comfy.models, [])
})

test('plugin updates retain disabled status inside the current ComfyUI', () => {
  let state = loaded()
  const name = 'ComfyUI Manager'
  state = reduce(state, { type: 'plugin/toggle', name })
  assert.equal(state.comfy.plugins[name].updateAvailable, true)
  state = reduce(state, { type: 'plugin/update', name })
  assert.equal(state.comfy.plugins[name].enabled, false)
  assert.equal(state.comfy.plugins[name].version, '1.1')
})
