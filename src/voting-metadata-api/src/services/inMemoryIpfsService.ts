import axios from 'axios'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { singleton } from 'tsyringe'
import type { IIpfsService } from './ipfsService'

@singleton()
export class InMemoryIPFSService implements IIpfsService {
  private cache: Record<string, MemoryCacheRecord> = {}

  async get<T>(cid: string): Promise<T> {
    const cached = this.cache[cid]
    if (!cached) {
      const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`)
      const json = await response.data.json()
      return json as T
    }

    return JSON.parse(cached.Data.toString('utf-8')) as T
  }

  async getBuffer(cid: string): Promise<[Buffer, string]> {
    const cached = this.cache[cid]
    if (!cached) {
      const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`, {
        responseType: 'arraybuffer',
      })
      const mimeType = (response.headers['content-type'] as string) ?? 'application/octet-stream'
      const buffer = (await response.data) as ArrayBuffer
      return Promise.resolve([Buffer.from(buffer), mimeType])
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
