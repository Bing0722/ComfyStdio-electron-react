import type { IconName } from '../components/ui/Icon'
import type { PageId } from '../state/types'
export const navigation: {
  id: PageId
  label: string
  icon: IconName
  description: string
}[] = [
  {
    id: 'about',
    label: '关于',
    icon: 'terminal',
    description: '设备与 ComfyUI 运行环境信息。',
  },
  {
    id: 'launch',
    label: '启动',
    icon: 'terminal',
    description: '读取并启动当前 ComfyUI。',
  },
  {
    id: 'downloads',
    label: '模型下载',
    icon: 'download',
    description: '浏览模型，管理下载任务。',
  },
  {
    id: 'models',
    label: '模型管理',
    icon: 'models',
    description: '查看和整理本地模型。',
  },
  {
    id: 'versions',
    label: 'ComfyUI 版本',
    icon: 'versions',
    description: '切换或更新当前 ComfyUI 的版本。',
  },
  {
    id: 'plugins',
    label: '插件',
    icon: 'plugins',
    description: '读取当前 ComfyUI 的自定义节点。',
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    description: '外观、下载与网络偏好。',
  },
]
