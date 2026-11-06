import { usePreferences } from '../settings/PreferencesProvider'
import { Switch } from '../../components/ui/Switch'
import { AcquisitionButtons } from './AcquisitionButtons'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Section, Status } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { ComfyContext } from './ComfyContext'
export function LaunchPage() {
  const comfy = useComfy()
  const {
    state,
    readComfy,
    readBlockedReason,
    liveRuntime,
    launchPending: pending,
    operateRuntime,
  } = useWorkspace()
  const { runMode, setRunMode, portableCpu, setPortableCpu } = usePreferences()
  const { showDialog, notify } = useFeedback()
  const status =
    liveRuntime.path === comfy.path ? liveRuntime.status : state.runtime.status
  const running = ['启动中', '运行中', '停止中'].includes(status)
  const usesEmbeddedPython =
    comfy.embeddedPython &&
    (!comfy.selectedPython || comfy.selectedPython === comfy.embeddedPython)
  async function operate(action: Parameters<typeof operateRuntime>[0]) {
    try {
      await operateRuntime(action)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '操作失败，请查看运行日志',
      )
    }
  }
  return (
    <>
      <ComfyContext />
      <Surface className="comfy-launch">
        <div className="launch-heading">
          <div>
            <span className="subtle-label">当前程序</span>
            <h2>ComfyUI</h2>
          </div>
          <Status value={status} />
        </div>
        <p className="launch-version">
          {comfy.version} · {comfy.embeddedPython ? '便携版' : '本地程序'}
        </p>
        <div className="setting-row">
          <div>
            <h3>启动方式</h3>
            <p>API 服务不自动打开浏览器；两种方式均提供本地 API。</p>
          </div>
          <Select
            label="启动方式"
            value={runMode}
            options={['API 服务', '打开网页']}
            onChange={setRunMode}
          />
        </div>
        <p className="footnote">
          API 地址：http://127.0.0.1:8188 ·
          仅监听本机。运行记录、警告和异常请查看侧栏“运行日志”。
        </p>
        <div className="launch-footer">
          <span className="muted">使用当前程序的 Python 环境</span>
          <div className="row-actions">
            <Button
              className="button-primary"
              disabled={pending || running}
              onClick={() => void operate('start')}
            >
              启动 ComfyUI
            </Button>
            <Button
              disabled={pending || status !== '运行中'}
              onClick={() => void operate('restart')}
            >
              重启
            </Button>
            <Button
              disabled={pending || !running || status === '停止中'}
              onClick={() => void operate('stop')}
            >
              关闭 ComfyUI
            </Button>
          </div>
        </div>
      </Surface>
      <Section
        title="Python 环境"
        action={
          <Button
            disabled={running || pending}
            onClick={() => void operate('choosePython')}
          >
            选择 Python
          </Button>
        }
      >
        <p className="footnote">
          {comfy.selectedPython ||
            comfy.embeddedPython ||
            (liveRuntime.path === comfy.path ? liveRuntime.python : '') ||
            '自动查找 .venv、venv；未找到时使用系统 Python。'}
        </p>
        {usesEmbeddedPython && (
          <div className="setting-row">
            <div>
              <h3>仅使用 CPU</h3>
              <p>无兼容 GPU 时可启用。下次启动或重启时生效。</p>
            </div>
            <Switch
              label="仅使用 CPU"
              checked={portableCpu}
              onChange={setPortableCpu}
            />
          </div>
        )}
        <p className="footnote">
          手动选择的 Python 需已安装 ComfyUI 依赖。启动方式和环境设置在下次启动或重启时生效。
        </p>
      </Section>
      <Section title="程序内容">
        <dl className="comfy-paths">
          <div>
            <dt>模型 · {comfy.models.length}</dt>
            <dd>{comfy.modelsPath}</dd>
          </div>
          <div>
            <dt>插件 · {Object.keys(comfy.plugins).length}</dt>
            <dd>{comfy.pluginsPath}</dd>
          </div>
        </dl>
      </Section>
      {state.read.error && <p className="error-text" role="alert">{state.read.error}</p>}
      <div className="comfy-replace">
        <AcquisitionButtons />
        <Button
          disabled={Boolean(readBlockedReason) || pending}
          title={readBlockedReason}
          onClick={() =>
            showDialog({
              title: '更换当前 ComfyUI？',
              text: '选择后会重新读取程序、模型和插件。',
              confirmLabel: '选择其他目录',
              action: () => void readComfy('choose'),
            })
          }
        >
          更换 ComfyUI 目录
        </Button>
        {readBlockedReason && <p>{readBlockedReason}</p>}
      </div>
    </>
  )
}
