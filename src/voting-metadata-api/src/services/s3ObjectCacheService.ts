import { S3 } from "aws-sdk"
import { registry, singleton } from "tsyringe"
import { IObjectCacheService } from "./objectCacheService"

@singleton()
@registry([
    {
        token: S3,
        useFactory: (c) => {
            return new S3({
                region: process.env.AWS_REGION,
            })
        }
    },
    {
        token: 'bucket',
        useValue: process.env.CACHE_BUCKET_NAME!
    }
])
export class S3ObjectCacheService implements IObjectCacheService {
    private s3Client: S3
    private bucket: string

    constructor(s3Client: S3, bucket: string) {
        this.s3Client = s3Client
        this.bucket = bucket
    }

    async put<T>(cacheKey: string, data: T): Promise<void> {
        const zlib = require('zlib')
        const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}.json.gz` }
        await this.s3Client
            .putObject({
                ...bucketAndKey,
                Body: zlib.gzipSync(JSON.stringify(data, null, 2)),
            })
            .promise()
    }

    async getAndCache<T>(
        cacheKey: string,
        generator: (existing: T | undefined) => Promise<T>,
        staleAfterSeconds?: number,
        returnStaleResult?: boolean
    ): Promise<T> {
        const zlib = require('zlib')
        const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}.json.gz` }
        const existingCache = await this.s3Client
            .getObject(bucketAndKey)
            .promise()
            .catch(() => undefined)
        const expired =
            staleAfterSeconds && existingCache && (+new Date() - +existingCache.LastModified!) / 1000 > staleAfterSeconds

        const existingJson = !!existingCache ? zlib.gunzipSync(existingCache.Body!).toString('utf-8') : undefined
        const existing = !!existingCache ? (JSON.parse(existingJson) as T) : undefined

        let value = existing
        if (!existing || expired) {
            console.debug(
                !existingCache
                    ? `Cache value '${cacheKey}' empty; getting data for the first time`
                    : `Cache value '${cacheKey}' expired: ${existingCache.LastModified!.toISOString()}`
            )
            try {
                value = await generator(existing)
                await this.put(cacheKey, value)
                console.log(`Cached value '${cacheKey}.json' written`)
            } catch (e: any) {
                if (existingCache && returnStaleResult) {
                    console.error(e)
                    console.warn(
                        `Received error ${e?.message || e
                        } when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`
                    )
                } else {
                    throw e
                }
            }
        } else {
            console.debug(
                `Found cached value '${cacheKey}.json' which is within ${staleAfterSeconds} seconds old so using that`
            )
        }

        return value!
    }
}