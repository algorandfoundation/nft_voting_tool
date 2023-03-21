export interface IIpfsService {
  get<T>(cid: string): Promise<T>
  put<T>(data: T): Promise<{ cid: string }>
  getCID<T>(data: T): Promise<string>
}
