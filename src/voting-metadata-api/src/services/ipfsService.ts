export interface IIpfsService {
  get<T>(cid: string): Promise<T>
  getBuffer(cid: string): Promise<[Buffer, string]>
  put<T>(data: T): Promise<{ cid: string }>
  getCID<T>(data: T): Promise<string>
  getBufferCID(data: Buffer): Promise<string>
  putBuffer(data: Buffer, mimeType: string): Promise<{ cid: string }>
}
