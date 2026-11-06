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
  trash?: (path: string) => Promise<void>,
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
    output('正在连接仓库并下载插件…')
    const staging = await mkdtemp(join(directory, '.install-'))
    try {
      await command('git', ['-c', `http.proxy=${validated}`, 'clone', '--progress', '--depth', '1', '--', url.href, join(staging, name)], root, output)
      output('正在保存插件文件…')
      await rename(join(staging, name), target)
      output('插件文件安装完成')
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
  if (value.replace(/\.disabled$/, '') === 'websocket_image_save.py') throw new Error('这是 ComfyUI 内置文件，不作为插件管理。')
  if (action === 'check-update') {
    if (!info.isDirectory()) throw new Error('单文件插件不支持 Git 更新检查。')
    const git = (args: string[]) => new Promise<string>((resolve, reject) => execFile('git', args, { cwd: path, windowsHide: true, timeout: 120000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve(stdout.trim())))
    if (await realpath(await git(['rev-parse', '--show-toplevel'])) !== await realpath(path)) throw new Error('该插件没有独立 Git 仓库，无法检查更新。')
    const branch = await git(['symbolic-ref', '--short', 'HEAD'])
    if (!branch) throw new Error('插件处于固定提交，无法确定更新分支。')
    const remote = await git(['config', `branch.${branch}.remote`])
    const merge = await git(['config', `branch.${branch}.merge`])
    const url = await git(['remote', 'get-url', remote])
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(url) || !merge.startsWith('refs/heads/')) throw new Error('仅支持 GitHub HTTPS 跟踪分支的更新检查。')
    await git([...(validated ? ['-c', `http.proxy=${validated}`] : []), 'fetch', '--no-tags', url, merge])
    const [ahead, behind] = (await git(['rev-list', '--left-right', '--count', 'HEAD...FETCH_HEAD'])).split(/\s+/).map(Number)
    const message = behind ? `有更新：落后 ${behind} 个提交${ahead ? `，本地另有 ${ahead} 个提交` : ''}` : '当前分支没有可用更新'
    output(message)
    return message
  }
  if (action === 'delete') {
    if (!trash) throw new Error('回收站不可用')
    await trash(path)
    output('插件已移入回收站')
    return
  }
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
