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
  const activeDownloads = state.downloads.filter((task) =>
    ['下载中', '排队'].includes(task.phase),
  ).length
  return (
    <LayoutGroup id="workspace-nav">
      <aside className="sidebar">
        <div className="brand">
          <Icon name="terminal" size={20} />
          <span>ComfyStdio</span>
        </div>
        <nav aria-label="主导航">
          {navigation
            .filter((item) => item.id !== 'settings')
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
                {item.id === 'downloads' && activeDownloads > 0 && (
                  <span className="nav-count">{activeDownloads}</span>
                )}
              </Button>
            ))}
        </nav>
        <div className="sidebar-bottom">
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
          <span className="sidebar-version">本地演示 · 0.1</span>
        </div>
      </aside>
    </LayoutGroup>
  )
}
