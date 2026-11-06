import { spawn } from 'node:child_process'
import { lstat, mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { saveVerifiedDownload } from '../portable/verified-download.ts'
import { findEmbeddedPython } from '../runtime/python.ts'
import { readInstallation } from './read-installation.ts'

const releaseApi = 'https://api.github.com/repos/Comfy-Org/ComfyUI/releases/latest'
const releaseBase = 'https://github.com/Comfy-Org/ComfyUI/releases/download/'
const archiveName = 'ComfyUI_windows_portable_nvidia.7z'

async function readPortable(path: string) {
  const program = join(path, 'ComfyUI')
  if (!(await findEmbeddedPython(program, 'win32')))
    throw new Error('便携版缺少自带的 Python，请检查目录内容。')
  await readInstallation(program)
}

export async function acquirePortable(
  destination: string,
  signal: AbortSignal,
  fetchOfficial: (url: string, options: RequestInit) => Promise<Response>,
  extract = extractPortable,
) {
  signal.throwIfAborted()
  if (await lstat(destination).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })) {
    await readPortable(destination).catch(() => {
      throw new Error('便携版目录已存在，但缺少完整的 ComfyUI 或 Python。请检查该目录后重试。')
    })
    signal.throwIfAborted()
    return destination
  }

  const response = await fetchOfficial(releaseApi, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok)
    throw new Error(`无法读取 ComfyUI 官方发布信息（HTTP ${response.status}）。`)
  const release = await response.json()
  const { tag_name: tag, assets } = release ?? {}
  const asset = Array.isArray(assets)
    ? assets.find((item) => item?.name === archiveName)
    : undefined
  if (
    release?.draft ||
    release?.prerelease ||
    typeof tag !== 'string' ||
    !/^v?\d+\.\d+\.\d+$/.test(tag) ||
    asset?.browser_download_url !== releaseBase + tag + '/' + archiveName ||
    !/^sha256:[a-f0-9]{64}$/.test(asset.digest ?? '') ||
    !Number.isSafeInteger(asset.size) ||
    asset.size <= 0 ||
    asset.size > 12 * 1024 ** 3
  )
    throw new Error('官方发布中没有可校验的 Windows 便携包。')

  const staging = await mkdtemp(join(dirname(destination), '.comfy-portable-'))
  try {
    const archive = join(staging, archiveName)
    const downloadSignal = AbortSignal.any([signal, AbortSignal.timeout(60 * 60 * 1000)])
    const download = await fetchOfficial(asset.browser_download_url, {
      signal: downloadSignal,
    })
    await saveVerifiedDownload(download, asset, archive, downloadSignal)

    const unpacked = join(staging, 'unpacked')
    await mkdir(unpacked)
    await extract(archive, unpacked, signal)
    const portable = join(unpacked, basename(destination))
    await readPortable(portable)
    signal.throwIfAborted()
    await rename(portable, destination)
    return destination
  } finally {
    await rm(staging, { recursive: true, force: true, maxRetries: 3 })
  }
}

function extractPortable(archive: string, destination: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const tar = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
    const child = spawn(tar, ['-xf', archive, '-C', destination], {
      windowsHide: true,
      stdio: 'ignore',
      signal: AbortSignal.any([signal, AbortSignal.timeout(30 * 60 * 1000)]),
    })
    // Wait for the process to exit before removing files it could still hold.
    child.on('error', () => {})
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('便携包解压失败，请检查 Windows 的 tar.exe、磁盘空间和目录权限。'))
    })
  })
}
