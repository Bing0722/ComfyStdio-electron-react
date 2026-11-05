import type { ReactNode } from 'react'
import { useWorkspace } from '../../state/WorkspaceProvider'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import './comfy.css'
export function ComfyGate({ children }: { children: ReactNode }) {
  const { state, readComfy } = useWorkspace()
  if (state.comfy && state.read.phase === 'ready') return children
  const reading = state.read.phase === 'reading'
  return (
    <Surface className="comfy-setup">
      <span className="setup-icon">
        <Icon name="terminal" size={26} />
      </span>
      <h2>
        {reading
          ? '正在读取 ComfyUI'
          : state.read.phase === 'failed'
            ? '未能读取 ComfyUI'
            : '先读取你的 ComfyUI'}
      </h2>
      <p>
        {reading
          ? '正在识别程序版本、模型和自定义节点。'
          : '一个工作目录，统一管理启动、版本、模型和插件。'}
      </p>
      {state.read.error && (
        <p className="error-text" role="alert">
          {state.read.error}
        </p>
      )}
      <div className="setup-actions">
        <Button
          className="button-primary"
          disabled={reading}
          onClick={() => void readComfy('choose')}
        >
          {reading ? '读取中…' : '选择并读取 ComfyUI'}
        </Button>
        <Button disabled={reading} onClick={() => void readComfy('demo')}>
          读取演示环境
        </Button>
      </div>
      <p className="footnote">
        选择包含 main.py 的 ComfyUI 目录，也支持包含 ComfyUI 子目录的便携包。
      </p>
    </Surface>
  )
}
