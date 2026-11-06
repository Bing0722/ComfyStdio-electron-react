import { useWorkspace } from '../../state/WorkspaceProvider'
import { useEffect, useState } from 'react'
import type { WindowState } from '../../../../shared/window-api'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

export function TitleBar({
  title,
  onSettings,
}: {
  title: string
  onSettings: () => void
}) {
  const { state: workspace } = useWorkspace()
  const api = window.windowControls
  const [state, setState] = useState<WindowState>({
    maximized: false,
    fullScreen: false,
    focused: true,
  })
  useEffect(() => {
    if (!api) return
    let mounted = true
    void api.getState().then((value) => {
      if (mounted) setState(value)
    })
    const unsubscribe = api.onStateChange(setState)
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [api])
  return (
    <header
      className={`titlebar ${state.focused ? '' : 'window-inactive'}`}
      data-platform={api?.platform ?? 'browser'}
      data-fullscreen={state.fullScreen}
    >
      <div className="titlebar-brand">
        <Icon name="terminal" size={17} />
        <strong>ComfyStdio</strong>
        <span className="titlebar-divider" />
        <span>{title}</span>
      </div>
      <div className="titlebar-actions">
        <span className="environment-label">
          {workspace.comfy ? '本地 ComfyUI' : '未读取程序'}
        </span>

        <Button
          className="titlebar-button"
          aria-label="打开设置"
          title="设置"
          onClick={onSettings}
        >
          <Icon name="settings" size={17} />
        </Button>
      </div>
      {api && api.platform !== 'darwin' && api.platform !== 'win32' && (
        <div className="window-controls">
          <button aria-label="最小化窗口" onClick={() => api.minimize()}>
            <Icon name="minimize" size={14} />
          </button>
          <button
            aria-label={state.maximized ? '还原窗口' : '最大化窗口'}
            onClick={() => api.toggleMaximize()}
          >
            <Icon name={state.maximized ? 'restore' : 'maximize'} size={14} />
          </button>
          <button
            className="window-close"
            aria-label="关闭窗口"
            onClick={() => api.close()}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
    </header>
  )
}
