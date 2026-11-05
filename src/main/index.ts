import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow(): void {
  const window = new BrowserWindow({
    title: 'ComfyStdio',
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  const developmentUrl = process.env.ELECTRON_RENDERER_URL
  const page = !app.isPackaged && developmentUrl
    ? window.loadURL(developmentUrl)
    : window.loadFile(join(__dirname, '../renderer/index.html'))

  void page.catch((error: unknown) => {
    console.error('Failed to load the ComfyStdio window', error)
    app.exit(1)
  })
}

void app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
