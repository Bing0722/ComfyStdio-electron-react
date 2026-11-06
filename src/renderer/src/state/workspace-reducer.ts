import type { RuntimeStatus, WorkspaceAction, WorkspaceState } from './types'
const logs: Record<RuntimeStatus, string> = {
  已停止: '服务已停止',
  停止中: '正在停止服务',
  启动中: '正在准备运行环境…',
  运行中: '服务已就绪 · 127.0.0.1:8188',
  失败: '启动失败：示例端口被占用，请重试',
}
export function contextLockReason(state: WorkspaceState) {
  if (state.read.phase === 'reading') return '正在读取 ComfyUI，请稍后重试。'
  if (['启动中', '运行中', '停止中'].includes(state.runtime.status))
    return '请先停止 ComfyUI。'
  if (state.versionTask) return '请等待版本操作结束。'
  if (state.downloads.some((task) => task.phase !== '完成'))
    return '请先完成或取消下载任务。'
  return ''
}
export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  if (action.type === 'comfy/read-start') {
    if (contextLockReason(state)) return state
    return {
      ...state,
      read: { phase: 'reading', requestId: action.requestId, error: '' },
    }
  }
  if (action.type === 'comfy/read-cancel') {
    if (
      state.read.requestId !== action.requestId ||
      state.read.phase !== 'reading'
    )
      return state
    return {
      ...state,
      read: { ...state.read, phase: state.comfy ? 'ready' : 'idle' },
    }
  }
  if (
    action.type === 'comfy/read-success' ||
    action.type === 'comfy/read-failure'
  ) {
    if (
      state.read.requestId !== action.requestId ||
      state.read.phase !== 'reading'
    )
      return state
    return {
      comfy: action.type === 'comfy/read-success' ? action.installation : null,
      read: {
        phase: action.type === 'comfy/read-success' ? 'ready' : 'failed',
        requestId: action.requestId,
        error: action.type === 'comfy/read-failure' ? action.error : '',
      },
      runtime: { status: '已停止', logs: [] },
      downloads: [],
      versionTask: null,
    }
  }
  const comfy = state.comfy
  if (!comfy || state.read.phase !== 'ready') return state
  switch (action.type) {
    case 'tick': {
      if (
        !state.versionTask &&
        state.runtime.status !== '启动中' &&
        !state.downloads.some((task) => ['排队', '下载中'].includes(task.phase))
      )
        return state
      const downloads = state.downloads.map((task) => {
        if (task.comfyPath !== comfy.path) return task
        if (task.phase === '排队') return { ...task, phase: '下载中' as const }
        if (task.phase !== '下载中') return task
        const progress = Math.min(100, task.progress + 5)
        return {
          ...task,
          progress,
          phase: progress === 100 ? ('完成' as const) : ('下载中' as const),
        }
      })
      // A simulated transfer must never be represented as a real disk file.
      const completed =
        comfy.source === 'demo'
          ? downloads.filter(
              (task) =>
                task.phase === '完成' &&
                !comfy.models.some((model) => model.id === task.id),
            )
          : []
      return {
        ...state,
        downloads,
        versionTask: null,
        comfy: {
          ...comfy,
          version:
            state.versionTask && comfy.source === 'demo'
              ? state.versionTask.version
              : comfy.version,
          models: [
            ...comfy.models,
            ...completed.map(
              ({ progress, phase, comfyPath, targetPath, ...model }) => ({
                ...model,
                path: targetPath,
              }),
            ),
          ],
        },
        runtime:
          state.runtime.status === '启动中' && comfy.source === 'demo'
            ? {
                status: '运行中',
                logs: [...state.runtime.logs, `[演示] ${logs.运行中}`].slice(
                  -30,
                ),
              }
            : state.runtime,
      }
    }
    case 'runtime/live':
      if (comfy.source !== 'local') return state
      return { ...state, runtime: { ...state.runtime, status: action.status } }
    case 'runtime/status':
      if (comfy.source !== 'demo') return state
      if (state.versionTask) return state
      return {
        ...state,
        runtime: {
          status: action.status,
          logs: [...state.runtime.logs, `[演示] ${logs[action.status]}`].slice(
            -30,
          ),
        },
      }
    case 'download/add': {
      if (
        state.versionTask ||
        state.downloads.some((task) => task.id === action.model.id)
      )
        return state
      const folders: Record<string, string> = {
        Checkpoint: 'checkpoints',
        LoRA: 'loras',
        VAE: 'vae',
        ControlNet: 'controlnet',
      }
      const targetPath = `${comfy.modelsPath}/${folders[action.model.type] ?? 'other'}/${action.model.id}.safetensors`
      return {
        ...state,
        downloads: [
          ...state.downloads,
          {
            ...action.model,
            progress: 0,
            phase: '排队',
            comfyPath: comfy.path,
            targetPath,
          },
        ],
      }
    }
    case 'download/status':
      return {
        ...state,
        downloads: state.downloads.map((task) =>
          task.id === action.id &&
          task.comfyPath === comfy.path &&
          task.phase !== '完成'
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
      if (comfy.source !== 'demo') return state
      return {
        ...state,
        comfy: {
          ...comfy,
          models: comfy.models.filter((model) => model.id !== action.id),
        },
        downloads: state.downloads.filter((task) => task.id !== action.id),
      }
    case 'version/change':
      if (
        comfy.source !== 'demo' ||
        contextLockReason(state) ||
        comfy.version === action.version
      )
        return state
      return {
        ...state,
        versionTask: { version: action.version, kind: action.kind },
      }
    case 'version/fail':
      return { ...state, versionTask: null }
    case 'plugin/install':
    case 'plugin/toggle':
    case 'plugin/update': {
      if (comfy.source !== 'demo' || state.versionTask) return state
      const previous = comfy.plugins[action.name]
      if (!previous && action.type !== 'plugin/install') return state
      const plugin =
        action.type === 'plugin/toggle'
          ? { ...previous, enabled: !previous.enabled }
          : action.type === 'plugin/update'
            ? { ...previous, version: '1.1', updateAvailable: false }
            : (previous ?? {
                name: action.name,
                description: '自定义节点',
                version: '1.1',
                enabled: true,
                updateAvailable: false,
                path: `${comfy.pluginsPath}/${action.name.replaceAll(' ', '-')}`,
              })
      return {
        ...state,
        comfy: {
          ...comfy,
          plugins: { ...comfy.plugins, [action.name]: plugin },
        },
      }
    }
  }
}
