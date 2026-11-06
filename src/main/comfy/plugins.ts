import { execFile } from 'node:child_process'
import { lstat, mkdir, mkdtemp, rename, rm, realpath } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { resolvePython } from '../runtime/python.ts'
import { validateProxy } from '../../shared/proxy.ts'

function command(file: string, args: string[], cwd: string, output: (text: string) => void) {
  return new Promise<void>((resolve, reject) => {
    const child = execFile(file, args, {
      cwd, windowsHide: true, timeout: 900_000, maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', PIP_NO_INPUT: '1' },
    }, (error, stdout, stderr) => {
      if (error) reject(new Error((stderr || stdout || error.message).slice(-12000)))
      else resolve()
    })
    child.stdout?.on("data", (chunk) => output(String(chunk)))
    child.stderr?.on("data", (chunk) => output(String(chunk)))
  })
}
export async function managePlugin(
  root: string,
  python: string | undefined,
  action: string,
  value: string,
  proxy: string,
  output: (text: string) => void = () => {},
) {
  const validated = validateProxy(proxy)
  const directory = join(root, 'custom_nodes')
  await mkdir(directory, { recursive: true })
  if (action === 'install') {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
      throw new Error('请输入不含账号密码和查询参数的 HTTPS Git 仓库地址。')
    const name = basename(url.pathname).replace(/\.git$/, '')
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || name.endsWith('.disabled'))
      throw new Error('仓库名称无效。')
    const target = join(directory, name)
    if (await lstat(target).catch(() => null))
      throw new Error('该插件已存在。')
    const staging = await mkdtemp(join(directory, '.install-'))
    try {
      await command('git', ['-c', `http.proxy=${validated}`, 'clone', '--depth', '1', '--', url.href, join(staging, name)], root, output)
      await rename(join(staging, name), target)
    } finally {
      await rm(staging, { recursive: true, force: true })
    }
    return
  }
  if (basename(value) !== value || value.startsWith('.') || !value)
    throw new Error('插件名称无效。')
  const path = join(directory, value)
  const info = await lstat(path)
  if (info.isSymbolicLink() || dirname(await realpath(path)) !== await realpath(directory))
    throw new Error('不支持修改目录外的插件。')
  if (action === 'dependencies') {
    if (!info.isDirectory()) throw new Error('单文件插件没有依赖清单。')
    const requirements = join(path, 'requirements.txt')
    if (!(await lstat(requirements)).isFile())
      throw new Error('插件没有 requirements.txt。')
    const selected = await resolvePython(root, python)
    if (!python && !selected.embedded && ['python', 'python3'].includes(selected.executable))
      throw new Error('请先在启动页选择 Python，或在 ComfyUI 中配置虚拟环境。')
    await command(selected.executable, [
      '-m', 'pip', '--isolated', 'install', '--disable-pip-version-check',
      ...(validated ? ['--proxy', validated] : []), '-r', requirements,
    ], path, output)
    return
  }
  if (action !== 'toggle') throw new Error('未知插件操作。')
  const target = value.endsWith('.disabled') ? path.slice(0, -9) : path + '.disabled'
  if (await lstat(target).catch(() => null)) throw new Error('目标名称已存在。')
  await rename(path, target)
}
