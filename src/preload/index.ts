import type { ComfyAPI } from '../shared/comfy-api'
import { contextBridge, ipcRenderer } from 'electron'
import type { WindowAPI, WindowState } from '../shared/window-api'

const windowAPI: WindowAPI = {
  platform: process.platform,
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
  acquire: () => ipcRenderer.invoke('comfy:acquire'),
  cancelAcquire: () => ipcRenderer.invoke('comfy:cancel-acquire'),
  chooseAndRead: () => ipcRenderer.invoke('comfy:choose-and-read'),
  readCurrent: () => ipcRenderer.invoke('comfy:read-current'),
}
contextBridge.exposeInMainWorld('comfy', comfyAPI)
