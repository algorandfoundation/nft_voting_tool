import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from "multiformats/dist/types/src/hashes/sha2"
import { singleton } from 'tsyringe'
import type { IIpfsService } from "./ipfsService"

@singleton()
export class InMemoryIPFSService implements IIpfsService {
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