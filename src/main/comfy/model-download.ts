import { mkdir, realpath, open, unlink, link } from 'node:fs/promises'
import { join, relative, isAbsolute } from 'node:path'
export interface DownloadModel { name: string; type: string; base: string; description: string; filename: string; folder: string; url: string; size: string }
export function modelCatalog(data: { models?: Record<string, unknown>[] }): DownloadModel[] {
 const defaults: Record<string, string> = { checkpoint: 'checkpoints', lora: 'loras', vae: 'vae', controlnet: 'controlnet', upscale: 'upscale_models', embeddings: 'embeddings' }
 return (data.models || []).flatMap(m => {
  const folder = String(m.save_path === 'default' ? defaults[String(m.type)] || '' : m.save_path || '')
  const filename = String(m.filename || '')
  if (!folder || !folder.split('/').every(p => /^[a-zA-Z0-9_-]+$/.test(p)) || !/^[a-zA-Z0-9_. -]+\.(safetensors|ckpt|pt|pth|bin|onnx|gguf)$/i.test(filename)) return []
  try { const url = new URL(String(m.url)); if (url.protocol !== 'https:' || url.username || url.password) return [] } catch { return [] }
  return [{ name: String(m.name), type: String(m.type), base: String(m.base || ''), description: String(m.description || ''), filename, folder, url: String(m.url), size: String(m.size || '未知') }]
 }).sort((a,b) => a.name.localeCompare(b.name))
}
export async function downloadModel(root: string, model: DownloadModel, fetcher: (url: string) => Promise<Response>, progress: (bytes: number, total: number) => void) {
 const base = await realpath(root)
 let dir = base
 for (const part of ['models', ...model.folder.split('/')]) {
  dir = join(dir, part); await mkdir(dir, { recursive: true })
  const actual = await realpath(dir); const rel = relative(base, actual)
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('模型目录指向程序目录之外。')
 }
 const target = join(dir, model.filename), partial = target + '.part'
 const file = await open(partial, 'wx')
 try {
  const response = await fetcher(model.url)
  if (!response.ok || !response.body) throw new Error(`下载失败：HTTP ${response.status}，受限模型可能需要登录授权。`)
  if (/text\/html|application\/json/.test(response.headers.get('content-type') || '')) throw new Error('下载地址返回了网页而不是模型。')
  const total = Number(response.headers.get('content-length')) || 0
  let bytes = 0, last = 0
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
   await file.writeFile(chunk); bytes += chunk.length
   if (Date.now() - last > 200) { progress(bytes, total); last = Date.now() }
  }
  if (!bytes || total && total !== bytes) throw new Error('下载不完整。')
  await file.close(); await link(partial, target); progress(bytes, total)
 } finally { await file.close().catch(() => {}); await unlink(partial).catch(() => {}) }
 return target
}
