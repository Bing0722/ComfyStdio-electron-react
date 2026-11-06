import { useEffect, useState } from 'react'
import type { DownloadModel } from '../../../../shared/comfy-api'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { ComfyContext } from '../comfy/ComfyContext'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { usePreferences } from '../settings/PreferencesProvider'
import { Section } from '../../components/ui/Section'
import '../plugins/plugins.css'
export function DownloadsPage() {
 const comfy = useComfy()
 const { settings } = usePreferences()
 const { readComfy, readBlockedReason, acquisitionProgress } = useWorkspace()
 const [items, setItems] = useState<DownloadModel[]>([])
 const [query, setQuery] = useState('')
 const [type, setType] = useState('全部类型')
 const [sort, setSort] = useState('名称 A–Z')
 const [busy, setBusy] = useState('')
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const [limit, setLimit] = useState(30)
 async function load(refresh = false) {
  setLoading(true); setError('')
  try { setItems(await window.comfy!.modelCatalog(refresh, settings.modelProxy)) }
  catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  finally { setLoading(false) }
 }
 useEffect(() => { void load() }, [])
 const installed = (m: DownloadModel) => comfy.models.some(item => item.path?.replaceAll('\\', '/').endsWith(`/models/${m.folder}/${m.filename}`))
 async function install(model: DownloadModel) {
  setBusy(model.url); setError('')
  try { await window.comfy!.downloadModel(model.url, settings.modelProxy); await readComfy('refresh') }
  catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  finally { setBusy('') }
 }
 const filtered = items.filter(m => (type === '全部类型' || m.type === type) && `${m.name} ${m.base} ${m.description}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => (sort === '未下载优先' ? Number(installed(a)) - Number(installed(b)) : 0) || a.name.localeCompare(b.name))
 const progress = acquisitionProgress.source
 return <><ComfyContext /><Section title="发现模型" count={items.length}>
  <div className="plugin-discover-toolbar"><input aria-label="搜索模型" placeholder="搜索模型名称、基础模型或用途…" value={query} onChange={e => { setQuery(e.target.value); setLimit(30) }} /><Select label="模型类型" value={type} options={['全部类型', ...new Set(items.map(m => m.type))]} onChange={v => { setType(v); setLimit(30) }} /><Select label="模型排序" value={sort} options={['名称 A–Z', '未下载优先']} onChange={setSort} /><Button disabled={loading || !!busy} onClick={() => void load(true)}>刷新目录</Button></div>
  <p className="footnote">{loading ? '正在获取模型目录…' : `匹配 ${filtered.length} 个模型 · 来源：ComfyUI-Manager · 目录已缓存`}</p>
  {busy && <div role="status">正在下载模型{progress?.step.startsWith('模型下载：') && <><progress max={progress.total || 1} value={progress.total ? progress.received : undefined} />{((progress.received || 0) / 1024 ** 2).toFixed(1)} MB</>}</div>}
  {error && <p className="error-text" role="alert">{error}</p>}
  <div className="plugin-catalog-grid">{filtered.slice(0,limit).map(m => <article className="plugin-catalog-card" key={m.url + m.folder + m.filename}><h3>{m.name}</h3><small>{m.type} · {m.base} · {m.size}</small><p>{m.description}</p><code title={`models/${m.folder}/${m.filename}`}>{m.folder}/{m.filename}</code><Button disabled={!!busy || !!readBlockedReason || installed(m)} onClick={() => void install(m)}>{installed(m) ? '已下载' : busy === m.url ? '下载中…' : '下载到模型目录'}</Button></article>)}</div>
  {!loading && !filtered.length && <p>没有匹配的模型。</p>}
  {filtered.length > limit && <Button onClick={() => setLimit(limit + 30)}>显示更多</Button>}
  <p className="footnote">模型下载到当前 ComfyUI 的对应目录，不覆盖已有文件。受限模型需要授权；目录未提供校验摘要，下载完成仅检查传输完整性。</p>
 </Section></>
}
