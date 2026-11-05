import { app, Menu } from 'electron'

export function configureApplicationMenu() {
  // Keep macOS app lifecycle and editing accelerators, without File/Edit/View menus.
  Menu.setApplicationMenu(
    process.platform === 'darwin'
      ? Menu.buildFromTemplate([
          {
            label: 'ComfyStdio',
            submenu: [
              { label: '关于 ComfyStdio', role: 'about' },
              { type: 'separator' },
              { label: '隐藏 ComfyStdio', role: 'hide' },
              { label: '隐藏其他应用', role: 'hideOthers' },
              { type: 'separator' },
              { label: '退出 ComfyStdio', role: 'quit' },
              ...(
                ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'] as const
              ).map((role) => ({
                role,
                visible: false,
                acceleratorWorksWhenHidden: true,
              })),
            ],
          },
        ])
      : null,
  )
  app.setName('ComfyStdio')
}

/** Preserve editing commands when the standard Edit menu is not present. */
export function installEditingShortcuts(
  window: import('electron').BrowserWindow,
) {
  window.webContents.on('before-input-event', (event, input) => {
    const commandKey =
      process.platform === 'darwin' ? input.meta : input.control
    if (input.type !== 'keyDown' || !commandKey || input.alt) return
    const commands = {
      a: 'selectAll',
      c: 'copy',
      x: 'cut',
      v: 'paste',
      z: input.shift ? 'redo' : 'undo',
      y: 'redo',
    } as const
    const key = input.key.toLowerCase() as keyof typeof commands
    const command = commands[key]
    if (!command) return
    event.preventDefault()
    window.webContents[command]()
  })
}
