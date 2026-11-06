import { dirname, join, resolve } from 'node:path'
import { mkdirSync, accessSync, constants, realpathSync } from 'node:fs'
export function portableRoot(
  execPath: string,
  platform: string,
  developmentRoot?: string,
) {
  return developmentRoot
    ? resolve(developmentRoot)
    : platform === 'darwin'
      ? resolve(dirname(execPath), '../../..')
      : dirname(execPath)
}
export function preparePortable(root: string) {
  const resolved = realpathSync(root)
  const paths = {
    root: resolved,
    data: join(resolved, 'Data'),
    comfy: join(resolved, 'ComfyUI'),
    userData: join(resolved, 'Data/profile'),
    sessionData: join(resolved, 'Data/session'),
    temp: join(resolved, 'Data/temp'),
    logs: join(resolved, 'Data/logs'),
    crashDumps: join(resolved, 'Data/crashes'),
    updates: join(resolved, 'Data/updates'),
    cache: join(resolved, 'Data/cache'),
  }
  for (const [key, path] of Object.entries(paths))
    if (!['root', 'comfy'].includes(key)) {
      mkdirSync(path, { recursive: true })
      accessSync(path, constants.W_OK)
    }
  return paths
}
export type PortablePaths = ReturnType<typeof preparePortable>
export function runtimeEnvironment(paths: PortablePaths) {
  return {
    TEMP: paths.temp,
    TMP: paths.temp,
    TMPDIR: paths.temp,
    XDG_CACHE_HOME: paths.cache,
    HF_HOME: join(paths.cache, 'huggingface'),
    TORCH_HOME: join(paths.cache, 'torch'),
    PIP_CACHE_DIR: join(paths.cache, 'pip'),
    PYTHONPYCACHEPREFIX: join(paths.cache, 'pycache'),
    PYTHONUSERBASE: join(paths.data, 'python-user'),
    MPLCONFIGDIR: join(paths.cache, 'matplotlib'),
    NUMBA_CACHE_DIR: join(paths.cache, 'numba'),
    CUDA_CACHE_PATH: join(paths.cache, 'cuda'),
  }
}
