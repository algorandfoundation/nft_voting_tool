import fs from 'fs/promises'
import { glob } from 'glob'
import * as mime from 'mime'
import path from 'path'
import { inject, singleton } from 'tsyringe'
import { IObjectCacheService } from './objectCacheService'

@singleton()
export class FileSystemObjectCacheService implements IObjectCacheService {
  private cacheDirectory: string

  constructor(@inject('CacheDirectory') cacheDirectory: string) {
    this.cacheDirectory = cacheDirectory
  }

  async put<T>(cacheKey: string, data: T): Promise<void> {
    await this.putBuffer(cacheKey, Buffer.from(JSON.stringify(data)), 'application/json')
  }

  async getAndCache<T>(
    cacheKey: string,
    generator: (existing: T | undefined) => Promise<T>,
    staleAfterSeconds?: number,
    returnStaleResult?: boolean,
  ): Promise<T> {
    const cachePath = path.join(this.cacheDirectory, `${cacheKey}.json`)
    const existingCache = await fs.stat(cachePath).catch((_) => false)
    const expired =
      staleAfterSeconds && typeof existingCache !== 'boolean' && (+new Date() - +existingCache.mtime) / 1000 > staleAfterSeconds

    if (!existingCache || expired) {
      console.debug(
        !existingCache
          ? `Cache value '${cacheKey}' empty; getting data for the first time`
          : `Cache value '${cacheKey}' expired: ${existingCache.mtime.toISOString()}`,
      )
      try {
        const existingJson = existingCache ? await fs.readFile(cachePath, { encoding: 'utf-8' }) : undefined
        const existing = existingJson ? (JSON.parse(existingJson) as T) : undefined
        const value = await generator(existing)
        await this.put(cacheKey, value)
        console.log(`Cached value '${cacheKey}' written to ${cachePath}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (existingCache && returnStaleResult) {
          console.error(e)
          console.warn(
            `Received error ${e?.message || e} when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`,
          )
        } else {
          throw e
        }
      }
    } else {
      console.debug(`Found cached value '${cacheKey}' at ${cachePath} which is within ${staleAfterSeconds} seconds old so using that`)
    }

    const valueJson = await fs.readFile(cachePath, { encoding: 'utf-8' })
    const value = JSON.parse(valueJson) as T
    return value
  }

  async getAndCacheBuffer(
    cacheKey: string,
    generator: (existing: Buffer | undefined) => Promise<[Buffer, string]>,
    mimeType: string | undefined,
    staleAfterSeconds?: number | undefined,
    returnStaleResult?: boolean | undefined,
  ): Promise<[Buffer, string]> {
    if (mimeType === undefined) {
      mimeType = 'application/octet-stream'
      const searchPattern = path.join(this.cacheDirectory, `${cacheKey}.*`)
      const files = await glob(searchPattern, { windowsPathsNoEscape: true })
      if (files.length > 0) {
        mimeType = mime.getType(files[0]) ?? 'application/octet-stream'
      }
    }
    const extension = mime.getExtension(mimeType)
    const cachePath = path.join(this.cacheDirectory, `${cacheKey}.${extension}`)
    const existingCache = await fs.stat(cachePath).catch((_) => false)
    const expired =
      staleAfterSeconds && typeof existingCache !== 'boolean' && (+new Date() - +existingCache.mtime) / 1000 > staleAfterSeconds

    if (!existingCache || expired) {
      console.debug(
        !existingCache
          ? `Cache value '${cacheKey}' empty; getting data for the first time`
          : `Cache value '${cacheKey}' expired: ${existingCache.mtime.toISOString()}`,
      )
      try {
        const existingStream = existingCache ? await fs.readFile(cachePath, { encoding: 'utf-8' }) : undefined
        const existingBuffer = existingStream ? Buffer.from(existingStream) : undefined
        const [value, type] = await generator(existingBuffer)
        await this.putBuffer(cacheKey, value, type)
        console.log(`Cached value '${cacheKey}' written to ${cachePath}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (existingCache && returnStaleResult) {
          console.error(e)
          console.warn(
            `Received error ${e?.message || e} when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`,
          )
        } else {
          throw e
        }
      }
    } else {
      console.debug(`Found cached value '${cacheKey}' at ${cachePath} which is within ${staleAfterSeconds} seconds old so using that`)
    }

    const valueStream = await fs.readFile(cachePath, { encoding: 'utf-8' })
    const valueBuffer = Buffer.from(valueStream)
    return [valueBuffer, mimeType]
  }

  async putBuffer(cacheKey: string, data: Buffer, mimeType: string): Promise<void> {
    const extension = mime.getExtension(mimeType)
    const cachePath = path.join(this.cacheDirectory, `${cacheKey}.${extension}`)
    await fs.writeFile(cachePath, data, {
      encoding: 'utf-8',
    })
  }
}
