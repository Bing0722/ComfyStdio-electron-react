import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  shell,
  type IpcMainInvokeEvent,
} from 'electron'
import { join } from 'node:path'
import { saveUpdate } from './download'
import type { PortablePaths } from '../portable/paths'
import type { UpdateInfo } from '../../shared/application-api'
import { newerVersion, selectAsset, type ReleaseAsset } from './release'
export function registerUpdates(paths: PortablePaths) {
  let asset: ReleaseAsset | undefined
  let busy = false
  const caller = (event: IpcMainInvokeEvent) => {
    if (
      event.senderFrame !== event.sender.mainFrame ||
      !BrowserWindow.fromWebContents(event.sender)
    )
      throw new Error('Unsupported caller')
  }
  ipcMain.handle('application:info', (event) => {
    caller(event)
    return {
      version: app.getVersion(),
      root: paths.root,
      data: paths.data,
      comfy: paths.comfy,
      updates: paths.updates,
    }
  })
  ipcMain.handle(
    'application:check-update',
    async (event): Promise<UpdateInfo> => {
      caller(event)
      if (busy) throw new Error('更新操作正在进行')
      busy = true
      asset = undefined
      try {
        const response = await net.fetch(
          'https://api.github.com/repos/Bing0722/ComfyStdio-electron-react/releases/latest',
          {
            headers: { Accept: 'application/vnd.github+json' },
            signal: AbortSignal.timeout(20000),
          },
        )
        const currentVersion = app.getVersion()
        if (response.status === 404)
          return {
            status: 'unpublished',
            currentVersion,
            message: '暂未发布正式更新包。当前版本可继续使用。',
          }
        if (!response.ok)
          throw new Error(`检查更新失败（HTTP ${response.status}），请稍后重试`)
        const release = (await response.json()) as {
          tag_name: string
          draft: boolean
          prerelease: boolean
          body?: string
          assets: ReleaseAsset[]
        }
        if (
          release.draft ||
          release.prerelease ||
          !/^v?\d+\.\d+\.\d+$/.test(release.tag_name)
        )
          throw new Error('发布版本信息无效')
        const latestVersion = release.tag_name.replace(/^v/, '')
        if (!newerVersion(latestVersion, currentVersion))
          return {
            status: 'current',
            currentVersion,
            latestVersion,
            message: '当前版本无需更新。',
          }
        asset = selectAsset(release, process.platform, process.arch)
        return {
          status: asset ? 'available' : 'unsupported',
          currentVersion,
          latestVersion,
          notes: (release.body ?? '').slice(0, 12000),
          message: asset
            ? '发现新版本，可下载便携更新包。'
            : '发现新版本，但没有适合当前系统且具备 SHA-256 校验的便携包。',
        }
      } finally {
        busy = false
      }
    },
  )
  ipcMain.handle('application:download-update', async (event) => {
    caller(event)
    if (busy || !asset) throw new Error('请先检查可用更新')
    busy = true
    const selected = asset,
      file = join(paths.updates, selected.name)
    try {
      const response = await net.fetch(selected.browser_download_url, {
        signal: AbortSignal.timeout(600000),
      })
      return await saveUpdate(response, selected, file)
    } finally {
      busy = false
    }
  })
  ipcMain.handle('application:open-updates', async (event) => {
    caller(event)
    const error = await shell.openPath(paths.updates)
    if (error) throw new Error(error)
  })
}
