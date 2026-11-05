import { Surface } from '../../components/ui/Surface'
import { Collapse } from '../../components/motion/Collapse'
import { Button } from '../../components/ui/Button'
import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Section, Status } from '../../components/ui/Section'
import { useCurrentInstance, useWorkspace } from '../../state/WorkspaceProvider'
import './instances.css'

export function InstancesPage() {
  const { state, dispatch } = useWorkspace()
  const current = useCurrentInstance()
  const [showLogs, setShowLogs] = useState(false)
  const busy = current.status === '启动中' || current.status === '运行中'
  return (
    <>
      <Surface className="instance-focus" aria-label="当前实例">
        <div className="instance-focus-heading">
          <div>
            <span className="subtle-label">当前实例</span>
            <h2>{current.name}</h2>
          </div>
          <Status value={current.status} />
        </div>
        <p className="instance-path">{current.path}</p>
        <div className="instance-focus-footer">
          <span className="muted">
            {current.version} <span className="separator">/</span> Python 3.12
          </span>
          <Button
            className="button-primary"
            onClick={() =>
              dispatch({
                type: 'instance/status',
                id: current.id,
                status: busy ? '已停止' : '启动中',
              })
            }
          >
            <Icon name={busy ? 'stop' : 'play'} size={14} />
            {busy
              ? '停止实例'
              : current.status === '失败'
                ? '重试启动'
                : '启动 ComfyUI'}
          </Button>
        </div>
      </Surface>
      <Section title="实例" count={state.instances.length}>
        <div className="item-list">
          {state.instances.map((instance) => (
            <div
              className={`list-row instance-row ${instance.id === current.id ? 'is-current' : ''}`}
              key={instance.id}
            >
              <Icon name="terminal" />
              <div className="row-content">
                <div className="row-title">
                  {instance.name}
                  {instance.id === current.id && (
                    <span className="inline-note">当前</span>
                  )}
                </div>
                <div className="row-description">
                  {instance.version} · {instance.path}
                </div>
              </div>
              <Status value={instance.status} />
              <Button
                className="button-quiet"
                disabled={instance.id === current.id}
                onClick={() =>
                  dispatch({ type: 'instance/select', id: instance.id })
                }
              >
                {instance.id === current.id ? '已选择' : '选择'}
              </Button>
            </div>
          ))}
        </div>
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
          <pre className="log-output" role="log" aria-label="实例日志">
            {current.logs.join('\n') || '等待启动实例。'}
          </pre>
        </Collapse>
        <Collapse open={!showLogs}>
          <p className="section-hint">
            {current.status === '已停止'
              ? '启动后可查看运行记录。'
              : `${current.name} · ${current.status}`}
          </p>
        </Collapse>
      </Section>
      <details className="demo-tools">
        <summary>演示操作</summary>
        <Button
          onClick={() =>
            dispatch({
              type: 'instance/status',
              id: current.id,
              status: '失败',
            })
          }
        >
          模拟启动失败
        </Button>
      </details>
    </>
  )
}
