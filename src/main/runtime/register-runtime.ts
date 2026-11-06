import { basename, dirname, join } from 'node:path'
import { existsSync, realpathSync } from 'node:fs'
import { pythonSelections } from './python-selections'
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
  const selections = pythonSelections(portable)
  let choosing = false
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
    ipcMain.handle(`runtime:${action}`, async (event, mode: RunMode, portableCpu: unknown) => {
      caller(event)
      const path = current()
      if (!path || reading() || choosing) throw new Error('请先读取本地 ComfyUI')
      if (mode !== 'API 服务' && mode !== '打开网页')
        throw new Error('未知启动模式')
      const selected = selections.get(path)
      if (
        !selected &&
        path === join(portable.comfyPortable, 'ComfyUI') &&
        !existsSync(join(portable.comfyPortable, 'python_embeded', 'python.exe'))
      )
        throw new Error('便携包缺少自带的 Python，请检查程序目录。')
      await service[action](path, mode, selected, portableCpu === true)
    })
  ipcMain.handle('runtime:stop', async (event) => {
    caller(event)
    await service.stop()
  })
  ipcMain.handle('runtime:choose-python', async (event) => {
    const window = caller(event)
    if (service.busy || reading() || choosing)
      throw new Error('请先停止程序并完成读取')
    const path = current()
    if (!path) throw new Error('请先读取本地 ComfyUI')
    choosing = true
    try {
      const result = await dialog.showOpenDialog(window, {
        title: '选择 ComfyUI 环境的 Python 可执行文件',
        properties: ['openFile'],
      })
      const selected = result.filePaths[0]
      if (result.canceled || !selected) return null
      // Resolve directory aliases without following a virtualenv's interpreter symlink.
      const python = join(realpathSync(dirname(selected)), basename(selected))
      selections.save(path, python)
      service.log(`已选择 Python：${python}`)
      return python
    } finally {
      choosing = false
    }
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
  return {
    get busy() { return service.busy || choosing },
    selectedPython: selections.get,
  }
}
