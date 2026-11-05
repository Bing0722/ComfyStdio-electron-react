import { Button } from '../../components/ui/Button'
import { useSessionFilter, useWorkspace } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { EmptyState, Section } from '../../components/ui/Section'
import { ModelFilters, ModelList, filterModels } from './ModelList'
export function ModelsPage() {
  const { state, dispatch } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('models')
  const { showDialog, notify } = useFeedback()
  const models = filterModels(state.models, filter)
  return (
    <>
      <ModelFilters filter={filter} onChange={setFilter} />
      <Section title="本地模型" count={models.length}>
        {!state.models.length ? (
          <EmptyState
            title="还没有模型"
            description="在模型下载页面添加模型，完成后会显示在这里。"
          />
        ) : (
          <ModelList
            models={models}
            actions={(model) => (
              <>
                <Button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: model.name,
                      text: `类型：${model.type}\n大小：${model.size} GB\n来源：${model.source}\n示例路径：/demo/ComfyUI/models/${model.type.toLowerCase()}/${model.name}.safetensors`,
                    })
                  }
                >
                  详情
                </Button>
                <Button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: `移除 ${model.name}？`,
                      text: '从演示模型库移除，不会删除真实文件。',
                      confirmLabel: '移除模型',
                      danger: true,
                      action: () => {
                        dispatch({ type: 'model/remove', id: model.id })
                        notify('已移除模型（演示）')
                      },
                    })
                  }
                >
                  移除
                </Button>
              </>
            )}
          />
        )}
      </Section>
    </>
  )
}
