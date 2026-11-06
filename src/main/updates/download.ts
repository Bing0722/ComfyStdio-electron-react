import { createWriteStream } from 'node:fs'
import { rm, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReleaseAsset } from './release'
export async function saveUpdate(
  response: Response,
  asset: ReleaseAsset,
  file: string,
) {
  const partial = file + '.part'
  try {
    if (!response.ok || !response.body)
      throw new Error('更新包下载失败，请重试')
    const hash = createHash('sha256')
    let size = 0
    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        size += chunk.length
        if (size > asset.size) {
          callback(new Error('更新包大小不符'))
          return
        }
        hash.update(chunk)
        callback(null, chunk)
      },
    })
    await pipeline(
      Readable.fromWeb(response.body as never),
      meter,
      createWriteStream(partial),
    )
    if (size !== asset.size || `sha256:${hash.digest('hex')}` !== asset.digest)
      throw new Error('更新包校验失败，未保留该文件')
    await rename(partial, file)
    return file
  } catch (error) {
    await rm(partial, { force: true })
    throw error
  }
}
