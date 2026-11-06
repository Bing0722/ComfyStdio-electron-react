import { stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export async function findEmbeddedPython(
  path: string,
  platform = process.platform,
) {
  if (platform !== 'win32') return
  const python = join(dirname(path), 'python_embeded', 'python.exe')
  if (await isFile(python)) return python
}

async function isFile(path: string) {
  return (await stat(path).catch(() => null))?.isFile() ?? false
}

export async function resolvePython(path: string, selected?: string) {
  const embedded = await findEmbeddedPython(path)
  if (selected) return { executable: selected, embedded: selected === embedded }
  if (embedded) return { executable: embedded, embedded: true }
  const windows = process.platform === 'win32'
  for (const environment of ['.venv', 'venv']) {
    const python = join(
      path,
      environment,
      windows ? 'Scripts/python.exe' : 'bin/python',
    )
    if (await isFile(python)) return { executable: python, embedded: false }
  }
  return { executable: windows ? 'python' : 'python3', embedded: false }
}
