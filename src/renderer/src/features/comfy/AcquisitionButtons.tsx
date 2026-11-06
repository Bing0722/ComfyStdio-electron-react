import { Button } from '../../components/ui/Button'
import { useWorkspace } from '../../state/WorkspaceProvider'

export function AcquisitionButtons() {
  const { readComfy, readBlockedReason, acquiring } = useWorkspace()
  const windows =
    window.windowControls?.platform === 'win32' &&
    window.windowControls?.arch === 'x64'
  const disabled = Boolean(readBlockedReason)
  return (
    <>
      <Button disabled={disabled} onClick={() => void readComfy('source')}>
        获取或使用源码
      </Button>
      {windows && (
        <>
          <Button disabled={disabled} onClick={() => void readComfy('portable')}>
            获取或使用便携版（含 Python）
          </Button>
          <Button disabled={disabled} onClick={() => void readComfy('both')}>
            同时获取两种版本
          </Button>
        </>
      )}
      {acquiring && (
        <Button onClick={() => void window.comfy?.cancelAcquire()}>
          取消获取
        </Button>
      )}
    </>
  )
}
