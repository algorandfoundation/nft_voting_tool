import * as mime from 'mime'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, singleton } from 'tsyringe'
import { File, Web3Storage } from 'web3.storage'
import { CloudFlareIPFSService } from './cloudflareIpfsService'
import { IIpfsService } from './ipfsService'
import type { IObjectCacheService } from './objectCacheService'

@singleton()
export class Web3StorageWithCacheIpfsService implements IIpfsService {
  private cache: IObjectCacheService
  private storage: Web3Storage
  private cloudflareIpfsService: CloudFlareIPFSService
  private cacheMissDuration: number | undefined

  constructor(
    @inject('Web3StorageClient') storage: Web3Storage,
    @inject('IObjectCacheService') cache: IObjectCacheService,
    @inject('CloudFlareIPFSService') cloudflareIpfsService: CloudFlareIPFSService,
    @inject('CacheMissDuration') cacheMissDuration: number | undefined,
  ) {
    this.storage = storage
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
    console.debug('PUT: data into storage cache')
    const file = await this.storage.put(
      [
        new File([JSON.stringify(data)], 'data.json', {
          type: 'application/json',
        }),
      ],
      {
        wrapWithDirectory: false,
      },
    )
    console.debug('PUT: data into cache')
    // Save time later if we need to retrieve it again
    await this.cache.put(`ipfs-${file}`, data)
    return { cid: file.toString() }
  }

  async putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }> {
    console.debug('PUT: buffer into storage and cache')
    const extension = mime.getExtension(mimeType)
    const file = await this.storage.put([new File([data], `data.${extension}`, { type: mimeType })], {
      wrapWithDirectory: false,
    })
    console.debug('PUT: data into cache')
    // Save time later if we need to retrieve it again
    await this.cache.putBuffer(`ipfs-${file}`, data, mimeType)
    return { cid: file.toString() }
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
