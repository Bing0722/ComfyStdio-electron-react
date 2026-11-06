import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { storedPath } from '../portable/state'
import { runtimeEnvironment, type PortablePaths } from '../portable/paths'
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  type IpcMainInvokeEvent,
} from 'electron'
import { writeFile } from 'node:fs/promises'
import { RuntimeService } from './service'
import type { RunMode } from '../../shared/runtime-api'
export function registerRuntime(
  current: () => string | null,
  reading: () => boolean,
  portable: PortablePaths,
) {
  let python: string | undefined
  let pythonRoot: string | null = null
  const pythonConfig = join(portable.data, 'python.json')
  try {
    const saved = JSON.parse(readFileSync(pythonConfig, 'utf8'))
    if (typeof saved.python === 'string' && typeof saved.root === 'string') {
      python = resolve(portable.root, saved.python)
      pythonRoot = resolve(portable.root, saved.root)
    }
  } catch {}
  const service = new RuntimeService(
    (state) => {
      for (const window of BrowserWindow.getAllWindows())
        window.webContents.send('runtime:change', state)
    },
    () => shell.openExternal('http://127.0.0.1:8188'),
    8188,
    runtimeEnvironment(portable),
  )
  const caller = (event: IpcMainInvokeEvent) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || event.senderFrame !== event.sender.mainFrame)
      throw new Error('Unsupported caller')
    return window
  }
  ipcMain.handle('runtime:snapshot', (event) => {
    caller(event)
    return service.state
  })
  for (const action of ['start', 'restart'] as const)
    ipcMain.handle(`runtime:${action}`, async (event, mode: RunMode) => {
      caller(event)
      const path = current()
      if (!path || reading()) throw new Error('请先读取本地 ComfyUI')
      if (mode !== 'API 服务' && mode !== '打开网页')
        throw new Error('未知启动模式')
      await service[action](
        path,
        mode,
        pythonRoot === path ? python : undefined,
      )
    })
  ipcMain.handle('runtime:stop', async (event) => {
    caller(event)
    await service.stop()
  })
  ipcMain.handle('runtime:choose-python', async (event) => {
    const window = caller(event)
    if (service.busy || reading()) throw new Error('请先停止程序并完成读取')
    const path = current()
    if (!path) throw new Error('请先读取本地 ComfyUI')
    const result = await dialog.showOpenDialog(window, {
      title: '选择 ComfyUI 环境的 Python 可执行文件',
      properties: ['openFile'],
    })
    if (result.canceled) return null
    if (service.busy || reading() || current() !== path)
      throw new Error('程序状态已变化，请重新选择')
    python = result.filePaths[0]
    pythonRoot = path
    writeFileSync(
      pythonConfig,
      JSON.stringify(
        {
          python: storedPath(portable.root, python),
          root: storedPath(portable.root, path),
        },
        null,
        2,
      ),
    )
    service.state.python = python
    service.state.path = path
    service.log(`已选择 Python：${python}`)
    return python
  })
  ipcMain.handle('runtime:export', async (event) => {
    const window = caller(event)
    const choice = await dialog.showSaveDialog(window, {
      title: '导出运行日志',
      defaultPath: `${portable.logs}/ComfyStdio-runtime.log`,
      filters: [{ name: '日志', extensions: ['log'] }],
    })
    if (choice.canceled || !choice.filePath) return false
    await writeFile(
      choice.filePath,
      service.state.logs
        .map(
          (log) => `${log.time} [${log.level}] [${log.source}] ${log.message}`,
        )
        .join('\n'),
      'utf8',
    )
    return true
  })
  app.on('window-all-closed', () => {
    void service.stop().catch(() => {})
  })
  let quitting = false
  app.on('before-quit', (event) => {
    if (!service.busy) return
    event.preventDefault()
    if (quitting) return
    quitting = true
    void service
      .stop()
      .then(() => app.quit())
      .catch(() => {
        quitting = false
      })
  })
  return service
}
