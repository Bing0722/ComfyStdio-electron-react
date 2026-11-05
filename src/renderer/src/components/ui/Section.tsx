import { Surface } from './Surface'
import type { ReactNode } from 'react'
export function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  count?: number
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Surface className="section">
      <div className="section-heading">
        <h2>
          {title}
          {count !== undefined && <span className="count">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </Surface>
  )
}
export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status ${value === '失败' ? 'status-error' : ''}`}>
      <span
        className={`status-dot ${value === '运行中' || value === '下载中' ? 'status-active' : ''}`}
      />
      {value}
    </span>
  )
}
