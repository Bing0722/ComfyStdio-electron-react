import type { VersionStatus } from '../../../../shared/comfy-api'
type Entry = { value?: VersionStatus; error?: string; pending?: Promise<VersionStatus> }
const entries = new Map<string, Entry>()
export function cachedVersions(path: string) { return entries.get(path) }
export function saveVersions(path: string, value: VersionStatus) { entries.set(path, { value }) }
export function loadVersions(path: string, fetch: () => Promise<VersionStatus>, refresh = false): Promise<VersionStatus> {
  const cached = entries.get(path)
  if (cached?.pending) return cached.pending
  if (!refresh && cached) {
    if (cached.error) return Promise.reject(new Error(cached.error))
    if (cached.value) return Promise.resolve(cached.value)
  }
  const entry: Entry = { value: cached?.value }
  entries.set(path, entry)
  entry.pending = Promise.resolve().then(fetch).then(value => {
    entry.value = value; entry.error = undefined
    return value
  }, error => {
    entry.error = error instanceof Error ? error.message : String(error)
    throw error
  }).finally(() => { entry.pending = undefined })
  return entry.pending
}
