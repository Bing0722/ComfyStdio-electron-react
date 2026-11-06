import type { ReactNode } from 'react'
import { useWorkspace } from '../../state/WorkspaceProvider'
import { Surface } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { AcquisitionButtons } from './AcquisitionButtons'
import './comfy.css'
export function ComfyGate({ children }: { children: ReactNode }) {
  const { state, readComfy, acquiring } = useWorkspace()
  if (state.comfy && state.read.phase === 'ready') return children
  const reading = state.read.phase === 'reading'
  const acquisitionTitle = {
    source: '正在获取 ComfyUI 源码',
    portable: '正在获取 ComfyUI 便携版',
    both: '正在获取 ComfyUI 源码和便携版',
  }
  return (
    <Surface className="comfy-setup">
      <span className="setup-icon">
        <Icon name="terminal" size={26} />
      </span>
      <h2>
        {reading
          ? acquiring ? acquisitionTitle[acquiring] : '正在读取 ComfyUI'
          : state.read.phase === 'failed'
            ? '未能读取 ComfyUI'
            : '先读取你的 ComfyUI'}
      </h2>
      <p>
        {reading
          ? acquiring
            ? acquiring === 'source'
              ? '正在检查本地源码，或从官方 Git 仓库获取。'
              : '正在检查本地程序，或从官方发布下载、校验并解压便携包。首次获取可能需要较长时间。'
            : '正在识别程序版本、模型和自定义节点。'
          : '一个工作目录，统一管理启动、版本、模型和插件。'}
      </p>
      {state.read.error && (
        <p className="error-text" role="alert">
          {state.read.error}
        </p>
      )}
      <div className="setup-actions">
        <AcquisitionButtons />
        <Button
          className="button-primary"
          disabled={reading}
          onClick={() => void readComfy('choose')}
        >
          {reading ? '读取中…' : '选择并读取 ComfyUI'}
        </Button>
      </div>
      <p className="footnote">
        源码需要 Git 获取，运行环境需自行配置。Windows x64 可获取官方 NVIDIA / CPU 便携包，内含 Python 和运行依赖。
        已有程序可直接选择源码目录或便携包目录。
      </p>
    </Surface>
  )
}
