import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import fetch from 'node-fetch'
import { singleton } from 'tsyringe'
import { File, Web3Storage } from 'web3.storage'
import { IIpfsService } from './ipfsService'
import type { IObjectCacheService } from './objectCacheService'

@singleton()
export class Web3StorageWithCacheService implements IIpfsService {
  private cache: IObjectCacheService
  private storage: Web3Storage

  constructor(storage: Web3Storage, cache: IObjectCacheService) {
    this.storage = storage
    this.cache = cache
  }

  async get<T>(cid: string): Promise<T> {
    return await this.cache.getAndCache<T>(
      `ipfs-${cid}`,
      async (_e) => {
        const response = await fetch(`https://${cid}.ipfs.cf-ipfs.com/`)
        const json = await response.json()
        return json as T
      },
      undefined,
      true
    )
  }

  async put<T>(data: T): Promise<{ cid: string }> {
    const file = await this.storage.put([new File([JSON.stringify(data)], 'data.json', { type: 'application/json' })], {
      wrapWithDirectory: false,
    })
    // Save time later if we need to retrieve it again
    await this.cache.put(`ipfs-${file}`, data)
    return { cid: file.toString() }
  }

  async getCID<T>(data: T): Promise<string> {
    const bytes = raw.encode(Buffer.from(JSON.stringify(data)))
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, raw.code, hash)
    return cid.toString()
  }
}
