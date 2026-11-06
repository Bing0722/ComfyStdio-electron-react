import { useState } from 'react'
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
  const [repository, setRepository] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function operate(action: 'install' | 'dependencies' | 'toggle', value: string) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await window.comfy!.managePlugin(action, value, settings.pluginProxy)
      await readComfy('refresh')
      notify(action === 'install' ? '插件已下载，请安装依赖后启动 ComfyUI。' : '插件操作完成，下次启动生效。')
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }
  const plugins = Object.values(comfy.plugins).filter((plugin) =>
    plugin.name.toLowerCase().includes(filter.search.trim().toLowerCase()),
  )
  return (
    <>
      <ComfyContext />
      <Section title="安装插件">
        <input aria-label="插件仓库地址" value={repository}
          placeholder="https://github.com/作者/插件.git"
          onChange={(event) => setRepository(event.target.value)} />
        <Button disabled={busy || !!readBlockedReason || !repository.trim()}
          onClick={() => void operate('install', repository.trim())}>安装插件</Button>
        <p className="footnote">安装后点击插件的“安装依赖”，然后到启动页启动或重启 ComfyUI。依赖安装会执行插件提供的安装代码，请仅安装信任的插件。</p>
        {busy && <p role="status">正在处理插件，详细输出可在运行日志查看…</p>}
        {error && <pre className="log-output" role="alert">{error}</pre>}
      </Section>
      <div className="toolbar">
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
                className={`list-row wrap-row ${plugin.enabled ? '' : 'plugin-disabled'}`}
                key={plugin.path}
              >
                <div className="row-content">
                  <div className="row-title">
                    {plugin.name}
                    {!plugin.enabled && (
                      <span className="disabled-badge">已禁用</span>
                    )}
                  </div>
                  {!plugin.enabled && (
                    <p className="disabled-description">
                      此插件已禁用，不参与节点加载。
                    </p>
                  )}
                  <div className="row-description">
                    版本 {plugin.version} ·{' '}
                    {plugin.enabled ? '未标记禁用' : '已禁用'}
                  </div>
                </div>
                <Button disabled={busy || !!readBlockedReason}
                  onClick={() => void operate('dependencies', plugin.name)}>安装依赖</Button>
                <Button disabled={busy || !!readBlockedReason}
                  onClick={() => void operate('toggle', plugin.name)}>
                  {plugin.enabled ? '禁用' : '启用'}
                </Button>
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
      <p className="footnote">
        插件属于当前 ComfyUI。修改插件前请停止 ComfyUI，修改完成后重新启动生效。
      </p>
    </>
  )
}
