export function validateProxy(value: unknown): string {
  if (typeof value !== 'string') throw new Error('代理地址必须为文本')
  const text = value.trim()
  if (!text) return ''
  let url: URL
  try {
    url = new URL(text)
  } catch {
    throw new Error('请输入完整代理地址，例如 http://127.0.0.1:7890')
  }
  if (
    !['http:', 'https:', 'socks5:', 'socks5h:'].includes(url.protocol) ||
    !url.hostname ||
    url.search ||
    url.hash ||
    (url.pathname && url.pathname !== '/')
  )
    throw new Error(
      '代理支持 HTTP、HTTPS、SOCKS5 和 SOCKS5H，地址不能包含路径或查询参数',
    )
  if (url.username || url.password)
    throw new Error('请使用不含账号密码的本地代理地址')
  return text
}
