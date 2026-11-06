import { readdir, readFile, stat, realpath } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import type { ComfyInstallation, Model, Plugin } from '../../shared/comfy-api'

const modelExtensions = new Set([
  '.safetensors',
  '.ckpt',
  '.pt',
  '.pt2',
  '.pkl',
  '.pth',
  '.bin',
  '.gguf',
  '.onnx',
  '.sft',
])
const categories: Record<string, string> = {
  checkpoints: 'Checkpoint',
  loras: 'LoRA',
  vae: 'VAE',
  controlnet: 'ControlNet',
}
const exists = async (path: string) => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}
async function readSmallFile(path: string) {
  if ((await stat(path)).size > 1024 * 1024)
    throw new Error('Metadata file too large')
  return readFile(path, 'utf8')
}
/** Read metadata only. Never imports Python, executes plugins or changes the installation. */
export async function readInstallation(
  selectedPath: string,
): Promise<ComfyInstallation> {
  let root = await realpath(selectedPath)
  if (
    !(await exists(join(root, 'main.py'))) &&
    (await exists(join(root, 'ComfyUI', 'main.py')))
  )
    root = join(root, 'ComfyUI')
  if (
    !(await exists(join(root, 'main.py'))) ||
    !(await exists(join(root, 'folder_paths.py')))
  )
    throw new Error(
      '所选目录不是 ComfyUI：需要 main.py 和 folder_paths.py。请选择 ComfyUI 根目录。',
    )
  const warnings: string[] = []
  const models: Model[] = []
  const plugins: Record<string, Plugin> = {}
  const modelsPath = join(root, 'models')
  const pluginsPath = join(root, 'custom_nodes')
  let version = '未识别版本'
  try {
    version =
      (await readSmallFile(join(root, 'comfyui_version.py'))).match(
        /__version__\s*=\s*['"]([^'"]+)['"]/,
      )?.[1] ?? version
  } catch {
    /* Version metadata is optional in older installs. */
  }
  if (version !== '未识别版本' && !version.startsWith('v'))
    version = `v${version}`
  let visited = 0
  const walk = async (directory: string, depth: number): Promise<void> => {
    if (depth > 16 || visited >= 20000) {
      warnings.push('模型目录较大，本次扫描已达到深度或文件数量限制。')
      return
    }
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      warnings.push(`无法读取模型目录：${directory}`)
      return
    }
    for (const entry of entries) {
      if (++visited > 20000) {
        warnings.push('模型文件数量超过扫描上限，列表可能不完整。')
        break
      }
      const path = join(directory, entry.name)
      if (entry.isSymbolicLink()) {
        warnings.push(`符号链接未扫描：${path}`)
        continue
      }
      if (entry.isDirectory()) {
        await walk(path, depth + 1)
        continue
      }
      if (
        !entry.isFile() ||
        !modelExtensions.has(extname(entry.name).toLowerCase())
      )
        continue
      try {
        const info = await stat(path)
        const parts = relative(modelsPath, path).split(/[\\/]/)
        const category = parts[0]
        models.push({
          id: path,
          name: entry.name,
          type: categories[category] ?? (parts.length > 1 ? category : '其他'),
          size: info.size / 1024 ** 3,
          source: '本地文件',
          path,
        })
      } catch {
        warnings.push(`无法读取模型文件：${path}`)
      }
    }
  }
  await walk(modelsPath, 0)
  try {
    const entries = await readdir(pluginsPath, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name === '__pycache__') continue
      const path = join(pluginsPath, entry.name)
      if (entry.isSymbolicLink()) {
        warnings.push(`插件符号链接未扫描：${path}`)
        continue
      }
      if (
        !entry.isDirectory() &&
        !(entry.isFile() && /\.py(?:\.disabled)?$/.test(entry.name))
      )
        continue
      let pluginVersion = '未识别'
      if (entry.isDirectory()) {
        try {
          const metadata = await readSmallFile(join(path, 'pyproject.toml'))
          const project = metadata.match(/\[project\]([\s\S]*?)(?=\n\[|$)/)?.[1]
          pluginVersion =
            project?.match(/^version\s*=\s*['"]([^'"]+)['"]/m)?.[1] ??
            pluginVersion
        } catch {
          /* Custom nodes need not publish a version. */
        }
      }
      plugins[entry.name] = {
        name: entry.name,
        description: entry.isDirectory()
          ? '本地自定义节点目录'
          : '本地自定义节点文件',
        version: pluginVersion,
        enabled: !entry.name.endsWith('.disabled'),
        updateAvailable: false,
        path,
      }
    }
  } catch {
    warnings.push(`无法读取插件目录：${pluginsPath}`)
  }
  if (await exists(join(root, 'extra_model_paths.yaml')))
    warnings.push(
      '检测到 extra_model_paths.yaml；本次仅扫描当前 ComfyUI 的 models，尚未解析额外路径。',
    )
  return {
    path: root,
    modelsPath,
    pluginsPath,
    version,
    source: 'local',
    readAt: new Date().toISOString(),
    models: models.sort((a, b) => a.name.localeCompare(b.name)),
    plugins,
    warnings: [...new Set(warnings)].slice(0, 30),
  }
}
