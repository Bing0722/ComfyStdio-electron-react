import { Button } from '../../components/ui/Button'
import { useWorkspace } from '../../state/WorkspaceProvider'

export function AcquisitionButtons() {
  const { readComfy, readBlockedReason, acquiring, acquisitionProgress } = useWorkspace()
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
      {acquiring && Object.values(acquisitionProgress).map(value => (
        <div key={value.kind} style={{ width: '100%', textAlign: 'left' }} aria-live="polite">
          <div>{value.kind === 'portable' ? '便携版' : '源码'} · {value.step}</div>
          <progress style={{ width: '100%' }} aria-label={value.step} max={value.total || 1} value={value.total ? value.received : undefined} />
          {value.total && <small>{((value.received || 0) / value.total * 100).toFixed(1)}% · {((value.received || 0) / 1024 ** 2).toFixed(1)} / {(value.total / 1024 ** 2).toFixed(1)} MB</small>}
        </div>
      ))}
      {acquiring && (
        <Button onClick={() => void window.comfy?.cancelAcquire()}>
          取消获取
        </Button>
      )}
    </>
  )
}
