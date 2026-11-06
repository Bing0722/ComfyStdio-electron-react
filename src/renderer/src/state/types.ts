import type { ComfyInstallation } from '../../../shared/comfy-api'
export type PageId =
  | 'launch'
  | 'downloads'
  | 'models'
  | 'versions'
  | 'plugins'
  | 'settings'
  | 'about'
  | 'logs'
export type Theme = '浅色' | '深色' | '跟随系统'
export type RuntimeStatus = import('../../../shared/runtime-api').ProcessStatus
export type {
  Model,
  Plugin,
  ComfyInstallation,
} from '../../../shared/comfy-api'
export interface Filter {
  search: string
  type: string
}
export interface WorkspaceState {
  comfy: ComfyInstallation | null
  read: {
    phase: 'idle' | 'reading' | 'ready' | 'failed'
    requestId: number
    error: string
  }
  runtime: { status: RuntimeStatus }
}
export type WorkspaceAction =
  | { type: 'comfy/read-start'; requestId: number }
  | {
      type: 'comfy/read-success'
      requestId: number
      installation: ComfyInstallation
    }
  | { type: 'comfy/read-failure'; requestId: number; error: string; preserve?: boolean }
  | { type: 'comfy/read-cancel'; requestId: number }
  | { type: 'comfy/python-selected'; path: string; python: string }
  | { type: 'runtime/live'; status: RuntimeStatus }
