import { inject, singleton } from 'tsyringe'
import { PinataStorageWithCache } from '@makerx/node-ipfs'

export interface IIpfsService {
  getBuffer(cid: string): Promise<Uint8Array>
  putFile(file: Express.Multer.File, name?: string): Promise<{ cid: string }>
}

@singleton()
export class IpfsService implements IIpfsService {
  private ipfs: PinataStorageWithCache

  constructor(@inject('PinataStorageWithCache') ipfs: PinataStorageWithCache) {
    this.ipfs = ipfs
  }
  getTitleFromFile(file: Express.Multer.File) {
    let name = file.originalname
    if (file.mimetype === 'application/json') {
      const data = JSON.parse(file.buffer.toString())
      if (typeof data.title === 'string') {
        name = `${data.title}-${name}`
      }
    }
    return name
  }
  getBuffer(cid: string): Promise<Uint8Array> {
    return this.ipfs.getBlob(cid)
  }
  putFile(file: Express.Multer.File, name?: string): Promise<{ cid: string }> {
    return this.ipfs.putBlob(file.buffer, file.mimetype, name || this.getTitleFromFile(file))
  }
}
