import { useState } from 'react'
import { pluginCatalog } from '../../state/demo-data'
import { useSessionFilter, useWorkspace } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { EmptyState, Section } from '../../components/ui/Section'
import { SearchInput } from '../../components/ui/SearchInput'
import { InstancePicker } from '../instances/InstancePicker'
export function PluginsPage() {
  const { state, dispatch } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('plugins')
  const { notify } = useFeedback()
  const [simulateFailure, setSimulateFailure] = useState(false)
  const plugins = state.plugins[state.instanceId]
  const matches = pluginCatalog.filter((plugin) =>
    plugin.name.toLowerCase().includes(filter.search.trim().toLowerCase()),
  )
  const operate = (
    type: 'plugin/install' | 'plugin/update' | 'plugin/toggle',
    name: string,
  ) => {
    if (simulateFailure) {
      setSimulateFailure(false)
      notify(`${name} 操作失败：模拟连接超时，请重试`)
      return
    }
    dispatch({ type, instanceId: state.instanceId, name })
    notify('插件状态已更新（演示）')
  }
  const list = (installed: boolean) => {
    const items = matches.filter(
      (plugin) => Boolean(plugins[plugin.name]) === installed,
    )
    return items.length ? (
      <div className="item-list">
        {items.map((item) => {
          const plugin = plugins[item.name]
          return (
            <div className="list-row wrap-row" key={item.name}>
              <div className="row-content">
                <div className="row-title">
                  {item.name}
                  {plugin?.updateAvailable && (
                    <span className="inline-note">可更新</span>
                  )}
                </div>
                <div className="row-description">
                  {item.description} · v{plugin?.version ?? item.version}
                  {plugin && ` · ${plugin.enabled ? '已启用' : '已禁用'}`}
                </div>
              </div>
              <div className="row-actions">
                {plugin ? (
                  <>
                    {plugin.updateAvailable && (
                      <button
                        onClick={() => operate('plugin/update', item.name)}
                      >
                        更新
                      </button>
                    )}
                    <button
                      className="button-quiet"
                      onClick={() => operate('plugin/toggle', item.name)}
                    >
                      {plugin.enabled ? '禁用' : '启用'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => operate('plugin/install', item.name)}>
                    安装
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    ) : (
      <p className="section-hint">
        {installed ? '此实例没有匹配的已安装插件。' : '没有其他可用插件。'}
      </p>
    )
  }
  return (
    <>
      <div className="toolbar">
        <SearchInput
          label="搜索插件…"
          value={filter.search}
          onChange={(search) => setFilter({ search })}
        />
        <InstancePicker />
      </div>
      {!matches.length ? (
        <EmptyState title="没有匹配的插件" description="试试其他名称。" />
      ) : (
        <>
          <Section title="已安装" count={Object.keys(plugins).length}>
            {list(true)}
          </Section>
          <Section title="可用插件">{list(false)}</Section>
        </>
      )}
      <details className="demo-tools">
        <summary>演示操作</summary>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(event) => setSimulateFailure(event.target.checked)}
          />
          模拟下一次插件操作失败
        </label>
      </details>
    </>
  )
}
