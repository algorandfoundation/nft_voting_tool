import { IocContainer } from '@tsoa/runtime'
import { join } from 'node:path'
import { container, Lifecycle } from 'tsyringe'
import { PinataStorageWithCache } from '@makerx/node-ipfs'
import { S3ObjectCache, FileSystemObjectCache } from '@makerx/node-cache'
import { IIpfsService, IpfsService } from './services/ipfsService'
import { S3 } from '@aws-sdk/client-s3'

const env = process.env.NODE_ENV || 'development'
const isDevelop = env === 'development'

// Use filesystem in development, S3 in production
const cache = isDevelop
  ? new FileSystemObjectCache(join(__dirname, '..', '.cache'), true)
  : new S3ObjectCache(
      new S3({
        region: process.env.AWS_REGION || 'us-west-1',
      }),
      process.env.CACHE_BUCKET_NAME || 'nft-voting-tool-api-developer-cache',
    )

// Inject the IPFS Service
container.register<IIpfsService>(
  'IIpfsService',
  {
    useClass: IpfsService,
  },
  {
    lifecycle: Lifecycle.Singleton,
  },
)

// Inject MakerX IPFS
container.register<PinataStorageWithCache>('PinataStorageWithCache', {
  useFactory(_) {
    if (typeof process.env.IPFS_API_TOKEN === 'undefined') {
      throw new Error('Must have a valid IPFS_API_TOKEN')
    }
    return new PinataStorageWithCache(process.env.IPFS_API_TOKEN, cache)
  },
})

export const iocContainer: IocContainer = {
  get: <T>(controller: { prototype: T }): T => {
    return container.resolve<T>(controller as never)
  },
}

export { container }
export default iocContainer
