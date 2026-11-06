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
import { createWorkspace } from './initial-state'
import { contextLockReason, workspaceReducer } from './workspace-reducer'
import type { Filter, PageId, WorkspaceAction, WorkspaceState } from './types'
import type { AcquisitionKind, ComfyReadResult } from '../../../shared/comfy-api'
type ReadMode = 'choose' | 'refresh' | AcquisitionKind
type RuntimeAction = 'start' | 'restart' | 'stop' | 'choosePython'
interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<WorkspaceAction>
  filters: Partial<Record<PageId, Filter>>
  updateFilter: (page: PageId, update: Partial<Filter>) => void
  readComfy: (mode: ReadMode) => Promise<void>
  operateRuntime: (action: RuntimeAction) => Promise<void>
  launchPending: boolean
  liveRuntime: RuntimeSnapshot
  acquiring: AcquisitionKind | null
  readBlockedReason: string
}
const Context = createContext<WorkspaceContextValue | null>(null)
const emptyFilter: Filter = { search: '', type: '全部类型' }
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { settings, runMode, portableCpu } = usePreferences()
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
  const [acquiring, setAcquiring] = useState<AcquisitionKind | null>(null)
  const [launchPending, setLaunchPending] = useState(false)
  const operating = useRef(false)
  const requestId = useRef(0)
  const reading = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const operateRuntime = async (action: RuntimeAction) => {
    if (operating.current || reading.current) return
    const path = stateRef.current.comfy?.path
    if (!window.runtime || !path) throw new Error('请先读取本地 ComfyUI')
    operating.current = true
    setLaunchPending(true)
    try {
      if (action === 'choosePython') {
        const python = await window.runtime.choosePython()
        if (python) dispatch({ type: 'comfy/python-selected', path, python })
      } else if (action === 'stop') await window.runtime.stop()
      else await window.runtime[action](runMode, portableCpu)
    } finally {
      operating.current = false
      setLaunchPending(false)
    }
  }
  const readComfy = async (mode: ReadMode) => {
    if (operating.current || reading.current || contextLockReason(stateRef.current)) return
    reading.current = true
    const acquisition = mode !== 'choose' && mode !== 'refresh' ? mode : null
    setAcquiring(acquisition)
    const id = ++requestId.current
    dispatch({ type: 'comfy/read-start', requestId: id })
    try {
      let result: ComfyReadResult
      if (!window.comfy)
        result = { status: 'failed', error: '请在桌面应用中读取 ComfyUI。' }
      else
        result = await (acquisition
          ? window.comfy.acquire(acquisition, settings.programProxy)
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
          preserve: mode !== 'refresh',
        })
      else dispatch({ type: 'comfy/read-cancel', requestId: id })
    } catch {
      dispatch({
        type: 'comfy/read-failure',
        requestId: id,
        error: '读取 ComfyUI 失败，请重试。',
        preserve: mode !== 'refresh',
      })
    } finally {
      reading.current = false
      setAcquiring(null)
    }
  }
  useEffect(() => {
    void readComfy('refresh')
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
        operateRuntime,
        launchPending,
        readBlockedReason: contextLockReason(state) || (launchPending ? '正在处理启动操作。' : ''),
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
