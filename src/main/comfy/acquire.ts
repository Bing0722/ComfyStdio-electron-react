import { validateProxy } from '../../shared/proxy.ts'
import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
export async function acquireComfy(
  parent: string,
  signal: AbortSignal,
  clone = cloneOfficial,
  proxy = '',
) {
  signal.throwIfAborted()
  const validated = validateProxy(proxy)
  const destination = join(parent, 'ComfyUI')
  await mkdir(destination).catch(() => {
    throw new Error('目标位置已有 ComfyUI 或无法写入，请选择其他文件夹。')
  })
  try {
    await clone(destination, signal, validated)
    signal.throwIfAborted()
    return destination
  } catch (error) {
    await rm(destination, { recursive: true, force: true })
    throw error
  }
}
function cloneOfficial(
  destination: string,
  signal: AbortSignal,
  proxy: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'git',
      [
        '-c',
        `http.proxy=${proxy}`,
        'clone',
        '--depth',
        '1',
        '--',
        'https://github.com/Comfy-Org/ComfyUI.git',
        destination,
      ],
      {
        windowsHide: true,
        timeout: 600_000,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      },
      (error) => {
        signal.removeEventListener('abort', cancel)
        if (signal.aborted) reject(new Error('已取消获取'))
        else if (error)
          reject(
            new Error(
              '获取失败：请确认已安装 Git、网络可访问 GitHub，且目标位置空间充足。',
            ),
          )
        else resolve()
      },
    )
    const cancel = () => {
      child.kill()
    }
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) cancel()
  })
}
