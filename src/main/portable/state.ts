import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join, relative, isAbsolute, resolve } from 'node:path'
import type { PortablePaths } from './paths'
export function storedPath(root: string, path: string) {
  const rel = relative(root, path)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : path
}
export function readCurrentPath(paths: PortablePaths) {
  try {
    const data = JSON.parse(
      readFileSync(join(paths.data, 'workspace.json'), 'utf8'),
    )
    return typeof data.comfy === 'string'
      ? resolve(paths.root, data.comfy)
      : paths.comfy
  } catch {
    return paths.comfy
  }
}
export function saveCurrentPath(paths: PortablePaths, path: string) {
  writeConfig(join(paths.data, 'workspace.json'), {
    comfy: storedPath(paths.root, path),
  })
}
export function writeConfig(file: string, data: object) {
  writeFileSync(file + '.tmp', JSON.stringify(data, null, 2))
  renameSync(file + '.tmp', file)
}
