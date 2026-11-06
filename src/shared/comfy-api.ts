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
export interface ComfyAPI {
  onAcquisitionProgress: (callback: (progress: AcquisitionProgress) => void) => () => void
  managePlugin: (action: 'install' | 'dependencies' | 'toggle', value: string, proxy: string) => Promise<void>
  acquire: (kind: AcquisitionKind, proxy?: string) => Promise<ComfyReadResult>
  openFolder: (kind: 'program' | 'models' | 'plugins') => Promise<string>
  cancelAcquire: () => Promise<void>
  chooseAndRead: () => Promise<ComfyReadResult>
  readCurrent: () => Promise<ComfyReadResult>
}
