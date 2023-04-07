import { S3 } from '@aws-sdk/client-s3'
import { SecretsManager } from '@aws-sdk/client-secrets-manager'
import { IocContainer } from '@tsoa/runtime'
import fs from 'fs'
import path from 'path'
import { container, Lifecycle } from 'tsyringe'
import { Web3Storage } from 'web3.storage'
import { AwsSecretsService } from './services/awsSecretsService'
import { CacheOnlyIPFSService } from './services/cacheOnlyIpfsService'
import { CloudFlareIPFSService } from './services/cloudflareIpfsService'
import { FileSystemObjectCacheService } from './services/fileSystemObjectCacheService'
import { IIpfsService } from './services/ipfsService'
import { IObjectCacheService } from './services/objectCacheService'
import { S3ObjectCacheService } from './services/s3ObjectCacheService'
import { Web3StorageWithCacheIpfsService } from './services/web3StorageIpfsService'

const env = process.env.NODE_ENV || 'development'

container.register<CloudFlareIPFSService>('CloudFlareIPFSService', {
  useClass: CloudFlareIPFSService,
})

if (env === 'development') {
  const cacheDir = path.join(__dirname, '..', '.cache')
  container.register<string>('CacheDirectory', {
    useValue: cacheDir,
  })
  if (!fs.existsSync(cacheDir)) {
    console.log(`${cacheDir} not found, creating it...`)
    fs.mkdirSync(cacheDir)
  }
  container.register<IObjectCacheService>(
    'IObjectCacheService',
    {
      useClass: FileSystemObjectCacheService,
    },
    {
      lifecycle: Lifecycle.Singleton,
    },
  )
  container.register<IIpfsService>(
    'IIpfsService',
    {
      useClass: CacheOnlyIPFSService,
    },
    {
      lifecycle: Lifecycle.Singleton,
    },
  )
} else {
  container.register<S3>('S3Client', {
    useFactory: (_) => {
      return new S3({
        region: process.env.AWS_REGION,
      })
    },
  })
  container.register<string>('S3Bucket', {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    useValue: process.env.CACHE_BUCKET_NAME!,
  })
  container.register<IObjectCacheService>(
    'IObjectCacheService',
    {
      useClass: S3ObjectCacheService,
    },
    {
      lifecycle: Lifecycle.Singleton,
    },
  )
  container.register<Web3Storage>('Web3StorageClient', {
    useFactory: (_) => {
      return new Web3Storage({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        token: process.env.WEB3_STORAGE_API_TOKEN!,
      })
    },
  })
  container.register<IIpfsService>(
    'IIpfsService',
    {
      useClass: Web3StorageWithCacheIpfsService,
    },
    {
      lifecycle: Lifecycle.Singleton,
    },
  )
  container.register<SecretsManager>('SecretsManager', {
    useFactory: (_) => {
      return new SecretsManager({
        region: process.env.AWS_REGION,
      })
    },
  })
  container.register<AwsSecretsService>(
    'AwsSecretsService',
    {
      useClass: AwsSecretsService,
    },
    {
      lifecycle: Lifecycle.Singleton,
    },
  )
}

export const iocContainer: IocContainer = {
  get: <T>(controller: { prototype: T }): T => {
    return container.resolve<T>(controller as never)
  },
}

export { container }
export default iocContainer
