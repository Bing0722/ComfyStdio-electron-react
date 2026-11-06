import { Section } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { themes, usePreferences } from './PreferencesProvider'
import { ProxyCard } from './ProxyCard'
import { FolderSettings } from './FolderSettings'
import './settings.css'
export function SettingsPage() {
  const { theme, setTheme, settings, updateSettings } = usePreferences()
  return (
    <div className="settings-stack">
      <Section title="外观">
        <div className="setting-row">
          <div>
            <h3>主题</h3>
            <p>在下次打开时保留。</p>
          </div>
          <Select
            label="界面主题"
            value={theme}
            options={themes}
            onChange={setTheme}
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>液态效果</h3>
            <p>大面积透光玻璃、柔和折射与随光高光。</p>
          </div>
          <span className="muted">始终开启</span>
        </div>
      </Section>
      <FolderSettings />
      <ProxyCard
        title="模型下载"
        value={settings.modelProxy}
        onSave={(modelProxy) => updateSettings({ modelProxy })}
        description="为后续模型下载保留的独立代理配置，目前尚未接入传输。"
      >
        <div className="setting-row">
          <div>
            <h3>并行下载</h3>
            <p>保存后续下载使用的偏好。</p>
          </div>
          <Select
            label="并行下载任务"
            value={settings.concurrency}
            options={['1 个任务', '2 个任务', '3 个任务']}
            onChange={(concurrency) => updateSettings({ concurrency })}
          />
        </div>
      </ProxyCard>
      <ProxyCard
        title="插件安装与更新"
        value={settings.pluginProxy}
        onSave={(pluginProxy) => updateSettings({ pluginProxy })}
        description="为后续插件安装和更新保留的代理配置，目前尚未接入。"
      />
      <ProxyCard
        title="ComfyUI 获取与更新"
        value={settings.programProxy}
        onSave={(programProxy) => updateSettings({ programProxy })}
        description="应用于下一次获取官方 ComfyUI 程序。内置 ComfyUI 版本更新尚未接入；不修改系统或 Git 全局代理。"
      />
    </div>
  )
}
