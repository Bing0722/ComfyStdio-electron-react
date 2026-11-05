import { useWorkspace } from '../../state/WorkspaceProvider'
import { Switch } from '../../components/ui/Switch'
import { Button } from '../../components/ui/Button'
import { Section } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { themes, usePreferences } from './PreferencesProvider'
import './settings.css'
export function SettingsPage() {
  const { theme, setTheme, liquid, setLiquid, settings, updateSettings } =
    usePreferences()
  const { state } = useWorkspace()
  const { notify } = useFeedback()
  return (
    <>
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
      <Section title="下载与网络">
        <form
          className="settings-form"
          onSubmit={(event) => {
            event.preventDefault()
            notify('配置校验通过，已保留于本次演示会话')
          }}
        >
          <label htmlFor="model-directory">模型目录</label>
          <input
            id="model-directory"
            readOnly
            value={
              state.read.phase === 'ready'
                ? (state.comfy?.modelsPath ?? '')
                : ''
            }
            placeholder="先在启动页读取 ComfyUI"
          />
          <p className="footnote">
            目录由当前 ComfyUI 决定，更换程序后同步更新。
          </p>
          <div className="setting-row">
            <div>
              <h3>并行下载</h3>
              <p>同时下载的任务数量。</p>
            </div>
            <Select
              label="并行下载任务"
              value={settings.concurrency}
              options={['1 个任务', '2 个任务', '3 个任务']}
              onChange={(concurrency) => updateSettings({ concurrency })}
            />
          </div>
          <label htmlFor="proxy-address">
            代理地址 <span className="muted">可选</span>
          </label>
          <input
            id="proxy-address"
            type="url"
            pattern="https?://.*"
            placeholder="http://127.0.0.1:7890"
            value={settings.proxy}
            onChange={(event) => updateSettings({ proxy: event.target.value })}
          />
          <p className="footnote">
            支持 HTTP / HTTPS。当前仅演示配置与校验，不应用到实际网络。
          </p>
          <Button type="submit" className="button-primary">
            保存配置
          </Button>
        </form>
      </Section>
    </>
  )
}
