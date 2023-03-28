import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, singleton } from 'tsyringe'
import { MemoryCacheRecord } from '../models/memoryCacheRecord'
import { CloudFlareIPFSService } from './cloudflareIpfsService'
import type { IIpfsService } from './ipfsService'

@singleton()
export class InMemoryIPFSService implements IIpfsService {
  private cache: Record<string, MemoryCacheRecord> = {}
  private cloudflareIpfsService: CloudFlareIPFSService

  constructor(@inject('CloudFlareIPFSService') cloudflareIpfsService: CloudFlareIPFSService) {
    this.cloudflareIpfsService = cloudflareIpfsService
  }

  async get<T>(cid: string): Promise<T> {
    const cached = this.cache[cid]
    if (!cached) {
      const result = await this.cloudflareIpfsService.get<T>(cid)
      await this.put(result)
      return result
    }

    return JSON.parse(cached.Data.toString('utf-8')) as T
  }

  async getBuffer(cid: string): Promise<[Buffer, string]> {
    const cached = this.cache[cid]
    if (!cached) {
      const [result, mimeType] = await this.cloudflareIpfsService.getBuffer(cid)
      await this.putBuffer(result, mimeType)
      return [result, mimeType]
    }

    return [cached.Data, cached.ContentType]
  }

  async put<T>(data: T): Promise<{ cid: string }> {
    const cid = await this.getCID(data)
    this.cache[cid] = {
      ContentType: 'application/json',
      Data: Buffer.from(JSON.stringify(data)),
    }
    return { cid: cid }
  }

  async putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }> {
    const cid = await this.getCID(data)
    this.cache[cid] = {
      ContentType: mimeType,
      Data: data,
    }
    return { cid: cid }
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
