import { useState } from 'react'
import type { RunMode } from '../../../../shared/runtime-api'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Section, Status } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { ComfyContext } from './ComfyContext'
export function LaunchPage() {
  const comfy = useComfy()
  const { state, dispatch, readComfy, readBlockedReason, liveRuntime } =
    useWorkspace()
  const { showDialog, notify } = useFeedback()
  const [mode, setMode] = useState<RunMode>('API 服务')
  const [pending, setPending] = useState(false)
  const [python, setPython] = useState('')
  const status =
    comfy.source === 'local' && liveRuntime.path === comfy.path
      ? liveRuntime.status
      : state.runtime.status
  const running = ['启动中', '运行中', '停止中'].includes(status)
  async function operate(action: 'start' | 'restart' | 'stop') {
    if (comfy.source === 'demo') {
      dispatch({
        type: 'runtime/status',
        status: action === 'stop' ? '已停止' : '启动中',
      })
      notify('演示环境运行状态已更新')
      return
    }
    setPending(true)
    try {
      if (!window.runtime) throw new Error('请使用桌面应用')
      if (action === 'stop') await window.runtime.stop()
      else await window.runtime[action](mode)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '操作失败，请查看运行日志',
      )
    } finally {
      setPending(false)
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
          {comfy.version} · {comfy.source === 'demo' ? '演示环境' : '本地程序'}
        </p>
        <div className="setting-row">
          <div>
            <h3>启动方式</h3>
            <p>API 服务不自动打开浏览器；两种方式均提供本地 API。</p>
          </div>
          <Select
            label="启动方式"
            value={mode}
            options={['API 服务', '打开网页']}
            onChange={setMode}
          />
        </div>
        <p className="footnote">
          API 地址：http://127.0.0.1:8188 ·
          仅监听本机。运行记录、警告和异常请查看侧栏“运行日志”。
        </p>
        <div className="launch-footer">
          <span className="muted">
            {comfy.source === 'demo'
              ? '以下操作为演示'
              : '使用当前程序的 Python 环境'}
          </span>
          <div className="row-actions">
            <Button
              className="button-primary"
              disabled={pending || running || Boolean(state.versionTask)}
              onClick={() => void operate('start')}
            >
              启动 ComfyUI
            </Button>
            <Button
              disabled={
                pending || status !== '运行中' || Boolean(state.versionTask)
              }
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
      {comfy.source === 'local' && (
        <Section
          title="Python 环境"
          action={
            <Button
              disabled={running || pending}
              onClick={async () => {
                try {
                  const selected = await window.runtime?.choosePython()
                  if (selected) setPython(selected)
                } catch (error) {
                  notify(String(error))
                }
              }}
            >
              选择 Python
            </Button>
          }
        >
          <p className="footnote">
            {python ||
              (liveRuntime.path === comfy.path ? liveRuntime.python : '') ||
              '自动查找 .venv、venv、便携版 Python；未找到时使用系统 Python。'}
          </p>
          <p className="footnote">
            所选环境需要已安装 ComfyUI 依赖。选择其他启动方式后，重启生效。
          </p>
        </Section>
      )}
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
      <div className="comfy-replace">
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
