import type { IconName } from '../components/ui/Icon'
import type { PageId } from '../state/types'
export const navigation: {
  id: PageId
  label: string
  icon: IconName
  description: string
}[] = [
  {
    id: 'instances',
    label: '启动',
    icon: 'terminal',
    description: '选择实例，启动 ComfyUI。',
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
    description: '管理安装版本与实例使用的版本。',
  },
  {
    id: 'plugins',
    label: '插件',
    icon: 'plugins',
    description: '管理当前实例的自定义节点。',
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    description: '外观、下载与网络偏好。',
  },
]
