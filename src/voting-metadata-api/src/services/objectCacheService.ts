export interface IObjectCacheService {
  getAndCache<T>(
    cacheKey: string,
    generator: (existing: T | undefined) => Promise<T>,
    staleAfterSeconds?: number,
    returnStaleResult?: boolean
  ): Promise<T>

  put<T>(cacheKey: string, data: T): Promise<void>
}



