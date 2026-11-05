import type { ReactNode } from 'react'
import type { Filter, Model } from '../../state/types'
import { modelTypes } from '../../state/demo-data'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/Section'

export function filterModels(models: Model[], filter: Filter) {
  return models.filter(
    (model) =>
      `${model.name} ${model.source}`
        .toLowerCase()
        .includes(filter.search.trim().toLowerCase()) &&
      (filter.type === '全部类型' || filter.type === model.type),
  )
}
export function ModelFilters({
  filter,
  onChange,
}: {
  filter: Filter
  onChange: (update: Partial<Filter>) => void
}) {
  return (
    <div className="toolbar">
      <SearchInput
        label="搜索模型…"
        value={filter.search}
        onChange={(search) => onChange({ search })}
      />
      <Select
        label="模型类型"
        value={filter.type}
        options={modelTypes}
        onChange={(type) => onChange({ type })}
      />
    </div>
  )
}
export function ModelList({
  models,
  actions,
}: {
  models: Model[]
  actions: (model: Model) => ReactNode
}) {
  if (!models.length)
    return (
      <EmptyState
        title="没有匹配的模型"
        description="试试其他名称，或调整类型筛选。"
      />
    )
  return (
    <div className="item-list">
      {models.map((model) => (
        <div className="list-row model-row" key={model.id}>
          <div className="row-content">
            <div className="row-title">{model.name}</div>
            <div className="row-description">
              {model.type} · {model.source}
            </div>
          </div>
          <span className="row-size">{model.size} GB</span>
          <div className="row-actions">{actions(model)}</div>
        </div>
      ))}
    </div>
  )
}
