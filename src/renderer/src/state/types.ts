import type { Model, ComfyInstallation } from '../../../shared/comfy-api'
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
export type DownloadPhase = '排队' | '下载中' | '暂停' | '完成' | '失败'
export type {
  Model,
  Plugin,
  ComfyInstallation,
} from '../../../shared/comfy-api'
export interface Download extends Model {
  progress: number
  phase: DownloadPhase
  comfyPath: string
  targetPath: string
}
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
  runtime: { status: RuntimeStatus; logs: string[] }
  downloads: Download[]
  versionTask: { version: string; kind: 'switch' | 'update' } | null
}
export type WorkspaceAction =
  | { type: 'tick' }
  | { type: 'comfy/read-start'; requestId: number }
  | {
      type: 'comfy/read-success'
      requestId: number
      installation: ComfyInstallation
    }
  | { type: 'comfy/read-cancel'; requestId: number }
  | { type: 'comfy/read-failure'; requestId: number; error: string }
  | { type: 'runtime/status'; status: RuntimeStatus }
  | { type: 'runtime/live'; status: RuntimeStatus }
  | { type: 'download/add'; model: Model }
  | { type: 'download/status'; id: string; phase: '暂停' | '下载中' | '失败' }
  | { type: 'download/remove'; id: string }
  | { type: 'model/remove'; id: string }
  | { type: 'version/change'; version: string; kind: 'switch' | 'update' }
  | { type: 'version/fail' }
  | { type: 'plugin/install' | 'plugin/toggle' | 'plugin/update'; name: string }
