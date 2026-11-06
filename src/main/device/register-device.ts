import { app, BrowserWindow, ipcMain } from 'electron'
import { readDevice } from './read-device'
export function registerDevice() {
  let pending: ReturnType<typeof readDevice> | undefined
  ipcMain.handle('device:read', async (event) => {
    if (
      event.senderFrame !== event.sender.mainFrame ||
      !BrowserWindow.fromWebContents(event.sender)
    )
      throw new Error('Unsupported caller')
    pending ??= readDevice(app.getVersion())
      .then(async (report) => {
        if (!report.graphics.length) {
          try {
            const gpu = (await app.getGPUInfo('basic')) as {
              gpuDevice?: { deviceString?: string; vendorString?: string }[]
            }
            report.graphics = (gpu.gpuDevice ?? [])
              .map((item) => item.deviceString || item.vendorString || '')
              .filter(Boolean)
          } catch {
            /* Optional fallback. */
          }
        }
        return report
      })
      .finally(() => {
        pending = undefined
      })
    return pending
  })
}
