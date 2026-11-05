import { Button } from '../../components/ui/Button'
import {
  useComfy,
  useSessionFilter,
  useWorkspace,
} from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { EmptyState, Section } from '../../components/ui/Section'
import { ModelFilters, ModelList, filterModels } from './ModelList'
import { ComfyContext } from '../comfy/ComfyContext'
export function ModelsPage() {
  const comfy = useComfy()
  const { dispatch } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('models')
  const { showDialog, notify } = useFeedback()
  const models = filterModels(comfy.models, filter)
  return (
    <>
      <ComfyContext />
      <ModelFilters filter={filter} onChange={setFilter} />
      <Section
        title={comfy.source === 'local' ? '读取到的模型' : '当前模型（演示）'}
        count={models.length}
      >
        {!comfy.models.length ? (
          <EmptyState
            title="当前 ComfyUI 没有模型"
            description={`读取位置：${comfy.modelsPath}`}
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
                      text: `所属 ComfyUI：${comfy.path}\n类型：${model.type}\n大小：${model.size.toFixed(3)} GB\n来源：${model.source}\n路径：${model.path ?? '未提供'}`,
                    })
                  }
                >
                  详情
                </Button>
                {comfy.source === 'demo' && (
                  <Button
                    className="button-quiet"
                    onClick={() =>
                      showDialog({
                        title: `移除 ${model.name}？`,
                        text: `仅移除当前演示环境中的模型。\n所属目录：${comfy.path}`,
                        confirmLabel: '移除模型',
                        danger: true,
                        action: () => {
                          dispatch({ type: 'model/remove', id: model.id })
                          notify('已移除演示模型')
                        },
                      })
                    }
                  >
                    移除
                  </Button>
                )}
              </>
            )}
          />
        )}
      </Section>
      {comfy.source === 'local' && (
        <p className="footnote">
          模型库以目录扫描结果为准。添加文件后点击“重新读取”更新列表。
        </p>
      )}
    </>
  )
}
