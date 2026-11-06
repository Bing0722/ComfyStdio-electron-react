import { useEffect, useState } from 'react'
import type {
  ApplicationInfo,
  UpdateInfo,
} from '../../../../shared/application-api'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
export function SoftwareUpdate() {
  const [info, setInfo] = useState<ApplicationInfo | null>(null),
    [update, setUpdate] = useState<UpdateInfo | null>(null),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [downloaded, setDownloaded] = useState('')
  useEffect(() => {
    void window.application
      ?.info()
      .then(setInfo)
      .catch(() => setError('无法读取应用目录'))
  }, [])
  async function check() {
    setBusy('检查中…')
    setError('')
    setDownloaded('')
    try {
      if (!window.application) throw new Error('请使用桌面应用')
      setUpdate(await window.application.checkUpdate())
    } catch (error) {
      setError(error instanceof Error ? error.message : '检查失败')
    } finally {
      setBusy('')
    }
  }
  async function download() {
    setBusy('正在下载并校验更新包…')
    setError('')
    try {
      setDownloaded(await window.application!.downloadUpdate())
    } catch (error) {
      setError(error instanceof Error ? error.message : '下载失败')
    } finally {
      setBusy('')
    }
  }
  return (
    <Section
      title="软件更新与便携目录"
      action={
        <Button disabled={Boolean(busy)} onClick={() => void check()}>
          {busy || '检查软件更新'}
        </Button>
      }
    >
      <p>当前版本：{info?.version ?? '读取中…'}</p>
      {update && (
        <p role="status">
          {update.message}
          {update.latestVersion && ` · ${update.latestVersion}`}
        </p>
      )}
      {update?.status === 'available' && !downloaded && (
        <Button disabled={Boolean(busy)} onClick={() => void download()}>
          下载更新包
        </Button>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {downloaded && (
        <>
          <p role="status">更新包已下载并通过 SHA-256 校验：{downloaded}</p>
          <Button
            onClick={() =>
              void window.application
                ?.openUpdates()
                .catch(() => setError('无法打开更新目录'))
            }
          >
            打开更新目录
          </Button>
        </>
      )}
      {update?.notes && (
        <details>
          <summary>更新说明</summary>
          <pre className="release-notes">{update.notes}</pre>
        </details>
      )}
      <dl className="device-facts">
        <div>
          <dt>程序文件夹</dt>
          <dd>{info?.root ?? '读取中…'}</dd>
        </div>
        <div>
          <dt>配置与缓存</dt>
          <dd>{info?.data ?? '读取中…'}</dd>
        </div>
        <div>
          <dt>获取 ComfyUI 的位置</dt>
          <dd>{info?.comfy ?? '读取中…'}</dd>
        </div>
      </dl>
      <p className="footnote">
        便携包解压到可写文件夹即可运行。更新时先退出程序，将新包的程序文件覆盖到原文件夹，保留
        Data 和 ComfyUI。不会在运行时替换程序，也不会自动安装。
      </p>
    </Section>
  )
}
