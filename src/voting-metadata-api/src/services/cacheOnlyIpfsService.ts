import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, singleton } from 'tsyringe'
import { CloudFlareIPFSService } from './cloudflareIpfsService'
import { IIpfsService } from './ipfsService'
import { IObjectCacheService } from './objectCacheService'

@singleton()
export class CacheOnlyIPFSService implements IIpfsService {
  private cache: IObjectCacheService
  private cloudflareIpfsService: CloudFlareIPFSService
  private cacheMissDuration: number | undefined

  constructor(
    @inject('IObjectCacheService') cache: IObjectCacheService,
    @inject('CloudFlareIPFSService') cloudflareIpfsService: CloudFlareIPFSService,
    @inject('CacheMissDuration') cacheMissDuration: number | undefined,
  ) {
    this.cache = cache
    this.cloudflareIpfsService = cloudflareIpfsService
    this.cacheMissDuration = cacheMissDuration
  }

  async get<T>(cid: string): Promise<T> {
    return await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      async (_e) => {
        return await this.cloudflareIpfsService.get<T>(cid)
      },
      this.cacheMissDuration,
      true,
    )
  }

  async getBuffer(cid: string): Promise<[Buffer, string]> {
    return await this.cache.getAndCacheBuffer(
      `ipfs-${cid}`,
      async (_e) => {
        return await this.cloudflareIpfsService.getBuffer(cid)
      },
      undefined,
      this.cacheMissDuration,
      true,
    )
  }
  async put<T>(data: T): Promise<{ cid: string }> {
    const cid = await this.getCID(data)
    await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      (_e) => {
        return Promise.resolve(data)
      },
      undefined,
      false,
    )
    return { cid: cid.toString() }
  }

  async putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }> {
    const cid = await this.getBufferCID(data)
    await this.cache.getAndCacheBuffer(
      `ipfs-${cid}`,
      (_e) => {
        return Promise.resolve([data, mimeType])
      },
      mimeType,
      undefined,
      false,
    )
    return { cid: cid.toString() }
  }

  async getCID<T>(data: T): Promise<string> {
    return this.getBufferCID(Buffer.from(JSON.stringify(data)))
  }

  async getBufferCID(data: Buffer): Promise<string> {
    const bytes = raw.encode(data)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, raw.code, hash)
    return cid.toString()
  }
}
