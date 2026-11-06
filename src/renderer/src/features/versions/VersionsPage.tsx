import { useEffect, useState } from 'react'
import type { VersionStatus } from '../../../../shared/comfy-api'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { usePreferences } from '../settings/PreferencesProvider'
import { ComfyContext } from '../comfy/ComfyContext'
export function VersionsPage() {
  const comfy = useComfy()
  const { readComfy, readBlockedReason } = useWorkspace()
  const { settings } = usePreferences()
  const [status, setStatus] = useState<VersionStatus>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('')
  useEffect(() => {
    let active = true
    setError('')
    window.comfy!.versions('status').then(value => { if (active) setStatus(value) }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [comfy.path, comfy.readAt])
  async function operate(action: 'fetch' | 'switch') {
    setPending(true); setError('')
    try {
      setStatus(await window.comfy!.versions(action, selected, settings.programProxy))
      if (action === 'switch') await readComfy('refresh')
    } catch (error) { setError(error instanceof Error ? error.message : String(error)) }
    finally { setPending(false) }
  }
  return <>
    <ComfyContext />
    <Section title="当前 ComfyUI 版本">
      <h3>{comfy.version}</h3>
      {status && <><p>提交：{status.commit}</p><p>分支：{status.branch || '固定版本'} · 标签：{status.tag || '无匹配标签'}</p><p>{status.dirty ? '存在本地改动，不能切换' : '工作目录干净'}</p></>}
      <Button disabled={pending || !!readBlockedReason} onClick={() => void operate('fetch')}>获取官方版本</Button>
      <select aria-label="目标 ComfyUI 版本" value={selected} disabled={pending} onChange={event => setSelected(event.target.value)}>
        <option value="">选择版本</option>
        {status?.tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
      </select>
      <Button disabled={pending || !!readBlockedReason || !selected || status?.dirty} onClick={() => void operate('switch')}>切换版本</Button>
      <p role="status">{pending ? '正在处理版本，请稍候…' : ''}</p>
      {error && <p role="alert" className="error-text">{error}</p>}
      <p className="footnote">切换当前目录的 ComfyUI 核心代码。模型、插件和 Python 环境不会随版本切换；跨版本可能需要更新依赖。没有 Git 仓库的目录不支持切换。</p>
    </Section>
  </>
}
