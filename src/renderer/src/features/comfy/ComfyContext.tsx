import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { Button } from '../../components/ui/Button'
export function ComfyContext() {
  const comfy = useComfy()
  const { readComfy, readBlockedReason } = useWorkspace()
  return (
    <>
      <div className="comfy-context">
        <div>
          <span className="subtle-label">当前 ComfyUI · 本地读取</span>
          <code>{comfy.path}</code>
        </div>
        <Button
          disabled={Boolean(readBlockedReason)}
          title={readBlockedReason || '重新读取版本、模型和插件'}
          onClick={() => void readComfy('refresh')}
        >
          重新读取
        </Button>
      </div>
      {comfy.warnings.length > 0 && (
        <details className="scan-warnings">
          <summary>读取提示 · {comfy.warnings.length}</summary>
          {comfy.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </details>
      )}
    </>
  )
}
