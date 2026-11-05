import { useState } from 'react'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Section, Status } from '../../components/ui/Section'
import { Collapse } from '../../components/motion/Collapse'
import { Icon } from '../../components/ui/Icon'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { ComfyContext } from './ComfyContext'
export function LaunchPage() {
  const comfy = useComfy()
  const { state, dispatch, readComfy, readBlockedReason } = useWorkspace()
  const { showDialog } = useFeedback()
  const [showLogs, setShowLogs] = useState(false)
  const busy = ['启动中', '运行中'].includes(state.runtime.status)
  return (
    <>
      <ComfyContext />
      <Surface className="comfy-launch">
        <div className="launch-heading">
          <div>
            <span className="subtle-label">当前程序</span>
            <h2>ComfyUI</h2>
          </div>
          <Status value={state.runtime.status} />
        </div>
        <p className="launch-version">
          {comfy.version}
          {state.versionTask && ' · 正在变更版本'}
        </p>
        <div className="launch-footer">
          <span className="muted">启动操作为演示</span>
          <Button
            className="button-primary"
            disabled={Boolean(state.versionTask)}
            onClick={() =>
              dispatch({
                type: 'runtime/status',
                status: busy ? '已停止' : '启动中',
              })
            }
          >
            <Icon name={busy ? 'stop' : 'play'} size={14} />
            {busy
              ? '停止演示'
              : state.runtime.status === '失败'
                ? '重试启动演示'
                : '演示启动'}
          </Button>
        </div>
      </Surface>
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
        <p className="footnote">
          切换版本或更新针对同一份 ComfyUI，模型与插件继续归属于这个目录。
        </p>
      </Section>
      <Section
        title="运行日志"
        action={
          <Button
            className="button-quiet"
            aria-expanded={showLogs}
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? '收起日志' : '展开日志'}
          </Button>
        }
      >
        <Collapse open={showLogs}>
          <pre className="log-output" role="log">
            {state.runtime.logs.join('\n') || '等待启动演示。'}
          </pre>
        </Collapse>
        <Collapse open={!showLogs}>
          <p className="section-hint">
            {state.runtime.status === '已停止'
              ? '启动后可查看运行记录。'
              : state.runtime.status}
          </p>
        </Collapse>
      </Section>
      <div className="comfy-replace">
        <Button
          disabled={Boolean(readBlockedReason)}
          title={readBlockedReason}
          onClick={() =>
            showDialog({
              title: '更换当前 ComfyUI？',
              text: '应用仍只管理一个 ComfyUI。选择并读取新目录后，模型、插件和版本信息将整体替换。',
              confirmLabel: '选择其他目录',
              action: () => void readComfy('choose'),
            })
          }
        >
          更换 ComfyUI 目录
        </Button>
        {readBlockedReason && <p>{readBlockedReason}</p>}
      </div>
      <details className="demo-tools">
        <summary>演示操作</summary>
        <Button
          disabled={Boolean(state.versionTask)}
          onClick={() => dispatch({ type: 'runtime/status', status: '失败' })}
        >
          模拟启动失败
        </Button>
      </details>
    </>
  )
}
