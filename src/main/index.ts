import { configurePortable } from './portable/bootstrap'
import { registerUpdates } from './updates/register-updates'
import { registerDevice } from './device/register-device'
import { registerComfyReader } from './comfy/register-comfy'
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import {
  configureApplicationMenu,
  installEditingShortcuts,
} from './application-menu'
import { observeWindow, registerWindowControls } from './window-controls'

const portable = configurePortable()
if (!app.requestSingleInstanceLock()) app.exit(0)
app.on('second-instance', () => {
  const window = BrowserWindow.getAllWindows()[0]
  if (window) {
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  }
})

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  const window = new BrowserWindow({
    title: 'ComfyStdio',
    width: 1120,
    height: 800,
    minWidth: 620,
    minHeight: 560,
    show: false,
    backgroundColor: '#f3f4f6',
    titleBarStyle: 'hidden',
    frame: isMac || process.platform === 'win32',
    ...(process.platform === 'win32'
      ? {
          titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#555b65',
            height: 51,
          },
          backgroundMaterial: 'none' as const,
        }
      : {}),
    ...(isMac ? { trafficLightPosition: { x: 20, y: 19 } } : {}),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.setMenuBarVisibility(false)
  observeWindow(window)
  installEditingShortcuts(window)
  window.once('ready-to-show', () => window.show())
  const developmentUrl = process.env.ELECTRON_RENDERER_URL
  const page =
    !app.isPackaged && developmentUrl
      ? window.loadURL(developmentUrl)
      : window.loadFile(join(__dirname, '../renderer/index.html'))
  void page.catch((error: unknown) => {
    console.error('Failed to load the ComfyStdio window', error)
    app.exit(1)
  })
}
void app.whenReady().then(() => {
  configureApplicationMenu()
  registerWindowControls()
  registerComfyReader(portable)
  registerUpdates(portable)
  registerDevice()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
