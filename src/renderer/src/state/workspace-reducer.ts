import type { WorkspaceState, WorkspaceAction } from './types'
export function contextLockReason(state: WorkspaceState) {
  if (state.read.phase === 'reading') return '正在读取 ComfyUI，请稍后重试。'
  if (['启动中', '运行中', '停止中'].includes(state.runtime.status))
    return '请先停止 ComfyUI。'
  return ''
}
export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  if (action.type === 'runtime/live')
    return { ...state, runtime: { status: action.status } }
  if (action.type === 'comfy/read-start') {
    if (contextLockReason(state)) return state
    return {
      ...state,
      read: { phase: 'reading', requestId: action.requestId, error: '' },
    }
  }
  if (
    state.read.phase !== 'reading' ||
    state.read.requestId !== action.requestId
  )
    return state
  if (action.type === 'comfy/read-cancel')
    return {
      ...state,
      read: { ...state.read, phase: state.comfy ? 'ready' : 'idle' },
    }
  if (action.type === 'comfy/read-failure')
    return {
      ...state,
      comfy: null,
      read: { ...state.read, phase: 'failed', error: action.error },
    }
  return {
    ...state,
    comfy: action.installation,
    read: { ...state.read, phase: 'ready', error: '' },
  }
}
