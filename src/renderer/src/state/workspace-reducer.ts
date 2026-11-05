import type { InstanceStatus, WorkspaceAction, WorkspaceState } from './types'

const logs: Record<InstanceStatus, string> = {
  已停止: '服务已停止',
  启动中: '正在准备运行环境…',
  运行中: '服务已就绪 · 127.0.0.1:8188',
  失败: '启动失败：示例端口被占用，请重试',
}
export function versionInUse(state: WorkspaceState, version: string) {
  return (
    state.defaultVersion === version ||
    state.instances.some((instance) => instance.version === version)
  )
}

/** Pure demo transitions. No filesystem, process or network operations. */
export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'tick': {
      if (
        !state.downloads.some((task) =>
          ['排队', '下载中'].includes(task.phase),
        ) &&
        !state.instances.some((instance) => instance.status === '启动中')
      )
        return state
      const downloads = state.downloads.map((task) => {
        if (task.phase === '排队') return { ...task, phase: '下载中' as const }
        if (task.phase !== '下载中') return task
        const progress = Math.min(100, task.progress + 5)
        return {
          ...task,
          progress,
          phase: progress === 100 ? ('完成' as const) : ('下载中' as const),
        }
      })
      const completed = downloads.filter(
        (task) =>
          task.phase === '完成' &&
          !state.models.some((model) => model.id === task.id),
      )
      return {
        ...state,
        downloads,
        models: [
          ...state.models,
          ...completed.map(({ progress, phase, ...model }) => model),
        ],
        instances: state.instances.map((instance) =>
          instance.status === '启动中'
            ? {
                ...instance,
                status: '运行中',
                logs: [...instance.logs, `[演示] ${logs.运行中}`].slice(-30),
              }
            : instance,
        ),
      }
    }
    case 'instance/select':
      return state.instances.some((instance) => instance.id === action.id)
        ? { ...state, instanceId: action.id }
        : state
    case 'instance/status':
      return {
        ...state,
        instances: state.instances.map((instance) =>
          instance.id === action.id
            ? {
                ...instance,
                status: action.status,
                logs: [...instance.logs, `[演示] ${logs[action.status]}`].slice(
                  -30,
                ),
              }
            : instance,
        ),
      }
    case 'download/add':
      return state.downloads.some((task) => task.id === action.model.id)
        ? state
        : {
            ...state,
            downloads: [
              ...state.downloads,
              { ...action.model, phase: '排队', progress: 0 },
            ],
          }
    case 'download/status':
      return {
        ...state,
        downloads: state.downloads.map((task) =>
          task.id === action.id && task.phase !== '完成'
            ? { ...task, phase: action.phase }
            : task,
        ),
      }
    case 'download/remove':
      return {
        ...state,
        downloads: state.downloads.filter((task) => task.id !== action.id),
      }
    case 'model/remove':
      return {
        ...state,
        models: state.models.filter((model) => model.id !== action.id),
        downloads: state.downloads.filter((task) => task.id !== action.id),
      }
    case 'version/install':
      return state.versions.includes(action.version)
        ? state
        : { ...state, versions: [...state.versions, action.version] }
    case 'version/default':
      return state.versions.includes(action.version)
        ? { ...state, defaultVersion: action.version }
        : state
    case 'version/switch':
      if (!state.versions.includes(action.version)) return state
      return {
        ...state,
        instances: state.instances.map((instance) =>
          instance.id === action.id &&
          !['启动中', '运行中'].includes(instance.status)
            ? { ...instance, version: action.version }
            : instance,
        ),
      }
    case 'version/remove':
      return versionInUse(state, action.version)
        ? state
        : {
            ...state,
            versions: state.versions.filter(
              (version) => version !== action.version,
            ),
          }
    case 'plugin/install':
    case 'plugin/toggle':
    case 'plugin/update': {
      const plugins = state.plugins[action.instanceId]
      if (!plugins) return state
      const previous = plugins[action.name]
      if (action.type !== 'plugin/install' && !previous) return state
      const plugin =
        action.type === 'plugin/toggle'
          ? { ...previous, enabled: !previous.enabled }
          : action.type === 'plugin/update'
            ? { ...previous, version: '1.1', updateAvailable: false }
            : (previous ?? {
                version: '1.1',
                enabled: true,
                updateAvailable: false,
              })
      return {
        ...state,
        plugins: {
          ...state.plugins,
          [action.instanceId]: { ...plugins, [action.name]: plugin },
        },
      }
    }
  }
}
