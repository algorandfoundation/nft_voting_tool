import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { inject, registry, singleton } from 'tsyringe'
import { IIpfsService } from "./ipfsService"
import { IObjectCacheService } from "./objectCacheService"
import { S3ObjectCacheService } from './s3ObjectCacheService'

@singleton()
@registry([
    {
        token: 'IObjectCacheService',
        useClass: S3ObjectCacheService
    }
])
export class CacheOnlyIPFSService implements IIpfsService {
    private cache: IObjectCacheService

    constructor(@inject('IObjectCacheService') cache: IObjectCacheService) {
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
