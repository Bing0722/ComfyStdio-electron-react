import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { createWorkspace } from './demo-data'
import { workspaceReducer } from './workspace-reducer'
import type { Filter, PageId, WorkspaceAction, WorkspaceState } from './types'

interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<WorkspaceAction>
  filters: Partial<Record<PageId, Filter>>
  updateFilter: (page: PageId, update: Partial<Filter>) => void
}
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
const emptyFilter: Filter = { search: '', type: '全部类型' }
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    createWorkspace,
  )
  const [filters, setFilters] = useState<Partial<Record<PageId, Filter>>>({})
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
    <WorkspaceContext.Provider
      value={{ state, dispatch, filters, updateFilter }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('WorkspaceProvider is missing')
  return context
}
export function useCurrentInstance() {
  const { state } = useWorkspace()
  return state.instances.find((instance) => instance.id === state.instanceId)!
}
export function useSessionFilter(page: PageId) {
  const { filters, updateFilter } = useWorkspace()
  return {
    filter: filters[page] ?? emptyFilter,
    setFilter: (update: Partial<Filter>) => updateFilter(page, update),
  }
}
