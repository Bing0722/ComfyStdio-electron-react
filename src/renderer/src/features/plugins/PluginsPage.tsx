import { pluginResult } from './plugin-result'
import { usePluginState, pluginState } from './plugin-state'
import type { CatalogPlugin } from '../../../../shared/comfy-api'
import { ViewTabs } from '../../components/ui/ViewTabs'
import { PluginCatalog } from './PluginCatalog'
import './plugins.css'
import { useEffect, useState } from 'react'
import { usePreferences } from '../settings/PreferencesProvider'
import { Button } from '../../components/ui/Button'
import { EmptyState, Section } from '../../components/ui/Section'
import { SearchInput } from '../../components/ui/SearchInput'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { useComfy, useSessionFilter, useWorkspace } from '../../state/WorkspaceProvider'
import { ComfyContext } from '../comfy/ComfyContext'
export function PluginsPage() {
  const comfy = useComfy(),
    { filter, setFilter } = useSessionFilter('plugins'),
    { showDialog, notify } = useFeedback()
  const { readComfy, readBlockedReason, dispatch } = useWorkspace()
  const { settings } = usePreferences()
  const [catalog, setCatalog] = useState<CatalogPlugin[]>([])
  useEffect(() => {
    let active = true
    window.comfy?.pluginCatalog(false, settings.pluginProxy).then(items => { if (active) setCatalog(items) }).catch(() => {})
    return () => { active = false }
  }, [comfy.path, comfy.readAt])
  const description = (name: string, fallback: string) => {
    const item = catalog.find(item => item.url.split('/').at(-1)?.replace(/\.git$/, '').toLowerCase() === name.replace(/\.disabled$/, '').toLowerCase())
    return item?.description || fallback.replace(/\s+/g, ' ').slice(0, 180)
  }
  const [view, setView] = usePluginState('view')
  const [updates, setUpdates] = usePluginState('updates')
  const [repository, setRepository] = usePluginState('repository')
  const [busy, setBusy] = usePluginState('busy')
  const [, setError] = usePluginState('error')
  const [installing, setInstalling] = usePluginState('installing')
  const [installProgress, setInstallProgress] = usePluginState('installProgress')
  async function operate(action: 'install' | 'dependencies' | 'toggle' | 'delete' | 'check-update' | 'check-all' | 'update-all', value: string) {
    if (pluginState().busy) return
    setBusy(true)
    if (action === 'install') { setInstalling(value); setInstallProgress('准备下载…') }
    setError('')
    try {
      const result = await window.comfy!.managePlugin(action, value, settings.pluginProxy)
      if (action === 'check-all' || action === 'update-all') {
        const results = JSON.parse(result || '{}') as Record<string, string>
        setUpdates(results)
        if (action === 'update-all') await readComfy('refresh')
        const failures = Object.values(results).filter(value => value.startsWith('失败')).length
        notify(`${action === 'check-all' ? '全部检查' : '统一更新'}完成：${Object.keys(results).length} 项，${failures} 项失败。详见列表及运行日志。`)
        return
      }
      if (action === 'check-update') {
        const message = result || '检查完成'
        setUpdates(current => ({ ...current, [value]: message }))
        notify(message)
        return
      }
      if (action === 'install') setInstallProgress('正在刷新插件列表…')
      if (action === 'toggle') dispatch({ type: 'comfy/plugin-toggled', path: comfy.path, name: value })
      else await readComfy('refresh')
      notify(action === 'delete' ? '插件已移入回收站，可重新安装。' : action === 'install' ? '插件文件安装成功，可在已安装页统一更新并安装依赖。' : '插件操作完成，下次启动生效。')
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      notify('插件操作失败，请在运行日志中查看原因。')
    } finally {
      setBusy(false)
      setInstalling('')
    }
  }
  const plugins = Object.values(comfy.plugins).filter((plugin) =>
    plugin.name.toLowerCase().includes(filter.search.trim().toLowerCase()),
  )
  return (
    <>
      <ComfyContext />
      <ViewTabs label="插件页面" value={view} options={['已安装', '发现插件'].map(value => ({ value, label: value }))} onChange={setView} />
      <div hidden={view !== '发现插件'}>
      <Section title="安装插件">
        <div className="plugin-install-row"><input aria-label="插件仓库地址" value={repository}
          placeholder="https://github.com/作者/插件.git"
          onChange={(event) => setRepository(event.target.value)} />
        <Button disabled={busy || !!readBlockedReason || !repository.trim()}
          onClick={() => void operate('install', repository.trim())}>安装插件</Button></div>
        <p className="footnote">安装后可在已安装页统一更新并安装依赖，然后启动或重启 ComfyUI。依赖安装会执行插件提供的安装代码，请仅安装信任的插件。</p>
        <p role="status" style={{ visibility: busy ? 'visible' : 'hidden' }}>正在处理插件，详细输出可在运行日志查看…</p>
      </Section>
      <PluginCatalog installing={installing} installProgress={installProgress} proxy={settings.pluginProxy} installed={Object.keys(comfy.plugins)} disabled={busy || !!readBlockedReason} install={url => void operate('install', url)} />
      </div>
      <div hidden={view !== '已安装'}>
      <Section title="已安装插件" count={plugins.length} action={
        <div className="plugin-batch-actions"><Button disabled={busy || !!readBlockedReason || !Object.keys(comfy.plugins).length} onClick={() => void operate('check-all', '')}>检查全部更新</Button><Button className="button-primary" disabled={busy || !!readBlockedReason || !Object.keys(comfy.plugins).length} onClick={() => void operate('update-all', '')}>更新并安装依赖</Button></div>
      }>
        <div className="plugin-installed-toolbar"><SearchInput label="搜索已安装插件…" value={filter.search} onChange={search => setFilter({ search })} /><span role="status">{busy ? '正在处理，请查看运行日志…' : '统一管理插件与依赖'}</span></div>
        {!plugins.length ? (
          <EmptyState
            title="没有匹配的插件"
            description={`读取位置：${comfy.pluginsPath}`}
          />
        ) : (
          <div className="plugin-catalog-grid">
            {plugins.map((plugin) => (
              <div
                className="plugin-catalog-card plugin-installed-card"
                key={plugin.path.replace(/\.disabled$/, '')}
              >
                <div className="row-content">
                  <div className="row-title">
                    {plugin.name.replace(/\.disabled$/, '')}
                    <span className="disabled-badge" style={{ visibility: plugin.enabled ? 'hidden' : 'visible' }}>已禁用</span>
                  </div>
                  <p className="installed-plugin-summary">{description(plugin.name, plugin.description)}</p>
                  <div className="row-description">
                    版本 {plugin.version}
                    <span className="plugin-operation-result">{pluginResult(updates[plugin.name] || '')}</span>
                  </div>
                </div>
                <div className="plugin-card-actions"><Button disabled={busy || !!readBlockedReason}
                  onClick={() => void operate('toggle', plugin.name)}>
                  {plugin.enabled ? '禁用' : '启用'}
                </Button>
                <Button className="button-danger" disabled={busy || !!readBlockedReason} onClick={() => showDialog({ title: `删除 ${plugin.name}？`, text: '将插件文件移入回收站。之后可从插件目录重新安装；插件内的配置也会一并移走。', confirmLabel: '删除插件', danger: true, action: () => void operate('delete', plugin.name) })}>删除</Button>
                <Button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: plugin.name,
                      text: `${description(plugin.name, plugin.description)}\n\n${plugin.description}\n\n位置：${plugin.path}\n版本：${plugin.version}\n实际节点加载结果以运行日志为准。`,
                    })
                  }
                >
                  详情
                </Button></div>
              </div>
            ))}
          </div>
        )}
      </Section>
      </div>
      <p className="footnote">
        插件属于当前 ComfyUI。修改插件前请停止 ComfyUI，修改完成后重新启动生效。
      </p>
    </>
  )
}
