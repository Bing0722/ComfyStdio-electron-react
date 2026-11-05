export type PageId =
  | 'instances'
  | 'downloads'
  | 'models'
  | 'versions'
  | 'plugins'
  | 'settings'
export type Theme = '浅色' | '深色' | '跟随系统'
export type InstanceStatus = '已停止' | '启动中' | '运行中' | '失败'
export type DownloadPhase = '排队' | '下载中' | '暂停' | '完成' | '失败'
export interface Model {
  id: number
  name: string
  type: string
  size: number
  source: string
}
export interface Download extends Model {
  progress: number
  phase: DownloadPhase
}
export interface Instance {
  id: string
  name: string
  path: string
  version: string
  status: InstanceStatus
  logs: string[]
}
export interface Plugin {
  version: string
  enabled: boolean
  updateAvailable: boolean
}
export interface Filter {
  search: string
  type: string
}
export interface WorkspaceState {
  instanceId: string
  instances: Instance[]
  downloads: Download[]
  models: Model[]
  versions: string[]
  defaultVersion: string
  plugins: Record<string, Record<string, Plugin>>
}
export type WorkspaceAction =
  | { type: 'tick' }
  | { type: 'instance/select'; id: string }
  | { type: 'instance/status'; id: string; status: InstanceStatus }
  | { type: 'download/add'; model: Model }
  | { type: 'download/status'; id: number; phase: '暂停' | '下载中' | '失败' }
  | { type: 'download/remove'; id: number }
  | { type: 'model/remove'; id: number }
  | { type: 'version/install'; version: string }
  | { type: 'version/default'; version: string }
  | { type: 'version/switch'; id: string; version: string }
  | { type: 'version/remove'; version: string }
  | {
      type: 'plugin/install' | 'plugin/toggle' | 'plugin/update'
      instanceId: string
      name: string
    }
