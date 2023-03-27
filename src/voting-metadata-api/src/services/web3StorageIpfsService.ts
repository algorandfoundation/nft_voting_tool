import axios from 'axios'
import * as mime from 'mime'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, singleton } from 'tsyringe'
import { File, Web3Storage } from 'web3.storage'
import { IIpfsService } from './ipfsService'
import type { IObjectCacheService } from './objectCacheService'

@singleton()
export class Web3StorageWithCacheIpfsService implements IIpfsService {
  private cache: IObjectCacheService
  private storage: Web3Storage

  constructor(
    @inject('Web3StorageClient') storage: Web3Storage,
    @inject('IObjectCacheService') cache: IObjectCacheService
  ) {
    this.storage = storage
    this.cache = cache
  }

  async get<T>(cid: string): Promise<T> {
    return await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      async (_e) => {
        const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`)
        const json = await response.data.json()
        return json as T
      },
      undefined,
      true
    )
  }

  async getBuffer(cid: string): Promise<[Buffer, string]> {
    return await this.cache.getAndCacheBuffer(
      `ipfs-${cid}`,
      async (_e) => {
        const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`, {
          responseType: 'arraybuffer',
        })
        const mimeType =
          (response.headers['Content-Type'] as string) ??
          'application/octet-stream'
        const buffer = (await response.data) as ArrayBuffer
        return Promise.resolve([Buffer.from(buffer), mimeType])
      },
      undefined,
      undefined,
      true
    )
  }

  async put<T>(data: T): Promise<{ cid: string }> {
    const file = await this.storage.put(
      [
        new File([JSON.stringify(data)], 'data.json', {
          type: 'application/json',
        }),
      ],
      {
        wrapWithDirectory: false,
      }
    )
    // Save time later if we need to retrieve it again
    await this.cache.put(`ipfs-${file}`, data)
    return { cid: file.toString() }
  }

  async putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }> {
    const extension = mime.getExtension(mimeType)
    const file = await this.storage.put(
      [new File([data], `data.${extension}`, { type: mimeType })],
      {
        wrapWithDirectory: false,
      }
    )
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
