import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, singleton } from 'tsyringe'
import { NotFoundException } from '../models/errors/httpResponseException'
import { IIpfsService } from "./ipfsService"
import { IObjectCacheService } from "./objectCacheService"

@singleton()
export class CacheOnlyIPFSService implements IIpfsService {
    private cache: IObjectCacheService

    constructor(@inject('IObjectCacheService') cache: IObjectCacheService) {
        this.cache = cache
    }

    async getBuffer(cid: string): Promise<[Buffer, string]> {
        return await this.cache.getAndCacheBuffer(
            `ipfs-${cid}`,
            (_e) => {
                throw new NotFoundException(`Could not find IPFS object with CID: ${cid}`)
            },
            undefined,
            undefined,
            true
        )
    }

    async get<T>(cid: string): Promise<T> {
        return await this.cache.getAndCache<T>(
            `ipfs-${cid}`,
            (_e) => {
                throw new NotFoundException(`Could not finf IPFS object with CID: ${cid}`)
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

    async putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }> {
        const cid = await this.getBufferCID(data)
        await this.cache.getAndCacheBuffer(
            `ipfs-${cid}`,
            (_e) => {
                return Promise.resolve([data, mimeType])
            },
            mimeType,
            0,
            false
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
