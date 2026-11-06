import { app, dialog } from 'electron'
import { portableRoot, preparePortable } from './paths'
export function configurePortable() {
  try {
    const paths = preparePortable(
      portableRoot(
        process.execPath,
        process.platform,
        app.isPackaged
          ? undefined
          : process.env.COMFYSTDIO_PORTABLE_ROOT || app.getAppPath(),
      ),
    )
    app.setPath('appData', paths.data)
    app.setPath('userData', paths.userData)
    app.setPath('sessionData', paths.sessionData)
    app.setPath('temp', paths.temp)
    app.setPath('crashDumps', paths.crashDumps)
    app.setAppLogsPath(paths.logs)
    app.commandLine.appendSwitch('disk-cache-dir', paths.cache)
    return paths
  } catch {
    dialog.showErrorBox(
      '便携目录不可写',
      '请先把完整程序文件夹解压到可写位置，再启动。配置不会回退到系统用户目录。',
    )
    app.exit(1)
    throw new Error('Portable directory is not writable')
  }
}
