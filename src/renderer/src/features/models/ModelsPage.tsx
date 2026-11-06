import { ViewTabs } from '../../components/ui/ViewTabs'
import { modelTypes } from '../../state/initial-state'
import { Button } from '../../components/ui/Button'
import { useComfy, useSessionFilter } from '../../state/WorkspaceProvider'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { Section } from '../../components/ui/Section'
import { ModelFilters, ModelList, filterModels } from './ModelList'
import { ComfyContext } from '../comfy/ComfyContext'
export function ModelsPage() {
  const comfy = useComfy(),
    { filter, setFilter } = useSessionFilter('models'),
    { showDialog } = useFeedback()
  const models = filterModels(comfy.models, filter)
  return (
    <>
      <ComfyContext />
      <ViewTabs
        label="模型分类"
        value={filter.type}
        options={[
          ...new Set([
            ...modelTypes,
            ...comfy.models.map((model) => model.type),
          ]),
        ].map((type) => ({
          value: type,
          label: `${type} · ${comfy.models.filter((model) => type === '全部类型' || model.type === type).length}`,
        }))}
        onChange={(type) => setFilter({ type, search: '' })}
      />
      <ModelFilters filter={filter} onChange={setFilter} hideType />
      <Section title="本地模型" count={models.length}>
        <ModelList
          models={models}
          actions={(model) => (
            <Button
              className="button-quiet"
              onClick={() =>
                showDialog({
                  title: model.name,
                  text: `类型：${model.type}\n路径：${model.path}`,
                })
              }
            >
              详情
            </Button>
          )}
        />
      </Section>
      <p className="footnote">添加模型文件后，点击“重新读取”更新列表。</p>
    </>
  )
}
