import { parseCatalog } from './catalog'
import { manageVersions } from './versions'
import type { PortablePaths } from '../portable/paths'
import { readCurrentPath, saveCurrentPath } from '../portable/state'
import { existsSync } from 'node:fs'
import { registerRuntime } from '../runtime/register-runtime'
import { join } from 'node:path'
import { validateProxy } from '../../shared/proxy'
import { managePlugin } from './plugins'
import { acquirePortable } from './acquire-portable'
import { findEmbeddedPython } from '../runtime/python'
import { acquireComfy } from './acquire'
import {
  app,
  BrowserWindow,
  shell,
  session,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
} from 'electron'
import { readInstallation } from './read-installation'
import type { AcquisitionProgress, ComfyReadResult } from '../../shared/comfy-api'

export function registerComfyReader(portable: PortablePaths) {
  let catalogRequest: Promise<ReturnType<typeof parseCatalog>> | undefined
  let catalogSettled = false
  ipcMain.handle('comfy:catalog', async (event, refresh, proxy) => {
    windowFor(event)
    if (typeof refresh !== 'boolean') throw new Error('参数无效')
    const validated = validateProxy(proxy)
    if (!catalogRequest || refresh && catalogSettled) {
      catalogSettled = false
      catalogRequest = (async () => {
        const connection = session.fromPartition('plugin-catalog', { cache: false })
        await connection.setProxy(validated ? { mode: 'fixed_servers', proxyRules: validated.replace(/^socks5h:/i, 'socks5:') } : { mode: 'system' })
        const response = await connection.fetch('https://raw.githubusercontent.com/Comfy-Org/ComfyUI-Manager/main/custom-node-list.json', { signal: AbortSignal.timeout(30000), credentials: 'omit' })
        if (!response.ok) throw new Error(`目录获取失败：HTTP ${response.status}`)
        return parseCatalog(await response.json())
      })().finally(() => { catalogSettled = true })
    }
    return catalogRequest
  })
  const saved = readCurrentPath(portable)
  let currentPath: string | null = existsSync(saved) ? saved : null
  let busy = false
  let acquisition: AbortController | null = null
  const runtime = registerRuntime(
    () => currentPath,
    () => busy,
    portable,
  )
  const windowFor = (event: IpcMainInvokeEvent) => {
    if (event.senderFrame !== event.sender.mainFrame)
      throw new Error('Unsupported caller')
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('Window is unavailable')
    return window
  }
  const scan = async (path: string, signal?: AbortSignal): Promise<ComfyReadResult> => {
    try {
      const installation = await readInstallation(path)
      const embeddedPython = await findEmbeddedPython(installation.path)
      if (signal?.aborted) return { status: 'cancelled' }
      saveCurrentPath(portable, installation.path)
      currentPath = installation.path
      return {
        status: 'ready',
        installation: {
          ...installation,
          embeddedPython,
          selectedPython: runtime.selectedPython(installation.path),
        },
      }
    } catch (error) {
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
      if (busy || runtime.busy)
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
    'comfy:acquire',
    async (event, kind: unknown, proxy: unknown = ''): Promise<ComfyReadResult> => {
      const window = windowFor(event)
      if (busy || runtime.busy)
        return { status: 'failed', error: '正在处理 ComfyUI，请稍后重试。' }
      if (kind !== 'source' && kind !== 'portable' && kind !== 'both')
        return { status: 'failed', error: '未知的 ComfyUI 获取类型。' }
      if (
        kind !== 'source' &&
        (process.platform !== 'win32' || process.arch !== 'x64')
      )
        return { status: 'failed', error: '此便携包适用于 Windows x64。' }
      busy = true
      const controller = new AbortController()
      acquisition = controller
      let closeRequested = false
      const cancelOnClose = (event: Electron.Event) => {
        event.preventDefault()
        closeRequested = true
        controller.abort()
      }
      window.on('close', cancelOnClose)
      try {
        const report = (value: AcquisitionProgress) => {
          if (!event.sender.isDestroyed()) event.sender.send('comfy:progress', value)
        }
        const validated = validateProxy(proxy)
        const source = async () => {
          report({ kind: 'source', step: '获取源码（Git）' })
          if (!existsSync(portable.comfy))
            {
              const path = await acquireComfy(portable.root, controller.signal, undefined, validated)
              report({ kind: 'source', step: '源码已获取' })
              return path
            }
          if (kind === 'both') await readInstallation(portable.comfy)
          return portable.comfy
        }
        const standalone = async () => {
          const downloads = session.fromPartition('comfy-download', { cache: false })
          await downloads.setProxy(
            validated
              ? { mode: 'fixed_servers', proxyRules: validated.replace(/^socks5h:/i, 'socks5:') }
              : { mode: 'system' },
          )
          await downloads.closeAllConnections()
          return acquirePortable(
            portable.comfyPortable,
            controller.signal,
            (url, options) => downloads.fetch(url, { ...options, credentials: 'omit' }),
            undefined,
            report,
          )
        }
        let path: string
        if (kind === 'both') {
          const [sourceResult, portableResult] = await Promise.allSettled([
            source(),
            standalone(),
          ])
          if (portableResult.status === 'rejected') throw portableResult.reason
          if (sourceResult.status === 'rejected') throw sourceResult.reason
          path = portableResult.value
        } else path = await (kind === 'source' ? source() : standalone())
        if (controller.signal.aborted) return { status: 'cancelled' }
        report({ kind: kind === 'source' ? 'source' : 'portable', step: '读取 ComfyUI 目录' })
        return await scan(kind === 'source' ? path : join(path, 'ComfyUI'), controller.signal)
      } catch (error) {
        return controller.signal.aborted
          ? { status: 'cancelled' }
          : {
              status: 'failed',
              error:
                error instanceof Error ? error.message : '获取失败，请重试。',
            }
      } finally {
        window.removeListener('close', cancelOnClose)
        acquisition = null
        busy = false
        if (closeRequested && !window.isDestroyed()) window.close()
      }
    },
  )
  ipcMain.handle('comfy:versions', async (event, action, tag = '', proxy = '') => {
    windowFor(event)
    if (busy || runtime.busy || !currentPath) throw new Error('请先读取目录并停止 ComfyUI。')
    if (typeof tag !== 'string' || typeof proxy !== 'string') throw new Error('参数无效。')
    busy = true
    try { return await manageVersions(currentPath, action, tag, proxy) }
    finally { busy = false }
  })
  ipcMain.handle('comfy:plugin', async (event, action, value, proxy) => {
    windowFor(event)
    if (busy || runtime.busy || !currentPath)
      throw new Error('请先读取 ComfyUI 并停止运行中的程序。')
    if (!['install', 'dependencies', 'toggle'].includes(action) ||
        typeof value !== 'string' || typeof proxy !== 'string')
      throw new Error('插件操作参数无效。')
    busy = true
    let quitRequested = false
    const deferQuit = (event: Electron.Event) => {
      event.preventDefault()
      quitRequested = true
    }
    app.on('before-quit', deferQuit)
    try {
      await managePlugin(currentPath, runtime.selectedPython(currentPath), action, value, proxy, runtime.pluginLog)
    } finally {
      busy = false
      app.removeListener('before-quit', deferQuit)
      if (quitRequested) app.quit()
    }
  })
  ipcMain.handle('comfy:open-folder', async (event, kind: unknown) => {
    windowFor(event)
    if (
      !currentPath ||
      !['program', 'models', 'plugins'].includes(String(kind))
    )
      return '请先读取本地 ComfyUI'
    const path =
      kind === 'models'
        ? join(currentPath, 'models')
        : kind === 'plugins'
          ? join(currentPath, 'custom_nodes')
          : currentPath
    return shell.openPath(path)
  })
  ipcMain.handle('comfy:cancel-acquire', (event) => {
    windowFor(event)
    acquisition?.abort()
  })
  ipcMain.handle(
    'comfy:read-current',
    async (event): Promise<ComfyReadResult> => {
      windowFor(event)
      if (!currentPath) return { status: 'cancelled' }
      if (busy || runtime.busy)
        return { status: 'failed', error: '正在读取 ComfyUI，请稍后重试。' }
      busy = true
      try {
        const result = await scan(currentPath)
        if (result.status === 'failed') currentPath = null
        return result
      } finally {
        busy = false
      }
    },
  )
}
