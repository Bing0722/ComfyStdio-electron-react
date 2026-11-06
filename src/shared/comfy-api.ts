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
export interface ComfyAPI {
  acquire: (kind: AcquisitionKind, proxy?: string) => Promise<ComfyReadResult>
  openFolder: (kind: 'program' | 'models' | 'plugins') => Promise<string>
  cancelAcquire: () => Promise<void>
  chooseAndRead: () => Promise<ComfyReadResult>
  readCurrent: () => Promise<ComfyReadResult>
}
