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
  const { readComfy, readBlockedReason } = useWorkspace()
  const { settings } = usePreferences()
  const [view, setView] = useState('已安装')
  const [updates, setUpdates] = useState<Record<string, string>>({})
  const [repository, setRepository] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [installing, setInstalling] = useState('')
  const [installProgress, setInstallProgress] = useState('')
  useEffect(() => window.comfy?.onPluginProgress(value => {
    if (value.url === installing) setInstallProgress(value.message.trim().split(/[\r\n]/).filter(Boolean).at(-1) || '正在下载…')
  }), [installing])
  async function operate(action: 'install' | 'dependencies' | 'toggle' | 'delete' | 'check-update', value: string) {
    if (busy) return
    setBusy(true)
    if (action === 'install') { setInstalling(value); setInstallProgress('准备下载…') }
    setError('')
    try {
      const result = await window.comfy!.managePlugin(action, value, settings.pluginProxy)
      if (action === 'check-update') {
        const message = result || '检查完成'
        setUpdates(current => ({ ...current, [value]: message }))
        notify(message)
        return
      }
      if (action === 'install') setInstallProgress('正在刷新插件列表…')
      await readComfy('refresh')
      notify(action === 'delete' ? '插件已移入回收站，可重新安装。' : action === 'install' ? '插件文件安装成功，请按需安装依赖后启动 ComfyUI。' : '插件操作完成，下次启动生效。')
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      notify(`插件操作失败：${error instanceof Error ? error.message : String(error)}`)
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
      {error && <p role="alert" className="error-text">{error}</p>}
      <div hidden={view !== '发现插件'}>
      <Section title="安装插件">
        <div className="plugin-install-row"><input aria-label="插件仓库地址" value={repository}
          placeholder="https://github.com/作者/插件.git"
          onChange={(event) => setRepository(event.target.value)} />
        <Button disabled={busy || !!readBlockedReason || !repository.trim()}
          onClick={() => void operate('install', repository.trim())}>安装插件</Button></div>
        <p className="footnote">安装后点击插件的“安装依赖”，然后到启动页启动或重启 ComfyUI。依赖安装会执行插件提供的安装代码，请仅安装信任的插件。</p>
        <p role="status" style={{ visibility: busy ? 'visible' : 'hidden' }}>正在处理插件，详细输出可在运行日志查看…</p>
        {error && <pre className="log-output" role="alert">{error}</pre>}
      </Section>
      <PluginCatalog installing={installing} installProgress={installProgress} proxy={settings.pluginProxy} installed={Object.keys(comfy.plugins)} disabled={busy || !!readBlockedReason} install={url => void operate('install', url)} />
      </div>
      <div hidden={view !== '已安装'}>
      <div className="toolbar plugin-local-search">
        <SearchInput
          label="搜索当前 ComfyUI 插件…"
          value={filter.search}
          onChange={(search) => setFilter({ search })}
        />
      </div>
      <Section title="当前插件" count={plugins.length}>
        {!plugins.length ? (
          <EmptyState
            title="没有匹配的插件"
            description={`读取位置：${comfy.pluginsPath}`}
          />
        ) : (
          <div className="item-list">
            {plugins.map((plugin) => (
              <div
                className="list-row wrap-row"
                key={plugin.path}
              >
                <div className="row-content">
                  <div className="row-title">
                    {plugin.name}
                    {!plugin.enabled && (
                      <span className="disabled-badge">已禁用</span>
                    )}
                  </div>
                  <div className="row-description">
                    版本 {plugin.version}
                    {updates[plugin.name] && <span> · {updates[plugin.name]}</span>}
                  </div>
                </div>
                <Button disabled={busy || !!readBlockedReason} onClick={() => void operate('check-update', plugin.name)}>检查更新</Button>
                <Button disabled={busy || !!readBlockedReason}
                  onClick={() => void operate('dependencies', plugin.name)}>安装依赖</Button>
                <Button disabled={busy || !!readBlockedReason}
                  onClick={() => void operate('toggle', plugin.name)}>
                  {plugin.enabled ? '禁用' : '启用'}
                </Button>
                <Button className="button-danger" disabled={busy || !!readBlockedReason} onClick={() => showDialog({ title: `删除 ${plugin.name}？`, text: '将插件文件移入回收站。之后可从插件目录重新安装；插件内的配置也会一并移走。', confirmLabel: '删除插件', danger: true, action: () => void operate('delete', plugin.name) })}>删除</Button>
                <Button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: plugin.name,
                      text: `位置：${plugin.path}\n版本：${plugin.version}\n实际节点加载结果以运行日志为准。`,
                    })
                  }
                >
                  详情
                </Button>
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
