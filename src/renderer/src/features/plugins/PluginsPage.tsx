import { Button } from '../../components/ui/Button'
import { EmptyState, Section } from '../../components/ui/Section'
import { SearchInput } from '../../components/ui/SearchInput'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { useComfy, useSessionFilter } from '../../state/WorkspaceProvider'
import { ComfyContext } from '../comfy/ComfyContext'
export function PluginsPage() {
  const comfy = useComfy(),
    { filter, setFilter } = useSessionFilter('plugins'),
    { showDialog } = useFeedback()
  const plugins = Object.values(comfy.plugins).filter((plugin) =>
    plugin.name.toLowerCase().includes(filter.search.trim().toLowerCase()),
  )
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
        插件来自当前 custom_nodes 目录。内置安装、更新和启停尚未接入。
      </p>
    </>
  )
}
