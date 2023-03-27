export interface IObjectCacheService {
  getAndCache<T>(
    cacheKey: string,
    generator: (existing: T | undefined) => Promise<T>,
    staleAfterSeconds?: number,
    returnStaleResult?: boolean,
  ): Promise<T>

  put<T>(cacheKey: string, data: T): Promise<void>

  getAndCacheBuffer(
    cacheKey: string,
    generator: (existing: Buffer | undefined) => Promise<[Buffer, string]>,
    mimeType: string | undefined,
    staleAfterSeconds?: number,
    returnStaleResult?: boolean,
  ): Promise<[Buffer, string]>

  putBuffer(cacheKey: string, data: Buffer, mimeType: string): Promise<void>
}
