import {
  BrowserWindow,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
} from 'electron'
import type { WindowState } from '../shared/window-api'

function senderWindow(event: IpcMainEvent | IpcMainInvokeEvent) {
  if (event.senderFrame !== event.sender.mainFrame) return null
  return BrowserWindow.fromWebContents(event.sender)
}
export function getWindowState(window: BrowserWindow): WindowState {
  return {
    maximized: window.isMaximized(),
    fullScreen: window.isFullScreen(),
    focused: window.isFocused(),
  }
}
export function registerWindowControls() {
  ipcMain.on('window:theme', (event, dark: unknown) => {
    if (process.platform === 'win32' && typeof dark === 'boolean')
      senderWindow(event)?.setTitleBarOverlay({
        color: '#00000000',
        symbolColor: dark ? '#e5e7eb' : '#555b65',
      })
  })
  ipcMain.on('window:minimize', (event) => senderWindow(event)?.minimize())
  ipcMain.on('window:toggle-maximize', (event) => {
    const window = senderWindow(event)
    if (!window || window.isFullScreen()) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })
  ipcMain.on('window:close', (event) => senderWindow(event)?.close())
  ipcMain.handle('window:get-state', (event) => {
    const window = senderWindow(event)
    if (!window) throw new Error('Window is unavailable')
    return getWindowState(window)
  })
}
export function observeWindow(window: BrowserWindow) {
  const sendState = () => {
    if (!window.isDestroyed())
      window.webContents.send('window:state', getWindowState(window))
  }
  window.on('maximize', sendState)
  window.on('unmaximize', sendState)
  window.on('enter-full-screen', sendState)
  window.on('leave-full-screen', sendState)
  window.on('focus', sendState)
  window.on('blur', sendState)
}
