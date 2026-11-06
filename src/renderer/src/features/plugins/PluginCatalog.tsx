import { useEffect, useState } from 'react'
import type { CatalogPlugin } from '../../../../shared/comfy-api'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
export function PluginCatalog({ proxy, installed, disabled, install }: { proxy: string; installed: string[]; disabled: boolean; install: (url: string) => void }) {
 const [items, setItems] = useState<CatalogPlugin[]>([])
 const [query, setQuery] = useState('')
 const [sort, setSort] = useState('name')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 const [limit, setLimit] = useState(30)
 async function load(refresh = false) {
  setLoading(true); setError('')
  try { setItems(await window.comfy!.pluginCatalog(refresh, proxy)) }
  catch (error) { setError(error instanceof Error ? error.message : String(error)) }
  finally { setLoading(false) }
 }
 useEffect(() => { void load() }, [])
 const has = (url: string) => installed.some(name => name.replace(/\.disabled$/, '').toLowerCase() === url.split('/').at(-1)!.replace(/\.git$/, '').toLowerCase())
 const filtered = items.filter(item => `${item.title} ${item.author} ${item.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'available' ? Number(has(a.url)) - Number(has(b.url)) || a.title.localeCompare(b.title) : a.title.localeCompare(b.title))
 return <Section title="发现插件" count={items.length}>
  <div className="plugin-discover-toolbar"><input aria-label="搜索插件目录" placeholder="搜索插件名称、作者或功能…" value={query} onChange={e => { setQuery(e.target.value); setLimit(30) }} /><select aria-label="插件排序" value={sort} onChange={e => setSort(e.target.value)}><option value="name">名称 A–Z</option><option value="available">未安装优先</option></select><Button disabled={loading} onClick={() => void load(true)}>刷新目录</Button></div>
  <p className="footnote" role="status">{loading ? '正在获取插件目录…' : `匹配 ${filtered.length} 个插件 · 来源：ComfyUI-Manager · 切页复用缓存`}</p>
  {error && <p className="error-text" role="alert">{error}</p>}
  <div className="plugin-catalog-grid">{filtered.slice(0, limit).map(item => <article className="plugin-catalog-card" key={item.url}><h3>{item.title}</h3><small>{item.author}</small><p>{item.description}</p><code title={item.url}>{item.url.replace('https://github.com/', '')}</code><Button disabled={disabled || has(item.url)} onClick={() => install(item.url)}>{has(item.url) ? '目录已存在' : '安装插件'}</Button></article>)}</div>
  {!loading && !error && !filtered.length && <p className="footnote">没有匹配的插件。</p>}
  {filtered.length > limit && <Button onClick={() => setLimit(limit + 30)}>显示更多</Button>}
 </Section>
}
