import {
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
} from 'electron'
import { readInstallation } from './read-installation'
import type { ComfyReadResult } from '../../shared/comfy-api'

export function registerComfyReader() {
  let currentPath: string | null = null
  let busy = false
  const windowFor = (event: IpcMainInvokeEvent) => {
    if (event.senderFrame !== event.sender.mainFrame)
      throw new Error('Unsupported caller')
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('Window is unavailable')
    return window
  }
  const scan = async (path: string): Promise<ComfyReadResult> => {
    try {
      const installation = await readInstallation(path)
      currentPath = installation.path
      return { status: 'ready', installation }
    } catch (error) {
      currentPath = null
      return {
        status: 'failed',
        error:
          error instanceof Error && error.message.startsWith('所选目录')
            ? error.message
            : '无法读取 ComfyUI 目录，请检查目录是否存在以及访问权限。',
      }
    }
  }
  ipcMain.handle(
    'comfy:choose-and-read',
    async (event): Promise<ComfyReadResult> => {
      const window = windowFor(event)
      if (busy)
        return { status: 'failed', error: '正在读取 ComfyUI，请稍后重试。' }
      busy = true
      try {
        const choice = await dialog.showOpenDialog(window, {
          title: '选择当前 ComfyUI 目录',
          properties: ['openDirectory'],
        })
        if (choice.canceled || !choice.filePaths[0])
          return { status: 'cancelled' }
        return await scan(choice.filePaths[0])
      } finally {
        busy = false
      }
    },
  )
  ipcMain.handle(
    'comfy:read-current',
    async (event): Promise<ComfyReadResult> => {
      windowFor(event)
      if (!currentPath) return { status: 'cancelled' }
      if (busy)
        return { status: 'failed', error: '正在读取 ComfyUI，请稍后重试。' }
      busy = true
      try {
        return await scan(currentPath)
      } finally {
        busy = false
      }
    },
  )
}
