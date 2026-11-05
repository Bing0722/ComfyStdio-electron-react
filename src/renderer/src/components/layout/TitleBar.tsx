import { useWorkspace } from '../../state/WorkspaceProvider'
import { useEffect, useState } from 'react'
import type { WindowState } from '../../../../shared/window-api'
import { usePreferences } from '../../features/settings/PreferencesProvider'
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
  const { liquid, setLiquid } = usePreferences()
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
        <span className="demo-label">
          {workspace.comfy?.source === 'local'
            ? '本地读取 · 操作演示'
            : '演示模式'}
        </span>
        <Button
          className={`titlebar-button ${liquid ? 'is-on' : ''}`}
          aria-label="切换液态玻璃"
          aria-pressed={liquid}
          title="切换液态玻璃"
          onClick={() => setLiquid(!liquid)}
        >
          <Icon name="glass" size={17} />
        </Button>
        <Button
          className="titlebar-button"
          aria-label="打开设置"
          title="设置"
          onClick={onSettings}
        >
          <Icon name="settings" size={17} />
        </Button>
      </div>
      {api && api.platform !== 'darwin' && (
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
