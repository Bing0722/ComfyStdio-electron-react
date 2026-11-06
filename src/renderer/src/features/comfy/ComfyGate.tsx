import type { ReactNode } from 'react'
import { useWorkspace } from '../../state/WorkspaceProvider'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import './comfy.css'
export function ComfyGate({ children }: { children: ReactNode }) {
  const { state, readComfy, acquiring } = useWorkspace()
  if (state.comfy && state.read.phase === 'ready') return children
  const reading = state.read.phase === 'reading'
  return (
    <Surface className="comfy-setup">
      <span className="setup-icon">
        <Icon name="terminal" size={26} />
      </span>
      <h2>
        {reading
          ? acquiring
            ? '正在获取 ComfyUI'
            : '正在读取 ComfyUI'
          : state.read.phase === 'failed'
            ? '未能读取 ComfyUI'
            : '先读取你的 ComfyUI'}
      </h2>
      <p>
        {reading
          ? acquiring
            ? '正在从官方仓库获取程序，网络较慢时可能需要几分钟。'
            : '正在识别程序版本、模型和自定义节点。'
          : '一个工作目录，统一管理启动、版本、模型和插件。'}
      </p>
      {state.read.error && (
        <p className="error-text" role="alert">
          {state.read.error}
        </p>
      )}
      <div className="setup-actions">
        <Button disabled={reading} onClick={() => void readComfy('acquire')}>
          获取 ComfyUI
        </Button>
        {acquiring && (
          <Button onClick={() => void window.comfy?.cancelAcquire()}>
            取消获取
          </Button>
        )}
        <Button
          className="button-primary"
          disabled={reading}
          onClick={() => void readComfy('choose')}
        >
          {reading ? '读取中…' : '选择并读取 ComfyUI'}
        </Button>
      </div>
      <p className="footnote">
        获取需要 Git，将新建 ComfyUI
        文件夹；仅获取源码，运行依赖需另行配置。已有程序可选择包含 main.py 的
        ComfyUI 目录，也支持包含 ComfyUI 子目录的便携包。
      </p>
    </Surface>
  )
}
