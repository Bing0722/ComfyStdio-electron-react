export const releaseBase =
  'https://github.com/Bing0722/ComfyStdio-electron-react/releases/download/'
export interface ReleaseAsset {
  name: string
  browser_download_url: string
  digest: string
  size: number
}
export function newerVersion(candidate: string, current: string) {
  if (!/^v?\d+\.\d+\.\d+$/.test(candidate) || !/^\d+\.\d+\.\d+$/.test(current))
    return false
  const a = candidate.replace(/^v/, '').split('.').map(Number),
    b = current.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}
function officialAssetUrl(value: unknown) {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.origin === 'https://github.com' &&
      url.pathname.startsWith(
        '/Bing0722/ComfyStdio-electron-react/releases/download/',
      ) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}
export function selectAsset(
  release: { tag_name?: string; assets?: ReleaseAsset[] },
  platform: string,
  arch: string,
) {
  const version = release.tag_name?.replace(/^v/, '')
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return undefined
  const name = `ComfyStdio-${version}-${platform}-${arch}.zip`
  return release.assets?.find(
    (asset) =>
      asset.name === name &&
      officialAssetUrl(asset.browser_download_url) &&
      /^sha256:[a-f0-9]{64}$/.test(asset.digest ?? '') &&
      asset.size > 0 &&
      asset.size < 1024 ** 3,
  )
}
