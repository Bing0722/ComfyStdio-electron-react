export function pluginResult(message: string) {
  if (!message) return ''
  if (message.startsWith('失败')) return message.includes('依赖安装失败') ? '依赖安装失败 · 请查看运行日志' : '操作失败 · 请查看运行日志'
  if (message.startsWith('跳过')) return '已跳过 · 请查看运行日志'
  if (message.startsWith('有更新')) return '有可用更新'
  if (message.includes('没有可用更新')) return '已是最新'
  if (message.includes('代码与依赖已同步')) return '更新完成'
  return '处理完成'
}
export function pluginProgress(message: string) {
  if (/刷新/.test(message)) return '正在刷新插件信息…'
  if (/保存|安装完成/.test(message)) return '正在保存插件…'
  if (/依赖/.test(message)) return '正在安装依赖…'
  return '正在下载插件…'
}
