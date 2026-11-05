import { Button } from '../../components/ui/Button'
import { useSessionFilter, useWorkspace } from '../../state/WorkspaceProvider'
import { modelCatalog } from '../../state/demo-data'
import { Section } from '../../components/ui/Section'
import { ModelFilters, ModelList, filterModels } from './ModelList'
import { DownloadQueue } from './DownloadQueue'
export function DownloadsPage() {
  const { state, dispatch } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('downloads')
  return (
    <>
      <ModelFilters filter={filter} onChange={setFilter} />
      <Section
        title="可用模型"
        count={filterModels(modelCatalog, filter).length}
      >
        <ModelList
          models={filterModels(modelCatalog, filter)}
          actions={(model) => (
            <Button
              disabled={state.downloads.some((task) => task.id === model.id)}
              onClick={() => dispatch({ type: 'download/add', model })}
            >
              {state.downloads.some((task) => task.id === model.id)
                ? '已加入'
                : '下载'}
            </Button>
          )}
        />
      </Section>
      <DownloadQueue />
    </>
  )
}
