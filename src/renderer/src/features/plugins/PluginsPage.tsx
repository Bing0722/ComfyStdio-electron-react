import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Section } from '../../components/ui/Section'
import { SearchInput } from '../../components/ui/SearchInput'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import {
  useComfy,
  useSessionFilter,
  useWorkspace,
} from '../../state/WorkspaceProvider'
import { pluginCatalog } from '../../state/demo-data'
import { ComfyContext } from '../comfy/ComfyContext'
export function PluginsPage() {
  const comfy = useComfy()
  const { dispatch, state } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('plugins')
  const { notify, showDialog } = useFeedback()
  const [simulateFailure, setSimulateFailure] = useState(false)
  const matches = (name: string) =>
    name.toLowerCase().includes(filter.search.trim().toLowerCase())
  const installed = Object.values(comfy.plugins).filter((plugin) =>
    matches(plugin.name),
  )
  const available = pluginCatalog.filter(
    (plugin) => !comfy.plugins[plugin.name] && matches(plugin.name),
  )
  const operate = (
    type: 'plugin/install' | 'plugin/update' | 'plugin/toggle',
    name: string,
  ) => {
    if (simulateFailure) {
      setSimulateFailure(false)
      notify('插件操作失败（演示），请重试')
      return
    }
    dispatch({ type, name })
    notify('当前 ComfyUI 插件状态已更新（演示）')
  }
  return (
    <>
      <ComfyContext />
      <div className="toolbar">
        <SearchInput
          label="搜索当前 ComfyUI 插件…"
          value={filter.search}
          onChange={(search) => setFilter({ search })}
        />
      </div>
      <Section title="当前插件" count={installed.length}>
        {!installed.length ? (
          <EmptyState
            title={
              Object.keys(comfy.plugins).length
                ? '没有匹配的插件'
                : '当前 ComfyUI 没有插件'
            }
            description={
              Object.keys(comfy.plugins).length
                ? '试试其他名称。'
                : `读取位置：${comfy.pluginsPath}`
            }
          />
        ) : (
          <div className="item-list">
            {installed.map((plugin) => (
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
                    {plugin.updateAvailable && (
                      <span className="inline-note">可更新</span>
                    )}
                  </div>
                  {!plugin.enabled && (
                    <p className="disabled-description">
                      此插件已禁用，不参与节点加载。
                    </p>
                  )}
                  <div className="row-description">
                    版本 {plugin.version} ·{' '}
                    {plugin.enabled
                      ? comfy.source === 'local'
                        ? '未标记禁用'
                        : '已启用'
                      : '已禁用'}
                  </div>
                </div>
                <div className="row-actions">
                  <Button
                    className="button-quiet"
                    onClick={() =>
                      showDialog({
                        title: plugin.name,
                        text: `所属 ComfyUI：${comfy.path}\n位置：${plugin.path}\n版本：${plugin.version}\n${comfy.source === 'local' ? '扫描只读取文件，不执行节点代码；实际加载结果以 ComfyUI 启动日志为准。' : '当前为演示环境。'}`,
                      })
                    }
                  >
                    详情
                  </Button>
                  {comfy.source === 'demo' && (
                    <>
                      {plugin.updateAvailable && (
                        <Button
                          disabled={Boolean(state.versionTask)}
                          onClick={() => operate('plugin/update', plugin.name)}
                        >
                          更新
                        </Button>
                      )}
                      <Button
                        disabled={Boolean(state.versionTask)}
                        onClick={() => operate('plugin/toggle', plugin.name)}
                      >
                        {plugin.enabled ? '禁用' : '启用'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      {comfy.source === 'demo' ? (
        <>
          <Section title="可用插件（演示）">
            {available.length ? (
              <div className="item-list">
                {available.map((plugin) => (
                  <div className="list-row" key={plugin.name}>
                    <div className="row-content">
                      <div className="row-title">{plugin.name}</div>
                      <p className="row-description">{plugin.description}</p>
                    </div>
                    <Button
                      disabled={Boolean(state.versionTask)}
                      onClick={() => operate('plugin/install', plugin.name)}
                    >
                      安装
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-hint">没有其他匹配插件。</p>
            )}
          </Section>
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
      ) : (
        <p className="footnote">
          列表来自当前 custom_nodes 目录。插件真实安装、更新与启停尚未接入。
        </p>
      )}
    </>
  )
}
