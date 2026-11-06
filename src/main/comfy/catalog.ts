import type { CatalogPlugin } from '../../shared/comfy-api'
export function parseCatalog(data: unknown): CatalogPlugin[] {
  const nodes = (data as { custom_nodes?: unknown[] })?.custom_nodes
  if (!Array.isArray(nodes)) throw new Error('插件目录格式无效。')
  const entries = new Map<string, CatalogPlugin>()
  for (const raw of nodes) {
    const item = raw as Record<string, unknown>
    if (!item || item.install_type !== 'git-clone' || !Array.isArray(item.files) || item.files.length !== 1) continue
    const url = item.files[0]
    if (typeof url !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(url) || typeof item.title !== 'string') continue
    entries.set(url.toLowerCase(), { url, title: item.title.slice(0, 200), author: String(item.author || '').slice(0, 200), description: String(item.description || '').slice(0, 1500) })
  }
  return [...entries.values()].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }))
}

export function attachStars(items: CatalogPlugin[], data: Record<string, { stars?: number; last_update?: string }>): CatalogPlugin[] {
 const stats = new Map(Object.entries(data).map(([url, value]) => [url.toLowerCase().replace(/\.git$/, ''), value]))
 return items.map(item => {
  const value = stats.get(item.url.toLowerCase().replace(/\.git$/, ''))
  return { ...item, stars: Number.isSafeInteger(value?.stars) && value!.stars! >= 0 ? value!.stars : undefined, updated: typeof value?.last_update === 'string' ? value.last_update : undefined }
 })
}
