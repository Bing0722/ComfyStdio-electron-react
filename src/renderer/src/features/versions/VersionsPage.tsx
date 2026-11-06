import { cachedVersions, loadVersions, saveVersions } from './version-cache'
import { useEffect, useRef, useState } from 'react'
import type { VersionStatus } from '../../../../shared/comfy-api'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { usePreferences } from '../settings/PreferencesProvider'
import { ComfyContext } from '../comfy/ComfyContext'
import './versions.css'
const newer = (a: string, b: string) => {
  const left = a.replace(/^v/, '').split('.').map(Number)
  const right = b.replace(/^v/, '').split('.').map(Number)
  if (right.length !== 3 || right.some(Number.isNaN)) return false
  for (let i = 0; i < 3; i++) { if (left[i] !== right[i]) return left[i] > right[i] }
  return false
}
export function VersionsPage() {
  const comfy = useComfy()
  const { readComfy, readBlockedReason } = useWorkspace()
  const { settings } = usePreferences()
  const [status, setStatus] = useState<VersionStatus | undefined>(() => cachedVersions(comfy.path)?.value)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const request = useRef(0)
  useEffect(() => {
    const id = ++request.current
    const cached = cachedVersions(comfy.path)
    setStatus(cached?.value); setSelected(''); setError(cached?.error || ''); setNotice('')
    if (readBlockedReason && !cached) return
    setPending(!cached || cached.pending ? '正在获取官方版本…' : '')
    loadVersions(comfy.path, () => window.comfy!.versions('fetch', '', settings.programProxy))
      .then(value => { if (id === request.current) setStatus(value) })
      .catch(error => { if (id === request.current) setError(error.message) })
      .finally(() => { if (id === request.current) setPending('') })
    return () => { request.current++ }
  }, [comfy.path, readBlockedReason])
  const current = status?.tag || comfy.version
  const latest = status?.tags[0]
  const updateAvailable = latest && newer(latest, current)
  const blocked = !!pending || !!readBlockedReason
  async function operate(action: 'fetch' | 'switch', target = selected) {
    if (blocked) return
    const id = ++request.current
    setPending(action === 'fetch' ? '正在获取官方版本…' : `正在切换到 ${target}…`)
    setError(''); setNotice('')
    try {
      const value = action === 'fetch'
        ? await loadVersions(comfy.path, () => window.comfy!.versions('fetch', '', settings.programProxy), true)
        : await window.comfy!.versions(action, target, settings.programProxy)
      saveVersions(comfy.path, value)
      if (id !== request.current) return
      setStatus(value)
      if (action === 'switch') {
        setSelected(target)
        await readComfy('refresh')
        setNotice(`已切换到 ${target}`)
      } else setNotice(`已获取 ${value.tags.length} 个官方版本`)
    } catch (error) { if (id === request.current) setError(error instanceof Error ? error.message : String(error)) }
    finally { setPending('') }
  }
  const tags = status?.tags.filter(tag => tag.toLowerCase().includes(search.toLowerCase())) || []
  return <>
    <ComfyContext />
    <Section title="ComfyUI 版本管理">
      <div className="version-overview">
        <div><span className="subtle-label">当前安装</span><h2>{current}</h2><p>{status?.branch || '固定版本'} · {status?.commit.slice(0, 10) || '正在读取版本信息'}</p></div>
        <div className="version-update"><span className="subtle-label">官方版本</span><strong>{latest || '尚未获取'}</strong><span>{updateAvailable ? '有新版本可以更新' : latest ? '可从下方选择目标版本' : '获取后查看可用更新'}</span>
          <div className="version-actions"><Button disabled={blocked} onClick={() => void operate('fetch')}>{latest ? '刷新版本' : '获取官方版本'}</Button>
          {updateAvailable && <Button className="button-primary" disabled={blocked || !!status?.dirty} onClick={() => void operate('switch', latest)}>更新至 {latest}</Button>}</div>
        </div>
      </div>
      <div className="version-feedback" role="status">{pending || notice || (status?.dirty ? '当前目录有本地改动，处理后才能切换版本。' : '切换前请先停止 ComfyUI。')}</div>
      {error && <p role="alert" className="error-text">{error}</p>}
    </Section>
    <Section title="可用版本" count={status?.tags.length || 0}>
      <div className="version-toolbar"><input aria-label="搜索版本" placeholder="搜索版本号，如 0.44" value={search} onChange={event => setSearch(event.target.value)} /><span>{selected ? `已选择 ${selected}` : '选择要使用的版本'}</span></div>
      <div className="version-list" role="group" aria-label="可用 ComfyUI 版本">
        {tags.map(tag => <button type="button" className={`version-option ${selected === tag ? 'is-selected' : ''}`} key={tag} aria-pressed={selected === tag} disabled={blocked} onClick={() => setSelected(tag)}>
          <span><strong>{tag}</strong><small>{tag === current ? '当前版本' : tag === latest ? '最新版本' : '历史版本'}</small></span><span aria-hidden="true">{selected === tag ? '✓' : '○'}</span>
        </button>)}
        {!tags.length && <p className="version-empty">{status?.tags.length ? '没有匹配的版本' : '点击“获取官方版本”加载可切换的版本。'}</p>}
      </div>
      <div className="version-footer"><p>切换核心代码，保留模型、插件和 Python 环境。跨版本可能需要更新依赖。</p><Button className="button-primary" disabled={blocked || !selected || selected === current || !status || status.dirty} onClick={() => void operate('switch')}>{selected === current ? '正在使用此版本' : selected ? `切换到 ${selected}` : '选择版本后切换'}</Button></div>
    </Section>
  </>
}
