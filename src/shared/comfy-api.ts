export interface DownloadModel { name: string; type: string; base: string; description: string; filename: string; folder: string; url: string; size: string }
export interface Model {
  id: string
  name: string
  type: string
  size: number
  source: string
  path?: string
}
export interface Plugin {
  name: string
  description: string
  version: string
  enabled: boolean
  updateAvailable: boolean
  path: string
}
export interface ComfyInstallation {
  path: string
  modelsPath: string
  pluginsPath: string
  version: string
  source: 'local'
  readAt: string
  models: Model[]
  plugins: Record<string, Plugin>
  warnings: string[]
  embeddedPython?: string
  selectedPython?: string
}
export type ComfyReadResult =
  | { status: 'ready'; installation: ComfyInstallation }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string }
export type AcquisitionKind = 'source' | 'portable' | 'both'
export interface AcquisitionProgress {
  kind: 'source' | 'portable'
  step: string
  received?: number
  total?: number
}
export interface VersionStatus { commit: string; branch: string; tag: string; dirty: boolean; tags: string[] }
export interface CatalogPlugin { stars?: number; updated?: string; title: string; author: string; description: string; url: string }
export interface ComfyAPI {
  openPluginRepository: (url: string) => Promise<void>
  onPluginProgress: (callback: (value: { url: string; message: string }) => void) => () => void
  modelCatalog: (refresh: boolean, proxy: string) => Promise<DownloadModel[]>
  downloadModel: (url: string, proxy: string) => Promise<string>
  pluginCatalog: (refresh: boolean, proxy: string) => Promise<CatalogPlugin[]>
  versions: (action: 'status' | 'fetch' | 'switch', tag?: string, proxy?: string) => Promise<VersionStatus>
  onAcquisitionProgress: (callback: (progress: AcquisitionProgress) => void) => () => void
  managePlugin: (action: 'install' | 'dependencies' | 'toggle' | 'delete', value: string, proxy: string) => Promise<void>
  acquire: (kind: AcquisitionKind, proxy?: string) => Promise<ComfyReadResult>
  openFolder: (kind: 'program' | 'models' | 'plugins') => Promise<string>
  cancelAcquire: () => Promise<void>
  chooseAndRead: () => Promise<ComfyReadResult>
  readCurrent: () => Promise<ComfyReadResult>
}
