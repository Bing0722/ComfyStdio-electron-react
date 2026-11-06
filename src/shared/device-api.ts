export interface DeviceReport {
  system: string
  cpu: string
  memory: string
  graphics: string[]
  nvidia: { name: string; driver: string; memory: string }[]
  cudaDriver: string
  cudaToolkit: string
  python: string
  git: string
  app: string
  checkedAt: string
}
export interface DeviceAPI {
  read: () => Promise<DeviceReport>
}
