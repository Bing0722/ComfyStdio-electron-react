export type ProcessStatus = '已停止' | '启动中' | '运行中' | '停止中' | '失败'
export type RunMode = 'API 服务' | '打开网页'
export interface LogEntry {
  id: number
  time: string
  level: '信息' | '警告' | '异常'
  source: string
  message: string
}
export interface RuntimeSnapshot {
  status: ProcessStatus
  path: string
  python: string
  mode: RunMode
  logs: LogEntry[]
}
export interface RuntimeAPI {
  snapshot: () => Promise<RuntimeSnapshot>
  start: (mode: RunMode, portableCpu?: boolean) => Promise<void>
  restart: (mode: RunMode, portableCpu?: boolean) => Promise<void>
  stop: () => Promise<void>
  choosePython: () => Promise<string | null>
  exportLogs: () => Promise<boolean>
  onChange: (callback: (snapshot: RuntimeSnapshot) => void) => () => void
}
