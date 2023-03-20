import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { ObjectCache } from './cache'

export interface IPFS {
  get<T>(cid: string): Promise<T>
  put<T>(data: T): Promise<{ cid: string }>
  getCID<T>(data: T): Promise<string>
}

export class InMemoryIPFS implements IPFS {
  private cache: Record<string, string> = {}

  async get<T>(cid: string): Promise<T> {
    const cached = this.cache[cid]
    if (!cached) {
      throw new Error('404')
    }

    return JSON.parse(cached) as T
  }

  async put<T>(data: T): Promise<{ cid: string }> {
    const cid = await this.getCID(data)
    this.cache[cid] = JSON.stringify(data)
    return { cid: cid }
  }

  async getCID<T>(data: T): Promise<string> {
    const bytes = raw.encode(Buffer.from(JSON.stringify(data)))
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, raw.code, hash)
    return cid.toString()
  }
}

export class CacheOnlyIPFS implements IPFS {
  private cache: ObjectCache

  constructor(cache: ObjectCache) {
    this.cache = cache
  }

  async get<T>(cid: string): Promise<T> {
    return await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      (_e) => {
        throw new Error('404')
      },
      undefined,
      true
    )
  }

  async put<T>(data: T): Promise<{ cid: string }> {
    const cid = await this.getCID(data)
    await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      (_e) => {
        return Promise.resolve(data)
      },
      0,
      false
    )
    return { cid: cid.toString() }
  }

  async getCID<T>(data: T): Promise<string> {
    const bytes = raw.encode(Buffer.from(JSON.stringify(data)))
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, raw.code, hash)
    return cid.toString()
  }
}
