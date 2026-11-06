import { LayoutGroup, motion } from 'motion/react'
import { Button } from '../ui/Button'
import { navigation } from '../../app/navigation'
import {
  themes,
  usePreferences,
} from '../../features/settings/PreferencesProvider'
import type { PageId } from '../../state/types'
import { useWorkspace } from '../../state/WorkspaceProvider'
import { Icon } from '../ui/Icon'
import { Select } from '../ui/Select'
export function Sidebar({
  page,
  onNavigate,
}: {
  page: PageId
  onNavigate: (page: PageId) => void
}) {
  const { theme, setTheme } = usePreferences()
  const { state } = useWorkspace()
  return (
    <LayoutGroup id="workspace-nav">
      <aside className="sidebar">
        <div className="brand">
          <Icon name="terminal" size={20} />
          <span>ComfyStdio</span>
        </div>
        <nav aria-label="主导航">
          {navigation
            .filter((item) => item.id !== 'settings' && item.id !== 'about')
            .map((item) => (
              <Button
                key={item.id}
                aria-current={page === item.id ? 'page' : undefined}
                className={`nav-item ${page === item.id ? 'selected' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {page === item.id && (
                  <motion.span
                    layoutId="navigation-pill"
                    className="nav-pill"
                  />
                )}
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Button
            className={`nav-item ${page === 'about' ? 'selected' : ''}`}
            aria-current={page === 'about' ? 'page' : undefined}
            onClick={() => onNavigate('about')}
          >
            {page === 'about' && (
              <motion.span layoutId="navigation-pill" className="nav-pill" />
            )}
            <Icon name="terminal" />
            <span>关于</span>
          </Button>
          <Button
            className={`nav-item ${page === 'settings' ? 'selected' : ''}`}
            aria-current={page === 'settings' ? 'page' : undefined}
            onClick={() => onNavigate('settings')}
          >
            {page === 'settings' && (
              <motion.span layoutId="navigation-pill" className="nav-pill" />
            )}
            <Icon name="settings" />
            <span>设置</span>
          </Button>
          <Select
            icon
            label="主题"
            value={theme}
            options={themes}
            onChange={setTheme}
            placement="top"
          />
          <span className="sidebar-version">
            {state.comfy
              ? `ComfyUI · ${state.comfy?.version}`
              : 'ComfyUI 未读取'}
          </span>
        </div>
      </aside>
    </LayoutGroup>
  )
}
