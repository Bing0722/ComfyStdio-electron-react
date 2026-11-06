import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkspace } from '../src/renderer/src/state/initial-state.ts'
import {
  workspaceReducer as reduce,
  contextLockReason,
} from '../src/renderer/src/state/workspace-reducer.ts'
const installation = {
  path: '/test/ComfyUI',
  modelsPath: '/test/ComfyUI/models',
  pluginsPath: '/test/ComfyUI/custom_nodes',
  version: 'v1',
  source: 'local',
  readAt: '',
  models: [],
  plugins: {},
  warnings: [],
}
test('workspace starts empty without seeded assets or simulated tasks', () => {
  const state = createWorkspace()
  assert.equal(state.comfy, null)
  assert.equal(state.runtime.status, '已停止')
  assert.equal('downloads' in state, false)
})
test('read cancellation, failure and stale responses preserve correct context', () => {
  let state = reduce(createWorkspace(), {
    type: 'comfy/read-start',
    requestId: 1,
  })
  state = reduce(state, {
    type: 'comfy/read-success',
    requestId: 1,
    installation,
  })
  state = reduce(state, { type: 'comfy/read-start', requestId: 2 })
  assert.equal(
    reduce(state, {
      type: 'comfy/read-success',
      requestId: 1,
      installation: { ...installation, path: 'wrong' },
    }),
    state,
  )
  state = reduce(state, { type: 'comfy/read-cancel', requestId: 2 })
  assert.equal(state.comfy.path, installation.path)
  state = reduce(state, { type: 'comfy/read-start', requestId: 3 })
  state = reduce(state, {
    type: 'comfy/read-failure',
    requestId: 3,
    error: 'invalid',
  })
  assert.equal(state.comfy, null)
  assert.equal(state.read.phase, 'failed')
})
test('live process status locks reads without any timer driven readiness', () => {
  let state = createWorkspace()
  for (const status of ['启动中', '运行中', '停止中']) {
    state = reduce(state, { type: 'runtime/live', status })
    assert(contextLockReason(state))
    assert.equal(
      reduce(state, { type: 'comfy/read-start', requestId: 1 }),
      state,
    )
  }
  state = reduce(state, { type: 'runtime/live', status: '已停止' })
  assert.equal(contextLockReason(state), '')
})
