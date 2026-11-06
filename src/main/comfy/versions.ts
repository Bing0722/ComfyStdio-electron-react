import { execFile } from 'node:child_process'
import { realpath } from 'node:fs/promises'
import { validateProxy } from '../../shared/proxy.ts'
const official = 'https://github.com/Comfy-Org/ComfyUI.git'
function git(root: string, args: string[]) {
  return new Promise<string>((resolve, reject) => execFile('git', args, {
    cwd: root, windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 ** 2,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  }, (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve(stdout.trim())))
}
export async function manageVersions(root: string, action: string, tag = '', proxy = '') {
  const top = await git(root, ['rev-parse', '--show-toplevel'])
  if (await realpath(top) !== await realpath(root)) throw new Error('当前目录不是独立 Git 仓库，无法切换版本。')
  if (action === 'fetch') {
    const validated = validateProxy(proxy)
    await git(root, [...(validated ? ['-c', `http.proxy=${validated}`] : []), 'fetch', '--no-tags', official, 'refs/tags/*:refs/comfystdio/releases/*'])
  } else if (action === 'switch') {
    if (!/^v?\d+\.\d+\.\d+$/.test(tag)) throw new Error('版本号无效。')
    if (await git(root, ['status', '--porcelain'])) throw new Error('当前目录有本地改动，请先保存或处理后再切换。')
    await git(root, ['-c', 'core.hooksPath=', 'checkout', '--detach', `refs/comfystdio/releases/${tag}`])
  } else if (action !== 'status') throw new Error('未知版本操作。')
  return {
    commit: await git(root, ['rev-parse', 'HEAD']),
    branch: await git(root, ['branch', '--show-current']),
    tag: await git(root, ['describe', '--tags', '--exact-match']).catch(() => ''),
    dirty: Boolean(await git(root, ['status', '--porcelain'])),
    tags: (await git(root, ['for-each-ref', '--sort=-version:refname', '--format=%(refname:strip=3)', 'refs/comfystdio/releases/'])).split('\n').filter(tag => /^v?\d+\.\d+\.\d+$/.test(tag)),
  }
}
