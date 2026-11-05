export interface WindowState {
  maximized: boolean
  fullScreen: boolean
  focused: boolean
}
export interface WindowAPI {
  platform: string
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  getState: () => Promise<WindowState>
  onStateChange: (callback: (state: WindowState) => void) => () => void
}
