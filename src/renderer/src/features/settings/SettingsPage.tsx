import { Switch } from '../../components/ui/Switch'
import { Section } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { themes, usePreferences } from './PreferencesProvider'
import { ProxyCard } from './ProxyCard'
import { FolderSettings } from './FolderSettings'
import './settings.css'
export function SettingsPage() {
  const { theme, setTheme, liquid, setLiquid, settings, updateSettings } =
    usePreferences()
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
          <Switch checked={liquid} onChange={setLiquid} label="液态效果" />
        </div>
      </Section>
      <FolderSettings />
      <ProxyCard
        title="模型下载"
        value={settings.modelProxy}
        onSave={(modelProxy) => updateSettings({ modelProxy })}
        description="单独保存用于模型下载；当前下载仍为演示，尚未发起真实网络请求。"
      >
        <div className="setting-row">
          <div>
            <h3>并行下载</h3>
            <p>保存下载偏好，当前任务为演示。</p>
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
        description="单独保存用于插件安装与更新；当前插件操作仍为演示，尚未接入真实网络。"
      />
      <ProxyCard
        title="ComfyUI 获取与更新"
        value={settings.programProxy}
        onSave={(programProxy) => updateSettings({ programProxy })}
        description="应用于下一次获取官方 ComfyUI 程序。版本更新仍为演示；不修改系统或 Git 全局代理。"
      />
    </div>
  )
}
