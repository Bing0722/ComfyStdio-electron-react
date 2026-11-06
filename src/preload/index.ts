import type { RuntimeAPI } from '../shared/runtime-api'
import type { ComfyAPI } from '../shared/comfy-api'
import { contextBridge, ipcRenderer } from 'electron'
import type { WindowAPI, WindowState } from '../shared/window-api'

const windowAPI: WindowAPI = {
  platform: process.platform,
  arch: process.arch,
  setTheme: (dark) => ipcRenderer.send('window:theme', dark),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  getState: () => ipcRenderer.invoke('window:get-state'),
  onStateChange: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: WindowState) =>
      callback(state)
    ipcRenderer.on('window:state', listener)
    return () => ipcRenderer.removeListener('window:state', listener)
  },
}
contextBridge.exposeInMainWorld('windowControls', windowAPI)

contextBridge.exposeInMainWorld('device', {
  read: () => ipcRenderer.invoke('device:read'),
})
const comfyAPI: ComfyAPI = {
  onAcquisitionProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof callback>[0]) => callback(progress)
    ipcRenderer.on('comfy:progress', listener)
    return () => ipcRenderer.removeListener('comfy:progress', listener)
  },
  managePlugin: (action, value, proxy) => ipcRenderer.invoke('comfy:plugin', action, value, proxy),
  acquire: (kind, proxy) => ipcRenderer.invoke('comfy:acquire', kind, proxy),
  openFolder: (kind) => ipcRenderer.invoke('comfy:open-folder', kind),
  cancelAcquire: () => ipcRenderer.invoke('comfy:cancel-acquire'),
  chooseAndRead: () => ipcRenderer.invoke('comfy:choose-and-read'),
  readCurrent: () => ipcRenderer.invoke('comfy:read-current'),
}
contextBridge.exposeInMainWorld('comfy', comfyAPI)

const runtimeAPI: RuntimeAPI = {
  snapshot: () => ipcRenderer.invoke('runtime:snapshot'),
  start: (mode, cpu) => ipcRenderer.invoke('runtime:start', mode, cpu),
  restart: (mode, cpu) => ipcRenderer.invoke('runtime:restart', mode, cpu),
  stop: () => ipcRenderer.invoke('runtime:stop'),
  choosePython: () => ipcRenderer.invoke('runtime:choose-python'),
  exportLogs: () => ipcRenderer.invoke('runtime:export'),
  onChange: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: Parameters<typeof callback>[0],
    ) => callback(state)
    ipcRenderer.on('runtime:change', listener)
    return () => ipcRenderer.removeListener('runtime:change', listener)
  },
}
contextBridge.exposeInMainWorld('runtime', runtimeAPI)

contextBridge.exposeInMainWorld('application', {
  info: () => ipcRenderer.invoke('application:info'),
  checkUpdate: () => ipcRenderer.invoke('application:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('application:download-update'),
  openUpdates: () => ipcRenderer.invoke('application:open-updates'),
})
