import { useState } from 'react'
import { ViewTabs } from '../../components/ui/ViewTabs'
import { ComfyContext } from '../comfy/ComfyContext'
import { useComfy } from '../../state/WorkspaceProvider'
import { Section, EmptyState } from '../../components/ui/Section'
import { ModelList } from './ModelList'
export function DownloadsPage() {
  const comfy = useComfy(),
    [view, setView] = useState('已下载')
  return (
    <>
      <ComfyContext />
      <ViewTabs
        label="下载页面"
        value={view}
        options={['正在下载', '已下载'].map((value) => ({
          value,
          label: value,
        }))}
        onChange={setView}
      />
      <Section title={view === '已下载' ? '本地已有模型' : '正在下载'}>
        {view === '已下载' ? (
          <ModelList models={comfy.models} actions={() => null} />
        ) : (
          <EmptyState
            title="暂无下载任务"
            description="内置模型下载尚未接入。可把模型文件放入当前 models 目录，再重新读取。"
          />
        )}
      </Section>
    </>
  )
}
