import { IocContainer } from '@tsoa/runtime'
import { join } from 'node:path'
import { container, Lifecycle } from 'tsyringe'
import { PinataStorageWithCache } from '@makerx/node-ipfs'
import { S3ObjectCache, FileSystemObjectCache } from '@makerx/node-cache'
import { S3 } from '@aws-sdk/client-s3'

import { isDevelopment, assertValidEnv, AWS_REGION, CACHE_BUCKET_NAME, IPFS_API_TOKEN } from './env.js'
import { IIpfsService, IpfsService } from './services/ipfsService.js'
assertValidEnv()

// Use filesystem in development, S3 in production
const cache = isDevelopment
  ? new FileSystemObjectCache(join(__dirname, '..', '.cache'), true)
  : new S3ObjectCache(
      new S3({
        region: AWS_REGION,
      }),
      CACHE_BUCKET_NAME,
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new PinataStorageWithCache(IPFS_API_TOKEN!, cache)
  },
})

export const iocContainer: IocContainer = {
  get: <T>(controller: { prototype: T }): T => {
    return container.resolve<T>(controller as never)
  },
}

export { container }
export default iocContainer
