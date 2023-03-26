import fs from 'fs/promises'
import path from 'path'
import { singleton } from 'tsyringe'
import { IObjectCacheService } from "./objectCacheService"

@singleton()
export class FileSystemObjectCacheService implements IObjectCacheService {
    private cacheDirectory: string
    constructor(cacheDirectory: string) {
        this.cacheDirectory = cacheDirectory
    }

    async put<T>(cacheKey: string, data: T): Promise<void> {
        const cachePath = path.join(this.cacheDirectory, `${cacheKey}.json`)
        await fs.writeFile(cachePath, JSON.stringify(data, null, 2), {
            encoding: 'utf-8',
        })
    }

    async getAndCache<T>(
        cacheKey: string,
        generator: (existing: T | undefined) => Promise<T>,
        staleAfterSeconds?: number,
        returnStaleResult?: boolean
    ): Promise<T> {
        const cachePath = path.join(this.cacheDirectory, `${cacheKey}.json`)
        const existingCache = await fs.stat(cachePath).catch((e) => false)
        const expired =
            staleAfterSeconds &&
            typeof existingCache !== 'boolean' &&
            (+new Date() - +existingCache.mtime) / 1000 > staleAfterSeconds

        if (!existingCache || expired) {
            console.debug(
                !existingCache
                    ? `Cache value '${cacheKey}' empty; getting data for the first time`
                    : `Cache value '${cacheKey}' expired: ${existingCache.mtime.toISOString()}`
            )
            try {
                const existingJson = existingCache ? await fs.readFile(cachePath, { encoding: 'utf-8' }) : undefined
                const existing = existingJson ? (JSON.parse(existingJson) as T) : undefined
                const value = await generator(existing)
                await this.put(cacheKey, value)
                console.log(`Cached value '${cacheKey}' written to ${cachePath}`)
            } catch (e: any) {
                if (existingCache && returnStaleResult) {
                    console.error(e)
                    console.warn(
                        `Received error ${e?.message || e
                        } when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`
                    )
                } else {
                    throw e
                }
            }
        } else {
            console.debug(
                `Found cached value '${cacheKey}' at ${cachePath} which is within ${staleAfterSeconds} seconds old so using that`
            )
        }

        const valueJson = await fs.readFile(cachePath, { encoding: 'utf-8' })
        const value = JSON.parse(valueJson) as T
        return value
    }
}
