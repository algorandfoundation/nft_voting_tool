import { IocContainer } from '@tsoa/runtime';
import { S3, SecretsManager } from 'aws-sdk';
import path from 'path';
import { container } from 'tsyringe';
import { CacheOnlyIPFSService } from './services/cacheOnlyIpfsService';
import { FileSystemObjectCacheService } from './services/fileSystemObjectCacheService';
import { InMemoryIPFSService } from './services/inMemoryIpfsService';
import { IIpfsService } from './services/ipfsService';
import { IObjectCacheService } from './services/objectCacheService';
import { S3ObjectCacheService } from './services/s3ObjectCacheService';

let env = process.env.NODE_ENV || 'development';

if (env === 'development') {
    container.register<string>("CacheDirectory", {
        useValue: path.join(__dirname, "..", ".cache")
    });
    container.register<IObjectCacheService>("IObjectCacheService", {
        useClass: FileSystemObjectCacheService
    });
    container.register<IIpfsService>("IIpfsService", {
        useClass: InMemoryIPFSService
    });
}
else {
    container.register<S3>("S3Client", {
        useFactory: (_) => {
            return new S3({
                region: process.env.AWS_REGION,
            })
        }
    });
    container.register<string>("S3Bucket", {
        useValue: process.env.CACHE_BUCKET_NAME!
    });
    container.register<IObjectCacheService>("IObjectCacheService", {
        useClass: S3ObjectCacheService
    });
    container.register<IIpfsService>("IIpfsService", {
        useClass: CacheOnlyIPFSService
    });
    container.register<SecretsManager>("SecretsManager", {
        useFactory: (_) => {
            return new SecretsManager({
                region: process.env.AWS_REGION
            })
        }
    });
}

export const iocContainer: IocContainer = {
    get: <T>(controller: { prototype: T }): T => {
        return container.resolve<T>(controller as never);
    },
};

export { container };
export default iocContainer;