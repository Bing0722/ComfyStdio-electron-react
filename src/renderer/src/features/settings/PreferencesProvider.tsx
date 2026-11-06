import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Theme } from '../../state/types'

export const themes: Theme[] = ['浅色', '深色', '跟随系统']
interface Settings {
  modelProxy: string
  pluginProxy: string
  programProxy: string
  concurrency: string
}
interface Preferences {
  theme: Theme
  setTheme: (theme: Theme) => void
  liquid: boolean
  setLiquid: (value: boolean) => void
  settings: Settings
  updateSettings: (value: Partial<Settings>) => void
}
function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* Preferences remain usable in memory. */
  }
}
const Context = createContext<Preferences | null>(null)
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = read('theme', '跟随系统')
    return themes.find((theme) => theme === saved) ?? '跟随系统'
  })
  const [liquid, setLiquid] = useState(() => read('liquid', 'false') === 'true')
  const [settings, setSettings] = useState<Settings>({
    modelProxy: read('modelProxy', ''),
    pluginProxy: read('pluginProxy', ''),
    programProxy: read('programProxy', ''),
    concurrency: read('concurrency', '2 个任务'),
  })
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === '深色' || (theme === '跟随系统' && media.matches)
          ? 'dark'
          : 'light'
      window.windowControls?.setTheme(
        document.documentElement.dataset.theme === 'dark',
      )
    }
    apply()
    media.addEventListener('change', apply)
    save('theme', theme)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.dataset.liquid = String(liquid)
    save('liquid', String(liquid))
  }, [liquid])
  return (
    <Context.Provider
      value={{
        theme,
        setTheme,
        liquid,
        setLiquid,
        settings,
        updateSettings: (update) =>
          setSettings((current) => {
            for (const [key, value] of Object.entries(update)) save(key, value)
            return { ...current, ...update }
          }),
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function usePreferences() {
  const context = useContext(Context)
  if (!context) throw new Error('PreferencesProvider is missing')
  return context
}
