import type { ComfyInstallation, Model, WorkspaceState } from './types'
export const modelCatalog: Model[] = [
  {
    id: 'flux-dev',
    name: 'FLUX.1 · Dev',
    type: 'Checkpoint',
    size: 23.8,
    source: 'Black Forest Labs',
  },
  {
    id: 'sdxl-base',
    name: 'SDXL Base 1.0',
    type: 'Checkpoint',
    size: 6.9,
    source: 'Stability AI',
  },
  {
    id: 'film-lora',
    name: 'Film Photography',
    type: 'LoRA',
    size: 0.2,
    source: 'Community',
  },
  {
    id: 'sdxl-vae',
    name: 'SDXL VAE',
    type: 'VAE',
    size: 0.3,
    source: 'Stability AI',
  },
  {
    id: 'control-depth',
    name: 'ControlNet · Depth',
    type: 'ControlNet',
    size: 2.5,
    source: 'Community',
  },
]
export const modelTypes = [
  '全部类型',
  'Checkpoint',
  'LoRA',
  'VAE',
  'ControlNet',
  '其他',
]
export const modelFolders: Record<string, string> = {
  Checkpoint: 'checkpoints',
  LoRA: 'loras',
  VAE: 'vae',
  ControlNet: 'controlnet',
}
export const versionCatalog = [
  { version: 'v0.3.26', channel: '稳定版', date: '2025-04-17' },
  { version: 'v0.3.25', channel: '稳定版', date: '2025-04-14' },
  { version: 'nightly', channel: '开发版', date: '2025-04-11' },
]
export const latestDemoVersion = versionCatalog[0].version
export const pluginCatalog = [
  {
    name: 'ComfyUI Manager',
    description: '管理自定义节点与依赖',
    version: '1.1',
  },
  {
    name: 'ComfyUI Impact Pack',
    description: '图像细化、分割与检测节点',
    version: '1.1',
  },
  {
    name: 'ComfyUI Essentials',
    description: '常用图像与工作流工具',
    version: '1.1',
  },
]
export function createWorkspace(): WorkspaceState {
  return {
    comfy: null,
    read: { phase: 'idle', requestId: 0, error: '' },
    runtime: { status: '已停止', logs: [] },
    downloads: [],
    versionTask: null,
  }
}
/** Fixture is loaded only after an explicit demo read; never shown as disk contents. */
export function createDemoInstallation(): ComfyInstallation {
  const path = '/demo/ComfyUI'
  return {
    path,
    modelsPath: `${path}/models`,
    pluginsPath: `${path}/custom_nodes`,
    version: 'v0.3.25',
    source: 'demo',
    readAt: new Date().toISOString(),
    warnings: [],
    models: modelCatalog
      .slice(1, 4)
      .map((model) => ({
        ...model,
        path: `${path}/models/${modelFolders[model.type]}/${model.id}.safetensors`,
      })),
    plugins: Object.fromEntries(
      pluginCatalog
        .slice(0, 2)
        .map((plugin, index) => [
          plugin.name,
          {
            ...plugin,
            version: index === 0 ? '1.0' : plugin.version,
            enabled: true,
            updateAvailable: index === 0,
            path: `${path}/custom_nodes/${plugin.name.replaceAll(' ', '-')}`,
          },
        ]),
    ),
  }
}
