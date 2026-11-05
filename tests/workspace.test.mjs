import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorkspace,
  modelCatalog,
} from '../src/renderer/src/state/demo-data.ts'
import { workspaceReducer as reduce } from '../src/renderer/src/state/workspace-reducer.ts'

const tick = (state) => reduce(state, { type: 'tick' })

test('paused and failed downloads retain progress; completion adds one model', () => {
  let state = reduce(createWorkspace(), {
    type: 'download/add',
    model: modelCatalog[0],
  })
  state = tick(tick(state))
  assert.equal(state.downloads[0].progress, 5)
  for (const phase of ['暂停', '失败']) {
    state = reduce(state, { type: 'download/status', id: 1, phase })
    state = tick(state)
    assert.equal(state.downloads[0].progress, 5)
  }
  state = reduce(state, { type: 'download/status', id: 1, phase: '下载中' })
  for (let count = 0; count < 25; count++) state = tick(state)
  assert.equal(state.downloads[0].phase, '完成')
  assert.equal(state.models.filter((model) => model.id === 1).length, 1)
  state = reduce(state, { type: 'model/remove', id: 1 })
  state = tick(state)
  assert.equal(
    state.models.some((model) => model.id === 1),
    false,
  )
})

test('stopped and failed instances do not transition to running on the next tick', () => {
  for (const status of ['已停止', '失败']) {
    let state = reduce(createWorkspace(), {
      type: 'instance/status',
      id: 'studio',
      status: '启动中',
    })
    state = reduce(state, { type: 'instance/status', id: 'studio', status })
    assert.equal(tick(state).instances[0].status, status)
  }
  let state = reduce(createWorkspace(), {
    type: 'instance/status',
    id: 'studio',
    status: '启动中',
  })
  state = reduce(state, { type: 'instance/select', id: 'lab' })
  state = tick(state)
  assert.equal(state.instanceId, 'lab')
  assert.equal(state.instances[0].status, '运行中')
  assert.equal(state.instances[1].status, '已停止')
})

test('versions in use cannot be removed; running instances cannot switch', () => {
  let state = createWorkspace()
  state = reduce(state, { type: 'version/remove', version: 'v0.3.26' })
  assert.deepEqual(state.versions, ['v0.3.26'])
  state = reduce(state, { type: 'version/install', version: 'v0.3.25' })
  state = reduce(state, {
    type: 'instance/status',
    id: 'studio',
    status: '启动中',
  })
  state = reduce(state, {
    type: 'version/switch',
    id: 'studio',
    version: 'v0.3.25',
  })
  assert.equal(state.instances[0].version, 'v0.3.26')
  state = reduce(state, {
    type: 'instance/status',
    id: 'studio',
    status: '已停止',
  })
  state = reduce(state, {
    type: 'version/switch',
    id: 'studio',
    version: 'v0.3.25',
  })
  assert.equal(state.instances[0].version, 'v0.3.25')
  state = reduce(state, { type: 'version/remove', version: 'v0.3.25' })
  assert.equal(state.versions.includes('v0.3.25'), true)
})

test('plugin toggle preserves update availability and instance isolation', () => {
  let state = createWorkspace()
  const name = 'ComfyUI Manager'
  state = reduce(state, { type: 'plugin/toggle', instanceId: 'studio', name })
  assert.equal(state.plugins.studio[name].enabled, false)
  assert.equal(state.plugins.studio[name].updateAvailable, true)
  state = reduce(state, { type: 'plugin/update', instanceId: 'studio', name })
  assert.equal(state.plugins.studio[name].enabled, false)
  assert.equal(state.plugins.studio[name].version, '1.1')
  assert.deepEqual(state.plugins.lab, {})
})
