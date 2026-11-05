import type { Model, WorkspaceState } from './types'

export const modelCatalog: Model[] = [
  {
    id: 1,
    name: 'FLUX.1 · Dev',
    type: 'Checkpoint',
    size: 23.8,
    source: 'Black Forest Labs',
  },
  {
    id: 2,
    name: 'SDXL Base 1.0',
    type: 'Checkpoint',
    size: 6.9,
    source: 'Stability AI',
  },
  {
    id: 3,
    name: 'Film Photography',
    type: 'LoRA',
    size: 0.2,
    source: 'Community',
  },
  { id: 4, name: 'SDXL VAE', type: 'VAE', size: 0.3, source: 'Stability AI' },
  {
    id: 5,
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
]
export const versionCatalog = [
  { version: 'v0.3.26', channel: '稳定版', date: '2025-04-17' },
  { version: 'v0.3.25', channel: '稳定版', date: '2025-04-14' },
  { version: 'nightly', channel: '开发版', date: '2025-04-11' },
]
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
    instanceId: 'studio',
    instances: [
      {
        id: 'studio',
        name: '创作工作室',
        path: '/demo/studio/ComfyUI',
        version: 'v0.3.26',
        status: '已停止',
        logs: [],
      },
      {
        id: 'lab',
        name: '实验空间',
        path: '/demo/lab/ComfyUI',
        version: 'v0.3.26',
        status: '已停止',
        logs: [],
      },
    ],
    downloads: [],
    models: modelCatalog.slice(1, 4),
    versions: ['v0.3.26'],
    defaultVersion: 'v0.3.26',
    plugins: {
      studio: {
        'ComfyUI Manager': {
          version: '1.0',
          enabled: true,
          updateAvailable: true,
        },
        'ComfyUI Impact Pack': {
          version: '1.1',
          enabled: true,
          updateAvailable: false,
        },
      },
      lab: {},
    },
  }
}
