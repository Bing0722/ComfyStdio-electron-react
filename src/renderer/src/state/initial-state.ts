import type { WorkspaceState } from './types'
export const modelTypes = [
  '全部类型',
  'Checkpoint',
  'LoRA',
  'VAE',
  'ControlNet',
  '其他',
]
export function createWorkspace(): WorkspaceState {
  return {
    comfy: null,
    read: { phase: 'idle', requestId: 0, error: '' },
    runtime: { status: '已停止' },
  }
}
