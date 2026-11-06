import type { RuntimeSnapshot } from '../../../shared/runtime-api'
import { usePreferences } from '../features/settings/PreferencesProvider'
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { createDemoInstallation, createWorkspace } from './demo-data'
import { contextLockReason, workspaceReducer } from './workspace-reducer'
import type { Filter, PageId, WorkspaceAction, WorkspaceState } from './types'
import type { ComfyReadResult } from '../../../shared/comfy-api'
interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<WorkspaceAction>
  filters: Partial<Record<PageId, Filter>>
  updateFilter: (page: PageId, update: Partial<Filter>) => void
  readComfy: (mode: 'choose' | 'refresh' | 'demo' | 'acquire') => Promise<void>
  liveRuntime: RuntimeSnapshot
  acquiring: boolean
  readBlockedReason: string
}
const Context = createContext<WorkspaceContextValue | null>(null)
const emptyFilter: Filter = { search: '', type: '全部类型' }
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { settings } = usePreferences()
  const [state, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    createWorkspace,
  )
  const [filters, setFilters] = useState<Partial<Record<PageId, Filter>>>({})
  const [liveRuntime, setLiveRuntime] = useState<RuntimeSnapshot>({
    status: '已停止',
    path: '',
    python: '',
    mode: 'API 服务',
    logs: [],
  })
  useEffect(() => {
    if (!window.runtime) return
    let active = true
    const receive = (snapshot: RuntimeSnapshot) => {
      if (active) {
        setLiveRuntime(snapshot)
        dispatch({ type: 'runtime/live', status: snapshot.status })
      }
    }
    const off = window.runtime.onChange(receive)
    void window.runtime.snapshot().then(receive)
    return () => {
      active = false
      off()
    }
  }, [])
  const [acquiring, setAcquiring] = useState(false)
  const requestId = useRef(0)
  const reading = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const readComfy = async (mode: 'choose' | 'refresh' | 'demo' | 'acquire') => {
    if (reading.current || contextLockReason(stateRef.current)) return
    const current = stateRef.current.comfy
    reading.current = true
    setAcquiring(mode === 'acquire')
    const id = ++requestId.current
    dispatch({ type: 'comfy/read-start', requestId: id })
    try {
      let result: ComfyReadResult
      if (
        mode === 'demo' ||
        (mode === 'refresh' && stateRef.current.comfy?.source === 'demo')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        result = {
          status: 'ready',
          installation:
            mode === 'refresh' && current?.source === 'demo'
              ? { ...current, readAt: new Date().toISOString() }
              : createDemoInstallation(),
        }
      } else if (!window.comfy)
        result = {
          status: 'failed',
          error: '目录读取需要在桌面应用中打开。也可以先读取演示环境。',
        }
      else
        result = await (mode === 'acquire'
          ? window.comfy.acquire(settings.programProxy)
          : mode === 'choose'
            ? window.comfy.chooseAndRead()
            : window.comfy.readCurrent())
      if (result.status === 'ready') {
        dispatch({
          type: 'comfy/read-success',
          requestId: id,
          installation: result.installation,
        })
        setFilters({})
      } else if (result.status === 'failed')
        dispatch({
          type: 'comfy/read-failure',
          requestId: id,
          error: result.error,
        })
      else dispatch({ type: 'comfy/read-cancel', requestId: id })
    } catch {
      dispatch({
        type: 'comfy/read-failure',
        requestId: id,
        error: '读取 ComfyUI 失败，请重试。',
      })
    } finally {
      reading.current = false
      setAcquiring(false)
    }
  }
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(timer)
  }, [])
  const updateFilter = (page: PageId, update: Partial<Filter>) =>
    setFilters((current) => ({
      ...current,
      [page]: { ...(current[page] ?? emptyFilter), ...update },
    }))
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        filters,
        updateFilter,
        readComfy,
        acquiring,
        liveRuntime,
        readBlockedReason: contextLockReason(state),
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useWorkspace() {
  const value = useContext(Context)
  if (!value) throw new Error('WorkspaceProvider is missing')
  return value
}
export function useComfy() {
  const { state } = useWorkspace()
  if (!state.comfy || state.read.phase !== 'ready')
    throw new Error('ComfyGate must be ready')
  return state.comfy
}
export function useSessionFilter(page: PageId) {
  const { filters, updateFilter } = useWorkspace()
  return {
    filter: filters[page] ?? emptyFilter,
    setFilter: (update: Partial<Filter>) => updateFilter(page, update),
  }
}
