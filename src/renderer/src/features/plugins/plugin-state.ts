import { useSyncExternalStore } from 'react'
let state = { view: '已安装', updates: {} as Record<string, string>, repository: '', busy: false, error: '', installing: '', installProgress: '' }
const listeners = new Set<() => void>()
export function pluginState() { return state }
export function setPluginState<K extends keyof typeof state>(key: K, value: (typeof state)[K] | ((previous: (typeof state)[K]) => (typeof state)[K])) {
 state = { ...state, [key]: typeof value === 'function' ? value(state[key]) : value }
 listeners.forEach(listener => listener())
}
export function usePluginState<K extends keyof typeof state>(key: K): [(typeof state)[K], (value: (typeof state)[K] | ((previous: (typeof state)[K]) => (typeof state)[K])) => void] {
 const snapshot = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, pluginState)
 return [snapshot[key], value => setPluginState(key, value)]
}
