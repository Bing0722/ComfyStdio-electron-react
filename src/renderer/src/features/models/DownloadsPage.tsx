import { useState } from 'react'
import { ViewTabs } from '../../components/ui/ViewTabs'
import { ComfyContext } from '../comfy/ComfyContext'
import { useComfy } from '../../state/WorkspaceProvider'
import { Button } from '../../components/ui/Button'
import { useSessionFilter, useWorkspace } from '../../state/WorkspaceProvider'
import { modelCatalog } from '../../state/demo-data'
import { Section } from '../../components/ui/Section'
import { ModelFilters, ModelList, filterModels } from './ModelList'
import { DownloadQueue } from './DownloadQueue'
export function DownloadsPage() {
  const comfy = useComfy()
  const [view, setView] = useState('浏览模型')
  const { state, dispatch } = useWorkspace()
  const { filter, setFilter } = useSessionFilter('downloads')
  return (
    <>
      <ComfyContext />
      <p className="footnote">
        下载目标：{comfy.modelsPath} · 当前下载为演示，不写入真实文件。
      </p>
      <ViewTabs
        label="下载页面"
        value={view}
        options={['浏览模型', '正在下载', '已下载'].map((value) => ({
          value,
          label:
            value === '正在下载'
              ? `${value} · ${state.downloads.filter((task) => task.phase !== '完成').length}`
              : value === '已下载'
                ? `${value} · ${state.downloads.filter((task) => task.phase === '完成').length}`
                : value,
        }))}
        onChange={setView}
      />
      {view === '浏览模型' && (
        <>
          <ModelFilters filter={filter} onChange={setFilter} />
          <Section
            title="模型目录（演示）"
            count={filterModels(modelCatalog, filter).length}
          >
            <ModelList
              models={filterModels(modelCatalog, filter)}
              actions={(model) => (
                <Button
                  disabled={
                    Boolean(state.versionTask) ||
                    state.downloads.some((task) => task.id === model.id)
                  }
                  onClick={() => dispatch({ type: 'download/add', model })}
                >
                  {state.downloads.some((task) => task.id === model.id)
                    ? '已加入'
                    : '演示下载'}
                </Button>
              )}
            />
          </Section>
        </>
      )}
      {view !== '浏览模型' && (
        <DownloadQueue key={view} completed={view === '已下载'} />
      )}
    </>
  )
}
