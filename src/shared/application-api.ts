export interface ApplicationInfo {
  version: string
  root: string
  data: string
  comfy: string
  updates: string
}
export interface UpdateInfo {
  status: 'available' | 'current' | 'unpublished' | 'unsupported'
  currentVersion: string
  latestVersion?: string
  notes?: string
  message: string
}
export interface ApplicationAPI {
  info: () => Promise<ApplicationInfo>
  checkUpdate: () => Promise<UpdateInfo>
  downloadUpdate: () => Promise<string>
  openUpdates: () => Promise<void>
}
