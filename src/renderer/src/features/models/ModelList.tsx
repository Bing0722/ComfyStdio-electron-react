import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Filter, Model } from '../../state/types'
import { modelTypes } from '../../state/initial-state'
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
  hideType = false,
}: {
  filter: Filter
  hideType?: boolean
  onChange: (update: Partial<Filter>) => void
}) {
  return (
    <div className="toolbar">
      <SearchInput
        label="搜索模型…"
        value={filter.search}
        onChange={(search) => onChange({ search })}
      />
      {!hideType && (
        <Select
          label="模型类型"
          value={filter.type}
          options={modelTypes}
          onChange={(type) => onChange({ type })}
        />
      )}
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
  const reduce = useReducedMotion()
  if (!models.length)
    return (
      <EmptyState
        title="没有匹配的模型"
        description="试试其他名称，或调整类型筛选。"
      />
    )
  return (
    <div className="item-list">
      <AnimatePresence initial={false}>
        {models.map((model) => (
          <motion.div
            layout="position"
            className="list-row model-row"
            key={model.id}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              height: 0,
              paddingTop: 0,
              paddingBottom: 0,
              marginTop: 0,
            }}
            transition={reduce ? { duration: 0 } : undefined}
          >
            <div className="row-content">
              <div className="row-title">{model.name}</div>
              <div className="row-description">
                {model.type} · {model.source}
              </div>
            </div>
            <span className="row-size">
              {model.size >= 0.01
                ? `${model.size.toFixed(2)} GB`
                : `${(model.size * 1024).toFixed(2)} MB`}
            </span>
            <div className="row-actions">{actions(model)}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
