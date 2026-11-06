import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { PortablePaths } from '../portable/paths'
import { storedPath, writeConfig } from '../portable/state.ts'

export function pythonSelections(paths: PortablePaths) {
  const file = join(paths.data, 'python.json')
  const selections = new Map<string, string>()
  try {
    const saved = JSON.parse(readFileSync(file, 'utf8'))
    const entries = Array.isArray(saved.selections) ? saved.selections : [saved]
    for (const entry of entries) {
      if (typeof entry?.root === 'string' && typeof entry?.python === 'string')
        selections.set(
          resolve(paths.root, entry.root),
          resolve(paths.root, entry.python),
        )
    }
  } catch {}
  return {
    get: (root: string) => selections.get(root),
    save(root: string, python: string) {
      const updated = new Map(selections).set(root, python)
      writeConfig(file, {
        selections: [...updated].map(([root, python]) => ({
          root: storedPath(paths.root, root),
          python: storedPath(paths.root, python),
        })),
      })
      selections.set(root, python)
    },
  }
}
