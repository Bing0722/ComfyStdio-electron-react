import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { UpdateInfo } from '../../../../shared/application-api'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import './updates.css'

let snapshot = { update: null as UpdateInfo | null, version: '', busy: '', error: '', downloaded: '' }
const listeners = new Set<() => void>()
let started = false
function publish(patch: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach(listener => listener())
}
async function check() {
  if (snapshot.busy) return
  publish({ busy: '正在检查更新…', error: '' })
  try {
    if (!window.application) throw new Error()
    publish({ update: await window.application.checkUpdate(), downloaded: '' })
  } catch {
    publish({ error: '暂时无法检查更新，请稍后重试。' })
  } finally { publish({ busy: '' }) }
}
async function download() {
  if (snapshot.busy) return
  publish({ busy: '正在下载并校验更新包…', error: '' })
  try { publish({ downloaded: await window.application!.downloadUpdate() }) }
  catch { publish({ error: '下载或校验失败，请重试。' }) }
  finally { publish({ busy: '' }) }
}
export function SoftwareUpdate({ startup = false }: { startup?: boolean }) {
  const state = useSyncExternalStore(callback => {
    listeners.add(callback)
    return () => { listeners.delete(callback) }
  }, () => snapshot)
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!startup || started) return
    started = true
    void window.application?.info().then(info => publish({ version: info.version })).catch(() => {})
    void check()
  }, [startup])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => { dialog.current?.close(); previous?.focus() }
  }, [open])
  const available = state.update?.status === 'available'
  const status = state.update?.status
  const message = status === 'available' ? '新版本已就绪，可下载经过校验的更新包。'
    : status === 'current' ? '当前已是最新版本。'
    : status === 'unpublished' ? '尚未发布正式更新包。'
    : status === 'unsupported' ? '发现新版本，暂未提供适合当前系统的更新包。'
    : '检查是否有可用的新版本。'
  return <>
    <span ref={trigger} className="software-update-entry">
      <Button className={startup ? 'titlebar-button' : ''} onClick={() => setOpen(true)}
        aria-label={available ? '软件更新，有可用更新' : '软件更新'}>
        <Icon name="download" size={16} />软件更新
        {available && <span className="software-update-dot" aria-hidden="true" />}
      </Button>
    </span>
    {open && <dialog ref={dialog} className="modal-panel software-update-dialog" aria-labelledby="software-update-title"
      onCancel={event => { event.preventDefault(); setOpen(false) }}>
      <div className="software-update-heading"><span className="software-update-icon"><Icon name="download" size={25} /></span>
        <div><h2 id="software-update-title">软件更新</h2><p>让 ComfyStdio 保持最新</p></div>
      </div>
      <div className="software-update-summary" role="status">
        <strong>{state.downloaded ? '更新包已准备好' : state.busy || message}</strong>
        <p>当前版本 {state.version || state.update?.currentVersion || '—'}{state.update?.latestVersion && ' → ' + state.update.latestVersion}</p>
      </div>
      {state.error && <p className="error-text" role="alert">{state.error}</p>}
      {state.update?.notes && <section className="software-update-notes"><h3>更新内容</h3><p>{state.update.notes}</p></section>}
      <p className="software-update-hint">{state.downloaded ? '下载及校验完成。打开更新目录，退出软件后替换程序文件，保留 Data 和 ComfyUI 文件夹。' : '更新包下载后手动安装，保留现有数据和 ComfyUI 环境。'}</p>
      <div className="dialog-actions">
        <Button onClick={() => setOpen(false)}>关闭</Button>
        <Button disabled={!!state.busy} onClick={() => void check()}>重新检查</Button>
        {available && !state.downloaded && <Button className="button-primary" disabled={!!state.busy} onClick={() => void download()}>下载更新</Button>}
        {state.downloaded && <Button className="button-primary" onClick={() => void window.application?.openUpdates().catch(() => publish({ error: '无法打开更新目录，请重试。' }))}>打开更新目录</Button>}
      </div>
    </dialog>}
  </>
}
